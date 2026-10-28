import {
  account,
  type AuthCredentialLock,
  createRuntimeDatabase,
  createUuidV7,
  session,
  user,
  verification,
} from "@vowora/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";
import { z } from "zod";

import { readAuthEnvironment } from "./env";
import {
  createResendPasswordResetEmailSender,
  createResendVerificationEmailSender,
  type SendPasswordResetEmail,
  type SendVerificationEmail,
} from "./verification-email";
import { correlationIdFor, problemResponse } from "./api";
import {
  type AuthAbuseProtection,
  createUpstashAuthAbuseProtection,
  trustedVercelClientAddress,
} from "./auth-abuse";

type AuthDatabase = Parameters<typeof drizzleAdapter>[0];
type PasswordImplementation = {
  readonly hash?: (password: string) => Promise<string>;
  readonly verify?: (input: {
    readonly hash: string;
    readonly password: string;
  }) => Promise<boolean>;
};

const credentialLocks = new WeakMap<object, AuthCredentialLock>();
const abuseProtections = new WeakMap<object, AuthAbuseProtection>();

export function createVoworaAuth(options: {
  readonly baseURL: string;
  readonly backgroundTaskHandler: (promise: Promise<unknown>) => void;
  readonly database: AuthDatabase;
  readonly rateLimitEnabled?: boolean;
  readonly scheduleBackgroundTask: (task: () => Promise<void>) => void;
  readonly secret: string;
  readonly sendVerificationEmail: SendVerificationEmail;
  readonly sendPasswordResetEmail: SendPasswordResetEmail;
  readonly withCredentialLock: AuthCredentialLock;
  readonly password?: PasswordImplementation;
  readonly abuseProtection?: AuthAbuseProtection;
}) {
  const abuseProtection =
    options.abuseProtection ??
    (options.rateLimitEnabled === false
      ? {
          async evaluate() {
            return { outcome: "allow" as const };
          },
        }
      : undefined);
  if (!abuseProtection) {
    throw new Error("Authentication abuse protection is required");
  }
  const auth = betterAuth({
    appName: "Vowora",
    logger: { disabled: true },
    telemetry: { enabled: false },
    baseURL: options.baseURL,
    basePath: "/api/v1/auth",
    secret: options.secret,
    trustedOrigins: [options.baseURL],
    database: drizzleAdapter(options.database, {
      provider: "pg",
      schema: { user, session, account, verification },
      transaction: true,
    }),
    advanced: {
      cookiePrefix: "vowora",
      useSecureCookies: new URL(options.baseURL).protocol === "https:",
      crossSubDomainCookies: { enabled: false },
      database: { generateId: () => createUuidV7() },
      backgroundTasks: { handler: options.backgroundTaskHandler },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      ...(options.password ? { password: options.password } : {}),
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user: recipient, url }) => {
        options.scheduleBackgroundTask(async () => {
          try {
            await options.sendPasswordResetEmail({
              recipient: recipient.email,
              resetUrl: url,
            });
          } catch {
            // The single-use token expires and a new request can be made safely.
          }
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 15,
    },
    emailVerification: {
      expiresIn: 60 * 60,
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user: recipient, url }) => {
        options.scheduleBackgroundTask(async () => {
          try {
            await options.sendVerificationEmail({
              recipient: recipient.email,
              verificationUrl: url,
            });
          } catch {
            // The account remains unverified and can safely request another link.
          }
        });
      },
    },
    // The wrapper below uses a managed Redis-compatible atomic store. Better
    // Auth's process-local fallback is disabled so serverless instances cannot
    // independently admit the same attack burst.
    rateLimit: { enabled: false },
    disabledPaths: [
      "/account-info",
      "/change-email",
      "/change-password",
      "/delete-user",
      "/delete-user/callback",
      "/get-access-token",
      "/link-social",
      "/list-accounts",
      "/refresh-token",
      "/revoke-sessions",
      "/set-password",
      "/sign-in/social",
      "/sign-out",
      "/unlink-account",
      "/update-user",
    ],
  });
  credentialLocks.set(auth, options.withCredentialLock);
  abuseProtections.set(auth, abuseProtection);
  return auth;
}

let runtimeAuth: ReturnType<typeof createVoworaAuth> | undefined;

export function getAuth() {
  if (runtimeAuth) return runtimeAuth;
  const environment = readAuthEnvironment();
  const { database, withAuthCredentialLock } = createRuntimeDatabase(
    process.env,
  );
  runtimeAuth = createVoworaAuth({
    baseURL: environment.NEXT_PUBLIC_APP_URL,
    backgroundTaskHandler: (promise) => after(() => promise),
    database,
    scheduleBackgroundTask: (task) => after(task),
    secret: environment.AUTH_SECRET,
    sendVerificationEmail: createResendVerificationEmailSender({
      apiKey: environment.RESEND_API_KEY,
      from: environment.AUTH_EMAIL_FROM,
    }),
    sendPasswordResetEmail: createResendPasswordResetEmailSender({
      apiKey: environment.RESEND_API_KEY,
      from: environment.AUTH_EMAIL_FROM,
    }),
    withCredentialLock: withAuthCredentialLock,
    abuseProtection: createUpstashAuthAbuseProtection({
      redisUrl: environment.UPSTASH_REDIS_REST_URL,
      redisToken: environment.UPSTASH_REDIS_REST_TOKEN,
      hashSecret: environment.AUTH_ABUSE_HASH_SECRET,
      turnstileSecret: environment.TURNSTILE_SECRET_KEY,
      expectedHostname: new URL(environment.NEXT_PUBLIC_APP_URL).hostname,
    }),
  });
  return runtimeAuth;
}

export async function handleAuthRequest(
  auth: ReturnType<typeof createVoworaAuth>,
  request: Request,
  baseURL: string,
): Promise<Response> {
  if (!isSafeStateChangingRequest(request, baseURL)) {
    return problemResponse(request, {
      status: 403,
      title: "Authentication request failed",
      detail: "The authentication request could not be completed.",
      code: "CSRF_VALIDATION_FAILED",
    });
  }
  if (!isAllowedAuthRoute(request)) {
    return problemResponse(request, {
      status: 404,
      title: "Authentication route not found",
      detail: "The requested authentication route is not available.",
      code: "AUTHENTICATION_ROUTE_NOT_FOUND",
    });
  }
  if (!(await hasValidAuthContract(request))) {
    return problemResponse(request, {
      status: 400,
      title: "Authentication request failed",
      detail: "The authentication request could not be completed.",
      code: "AUTHENTICATION_FAILED",
    });
  }
  const callbackURL = await callbackURLFrom(request);
  if (
    callbackURL !== undefined &&
    !isSameOriginCallback(callbackURL, baseURL)
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Authentication request failed",
      detail: "The authentication request could not be completed.",
      code: "AUTHENTICATION_FAILED",
    });
  }
  const abuseProtection = abuseProtections.get(auth);
  if (!abuseProtection) {
    throw new Error("Authentication abuse protection is not configured");
  }
  const abuseKey = await abuseIdentityKey(request);
  if (abuseKey) {
    const blocked = await protectAuthAbuseRequest(
      auth,
      request,
      abuseKey.key,
      abuseKey.rule,
    );
    if (blocked) return blocked;
  }
  const credentialTarget = await credentialLockTarget(request);
  const lock = credentialLocks.get(auth);
  if (!lock) throw new Error("Credential lock is not configured");
  let response: Response;
  try {
    response = credentialTarget
      ? await lock(credentialTarget, () => auth.handler(request))
      : await auth.handler(request);
  } catch {
    return problemResponse(request, {
      status: 500,
      title: "Authentication service unavailable",
      detail: "The authentication request could not be completed.",
      code: "AUTHENTICATION_SERVICE_FAILURE",
    });
  }
  if (
    response.status >= 400 &&
    response.headers.get("content-type")?.includes("application/json")
  ) {
    const problem = problemResponse(request, {
      status: response.status,
      title: "Authentication request failed",
      detail: "The authentication request could not be completed.",
      code: "AUTHENTICATION_FAILED",
    });
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) problem.headers.set("retry-after", retryAfter);
    return problem;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-correlation-id", correlationIdFor(request));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function isSafeStateChangingRequest(
  request: Request,
  baseURL: string,
): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    if (new URL(origin).origin !== new URL(baseURL).origin) return false;
  } catch {
    return false;
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite === null || fetchSite === "same-origin";
}

export function csrfFailure(request: Request): Response {
  return problemResponse(request, {
    status: 403,
    title: "Request origin rejected",
    detail: "The request could not be completed.",
    code: "CSRF_VALIDATION_FAILED",
  });
}

export function authSessionIdentity(request: Request): string {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (
      rawName === "vowora.session_token" ||
      rawName === "__Secure-vowora.session_token"
    ) {
      const value = rawValue.join("=");
      if (value.length > 0 && value.length <= 4096) {
        return `session:${value}`;
      }
    }
  }
  return "session:anonymous";
}

const identityRules = new Map<
  string,
  { windowSeconds: number; maximumAttempts: number }
>([
  ["/api/v1/auth/sign-in/email", { windowSeconds: 60, maximumAttempts: 5 }],
  ["/api/v1/auth/sign-up/email", { windowSeconds: 60, maximumAttempts: 4 }],
  [
    "/api/v1/auth/request-password-reset",
    { windowSeconds: 60, maximumAttempts: 3 },
  ],
  [
    "/api/v1/auth/send-verification-email",
    { windowSeconds: 60, maximumAttempts: 3 },
  ],
  ["/api/v1/auth/reset-password", { windowSeconds: 60, maximumAttempts: 5 }],
]);

async function abuseIdentityKey(request: Request) {
  if (request.method !== "POST") return undefined;
  const path = new URL(request.url).pathname;
  const rule = identityRules.get(path);
  if (!rule) return undefined;
  const body = (await request.clone().json()) as Record<string, unknown>;
  const identity =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : typeof body.token === "string"
        ? body.token
        : "anonymous";
  return { key: `identity:${path}:${identity}`, rule };
}

export async function protectAuthAbuseRequest(
  auth: ReturnType<typeof createVoworaAuth>,
  request: Request,
  identity: string,
  rule: { readonly windowSeconds: number; readonly maximumAttempts: number },
  challengeSupported = true,
): Promise<Response | undefined> {
  const protection = abuseProtections.get(auth);
  if (!protection) {
    throw new Error("Authentication abuse protection is not configured");
  }
  try {
    const decision = await protection.evaluate({
      route: new URL(request.url).pathname,
      identity,
      clientAddress: trustedVercelClientAddress(
        request,
        process.env.VERCEL === "1",
      ),
      challengeToken:
        request.headers.get("x-vowora-challenge-token") ?? undefined,
      rule,
    });
    if (decision.outcome === "allow") return undefined;
    if (decision.outcome === "challenge") {
      if (!challengeSupported) {
        const response = problemResponse(request, {
          status: 429,
          title: "Authentication request delayed",
          detail: "Too many attempts. Please try again later.",
          code: "AUTHENTICATION_RATE_LIMITED",
        });
        response.headers.set("retry-after", String(rule.windowSeconds));
        return response;
      }
      return problemResponse(request, {
        status: 403,
        title: "Additional verification required",
        detail: "Complete the verification challenge and try again.",
        code: "AUTHENTICATION_CHALLENGE_REQUIRED",
      });
    }
    const response = problemResponse(request, {
      status: 429,
      title: "Authentication request delayed",
      detail: "Too many attempts. Please try again later.",
      code: "AUTHENTICATION_RATE_LIMITED",
    });
    response.headers.set("retry-after", String(decision.retryAfter));
    return response;
  } catch {
    return problemResponse(request, {
      status: 503,
      title: "Authentication service unavailable",
      detail: "The authentication request could not be completed.",
      code: "AUTHENTICATION_ABUSE_PROTECTION_UNAVAILABLE",
    });
  }
}

async function credentialLockTarget(
  request: Request,
): Promise<Parameters<AuthCredentialLock>[0] | undefined> {
  const pathname = new URL(request.url).pathname;
  if (
    request.method !== "POST" ||
    (pathname !== "/api/v1/auth/sign-in/email" &&
      pathname !== "/api/v1/auth/reset-password")
  ) {
    return undefined;
  }
  const body = (await request.clone().json()) as Record<string, unknown>;
  if (pathname === "/api/v1/auth/sign-in/email") {
    return { email: String(body.email) };
  }
  return { resetToken: String(body.token) };
}

const allowedAuthRoutes = new Map<string, ReadonlySet<string>>([
  ["/api/v1/auth/get-session", new Set(["GET"])],
  ["/api/v1/auth/send-verification-email", new Set(["POST"])],
  ["/api/v1/auth/sign-in/email", new Set(["POST"])],
  ["/api/v1/auth/sign-up/email", new Set(["POST"])],
  ["/api/v1/auth/verify-email", new Set(["GET"])],
  ["/api/v1/auth/request-password-reset", new Set(["POST"])],
  ["/api/v1/auth/reset-password", new Set(["POST"])],
]);

const callbackURLSchema = z.string().min(1).max(2048);
const emailSchema = z.email().max(320);
const passwordSchema = z.string().min(12).max(128);
const authBodySchemas = new Map<string, z.ZodType>([
  [
    "/api/v1/auth/request-password-reset",
    z.object({ email: emailSchema, redirectTo: callbackURLSchema }).strict(),
  ],
  [
    "/api/v1/auth/reset-password",
    z
      .object({
        newPassword: passwordSchema,
        token: z.string().min(1).max(4096),
      })
      .strict(),
  ],
  [
    "/api/v1/auth/send-verification-email",
    z.object({ email: emailSchema, callbackURL: callbackURLSchema }).strict(),
  ],
  [
    "/api/v1/auth/sign-in/email",
    z
      .object({
        email: emailSchema,
        password: passwordSchema,
        callbackURL: callbackURLSchema,
      })
      .strict(),
  ],
  [
    "/api/v1/auth/sign-up/email",
    z
      .object({
        name: z
          .string()
          .min(1)
          .max(100)
          .refine((value) => value.trim().length > 0),
        email: emailSchema,
        password: passwordSchema,
        callbackURL: callbackURLSchema,
      })
      .strict(),
  ],
]);

function isAllowedAuthRoute(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  if (
    request.method === "GET" &&
    /^\/api\/v1\/auth\/reset-password\/[^/]+$/.test(pathname)
  ) {
    return true;
  }
  return Boolean(allowedAuthRoutes.get(pathname)?.has(request.method));
}

async function hasValidAuthContract(request: Request): Promise<boolean> {
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (/^\/api\/v1\/auth\/reset-password\/[^/]+$/.test(url.pathname)) {
      const token = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
      return (
        token.length > 0 &&
        token.length <= 4096 &&
        url.searchParams.size === 1 &&
        url.searchParams.getAll("callbackURL").length === 1 &&
        callbackURLSchema.safeParse(url.searchParams.get("callbackURL")).success
      );
    }
    if (url.pathname === "/api/v1/auth/get-session") {
      return url.searchParams.size === 0;
    }
    if (url.pathname === "/api/v1/auth/verify-email") {
      const keys = [...url.searchParams.keys()];
      if (keys.some((key) => key !== "token" && key !== "callbackURL")) {
        return false;
      }
      if (
        url.searchParams.getAll("token").length !== 1 ||
        url.searchParams.getAll("callbackURL").length > 1
      ) {
        return false;
      }
      return z
        .object({
          token: z.string().min(1).max(4096),
          callbackURL: callbackURLSchema.optional(),
        })
        .strict()
        .safeParse({
          token: url.searchParams.get("token"),
          callbackURL: url.searchParams.get("callbackURL") ?? undefined,
        }).success;
    }
    return false;
  }
  const schema = authBodySchemas.get(url.pathname);
  if (
    !schema ||
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  ) {
    return false;
  }
  try {
    return schema.safeParse(await request.clone().json()).success;
  } catch {
    return false;
  }
}

async function callbackURLFrom(request: Request): Promise<unknown> {
  const queryValue = new URL(request.url).searchParams.get("callbackURL");
  if (queryValue !== null) return queryValue;
  if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  ) {
    return undefined;
  }
  try {
    const body: unknown = await request.clone().json();
    if (typeof body === "object" && body !== null) {
      if ("callbackURL" in body) {
        return (body as { readonly callbackURL?: unknown }).callbackURL;
      }
      if ("redirectTo" in body) {
        return (body as { readonly redirectTo?: unknown }).redirectTo;
      }
    }
  } catch {
    // Better Auth returns its normal safe malformed-request response.
  }
  return undefined;
}

function isSameOriginCallback(value: unknown, baseURL: string): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return false;
  }
  try {
    return new URL(value, baseURL).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}
