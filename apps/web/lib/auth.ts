import {
  account,
  createRuntimeDatabase,
  createUuidV7,
  session,
  user,
  verification,
} from "@vowora/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";

import { readAuthEnvironment } from "./env";
import {
  createResendVerificationEmailSender,
  type SendVerificationEmail,
} from "./verification-email";
import { correlationIdFor, problemResponse } from "./api";

type AuthDatabase = Parameters<typeof drizzleAdapter>[0];

export function createVoworaAuth(options: {
  readonly baseURL: string;
  readonly backgroundTaskHandler: (promise: Promise<unknown>) => void;
  readonly database: AuthDatabase;
  readonly rateLimitEnabled?: boolean;
  readonly secret: string;
  readonly sendVerificationEmail: SendVerificationEmail;
}) {
  return betterAuth({
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
    },
    emailVerification: {
      expiresIn: 60 * 60,
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user: recipient, url }) => {
        await options.sendVerificationEmail({
          recipient: recipient.email,
          verificationUrl: url,
        });
      },
    },
    // Distributed abuse controls are task 03-c. Keep the framework's bounded
    // local protection enabled until that shared store is introduced.
    rateLimit: { enabled: options.rateLimitEnabled ?? true, storage: "memory" },
    disabledPaths: [
      "/account-info",
      "/change-email",
      "/change-password",
      "/delete-user",
      "/delete-user/callback",
      "/get-access-token",
      "/link-social",
      "/list-accounts",
      "/list-sessions",
      "/refresh-token",
      "/request-password-reset",
      "/reset-password",
      "/reset-password/:token",
      "/revoke-other-sessions",
      "/revoke-session",
      "/revoke-sessions",
      "/set-password",
      "/sign-in/social",
      "/sign-out",
      "/unlink-account",
      "/update-user",
    ],
  });
}

let runtimeAuth: ReturnType<typeof createVoworaAuth> | undefined;

export function getAuth() {
  if (runtimeAuth) return runtimeAuth;
  const environment = readAuthEnvironment();
  const { database } = createRuntimeDatabase(process.env);
  runtimeAuth = createVoworaAuth({
    baseURL: environment.NEXT_PUBLIC_APP_URL,
    backgroundTaskHandler: (promise) => after(() => promise),
    database,
    secret: environment.AUTH_SECRET,
    sendVerificationEmail: createResendVerificationEmailSender({
      apiKey: environment.RESEND_API_KEY,
      from: environment.AUTH_EMAIL_FROM,
    }),
  });
  return runtimeAuth;
}

export async function handleAuthRequest(
  auth: ReturnType<typeof createVoworaAuth>,
  request: Request,
  baseURL: string,
): Promise<Response> {
  if (!isAllowedAuthRoute(request)) {
    return problemResponse(request, {
      status: 404,
      title: "Authentication route not found",
      detail: "The requested authentication route is not available.",
      code: "AUTHENTICATION_ROUTE_NOT_FOUND",
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
  const response = await auth.handler(request);
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

const allowedAuthRoutes = new Map<string, ReadonlySet<string>>([
  ["/api/v1/auth/get-session", new Set(["GET"])],
  ["/api/v1/auth/send-verification-email", new Set(["POST"])],
  ["/api/v1/auth/sign-in/email", new Set(["POST"])],
  ["/api/v1/auth/sign-up/email", new Set(["POST"])],
  ["/api/v1/auth/verify-email", new Set(["GET"])],
]);

function isAllowedAuthRoute(request: Request): boolean {
  return Boolean(
    allowedAuthRoutes.get(new URL(request.url).pathname)?.has(request.method),
  );
}

async function callbackURLFrom(request: Request): Promise<unknown> {
  const queryValue = new URL(request.url).searchParams.get("callbackURL");
  if (queryValue !== null) return queryValue;
  if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    !request.headers.get("content-type")?.includes("application/json")
  ) {
    return undefined;
  }
  try {
    const body: unknown = await request.clone().json();
    if (typeof body === "object" && body !== null && "callbackURL" in body) {
      return (body as { readonly callbackURL?: unknown }).callbackURL;
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
