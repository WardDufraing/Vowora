import { randomUUID } from "node:crypto";

import {
  createTestDatabase,
  parseTestMigrationConfig,
  withIsolatedTestSchema,
  withTestAuthCredentialLock,
} from "@vowora/database/testing";
import { describe, expect, it } from "vitest";
import {
  passwordRecoveryAcknowledgementSchema,
  passwordResetResponseSchema,
  problemDetailsSchema,
} from "@vowora/contracts";
import { hashPassword, verifyPassword } from "better-auth/crypto";

import {
  createVoworaAuth,
  handleAuthRequest,
  protectAuthAbuseRequest,
} from "./auth";
import type { AuthAbuseDecision } from "./auth-abuse";
import {
  listAccountSessions,
  requireSensitiveSession,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from "./session-management";

const config = parseTestMigrationConfig(process.env);
const baseURL = "https://auth.vowora.test";
const secret = "synthetic-auth-secret-at-least-thirty-two-characters";

function request(path: string, init?: RequestInit) {
  return new Request(`${baseURL}/api/v1/auth${path}`, {
    ...init,
    headers: {
      Origin: baseURL,
      "x-correlation-id": "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2",
      ...init?.headers,
    },
  });
}

function credentials(email = "partner@example.test") {
  return {
    email,
    name: "Synthetic Partner",
    password: "synthetic-passphrase-123",
    callbackURL: `${baseURL}/account`,
  };
}

function signInBody(identity: ReturnType<typeof credentials>) {
  return {
    email: identity.email,
    password: identity.password,
    callbackURL: identity.callbackURL,
  };
}

function post(path: string, body: unknown) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function waitForBlockedCredentialLock(
  client: {
    query<T extends Record<string, unknown>>(
      text: string,
      values?: readonly unknown[],
    ): Promise<{ rows: T[] }>;
  },
  queryFragment: string,
) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM pg_stat_activity
       WHERE datname = current_database()
         AND wait_event_type = 'Lock'
         AND query LIKE $1`,
      [`%${queryFragment}%`],
    );
    if ((result.rows[0]?.count ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Credential operation did not reach the expected row lock");
}

describe("Better Auth PostgreSQL integration", () => {
  it("requires verification before issuing a session and resists enumeration", async () => {
    await withIsolatedTestSchema(
      config,
      `auth-${randomUUID()}`,
      async ({ client, schemaName }) =>
        withTestAuthCredentialLock(
          config,
          schemaName,
          async (credentialLock) => {
            const deliveries: Array<{
              recipient: string;
              verificationUrl: string;
            }> = [];
            const resetDeliveries: Array<{
              recipient: string;
              resetUrl: string;
            }> = [];
            const backgroundTasks: Array<Promise<unknown>> = [];
            const scheduledTasks: Array<() => Promise<void>> = [];
            let releaseDelivery: (() => void) | undefined;
            let deliveryGate = new Promise<void>((resolve) => {
              releaseDelivery = resolve;
            });
            let abuseDecision: AuthAbuseDecision = { outcome: "allow" };
            let abuseFailure = false;
            const auth = createVoworaAuth({
              baseURL,
              backgroundTaskHandler: (promise) => backgroundTasks.push(promise),
              database: createTestDatabase(client),
              rateLimitEnabled: false,
              abuseProtection: {
                async evaluate() {
                  if (abuseFailure)
                    throw new Error("synthetic provider failure");
                  return abuseDecision;
                },
              },
              scheduleBackgroundTask: (task) => scheduledTasks.push(task),
              secret,
              sendPasswordResetEmail: async (message) => {
                resetDeliveries.push(message);
              },
              sendVerificationEmail: async (message) => {
                await deliveryGate;
                deliveries.push(message);
              },
              withCredentialLock: credentialLock,
            });
            const validCredentials = credentials();

            const missingOrigin = await handleAuthRequest(
              auth,
              new Request(`${baseURL}/api/v1/auth/sign-in/email`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(signInBody(validCredentials)),
              }),
              baseURL,
            );
            expect(missingOrigin.status).toBe(403);
            expect((await missingOrigin.json()).code).toBe(
              "CSRF_VALIDATION_FAILED",
            );

            abuseDecision = { outcome: "challenge" };
            const challenged = await handleAuthRequest(
              auth,
              post("/sign-in/email", signInBody(validCredentials)),
              baseURL,
            );
            expect(challenged.status).toBe(403);
            expect((await challenged.json()).code).toBe(
              "AUTHENTICATION_CHALLENGE_REQUIRED",
            );
            for (const [path, body] of [
              ["/sign-up/email", validCredentials],
              [
                "/request-password-reset",
                {
                  email: validCredentials.email,
                  redirectTo: `${baseURL}/reset-password`,
                },
              ],
              [
                "/send-verification-email",
                {
                  email: validCredentials.email,
                  callbackURL: validCredentials.callbackURL,
                },
              ],
              [
                "/reset-password",
                {
                  token: "synthetic-reset-token",
                  newPassword: "replacement-passphrase-456",
                },
              ],
            ] as const) {
              const protectedResponse = await handleAuthRequest(
                auth,
                post(path, body),
                baseURL,
              );
              expect(protectedResponse.status).toBe(403);
              expect((await protectedResponse.json()).code).toBe(
                "AUTHENTICATION_CHALLENGE_REQUIRED",
              );
            }
            const sessionChallenge = await protectAuthAbuseRequest(
              auth,
              request("/../account/sessions", { method: "DELETE" }),
              "synthetic-session",
              { windowSeconds: 60, maximumAttempts: 10 },
              false,
            );
            expect(sessionChallenge?.status).toBe(429);
            expect(sessionChallenge?.headers.get("retry-after")).toBe("60");
            abuseDecision = { outcome: "block", retryAfter: 120 };
            const throttled = await handleAuthRequest(
              auth,
              post("/sign-in/email", signInBody(validCredentials)),
              baseURL,
            );
            expect(throttled.status).toBe(429);
            expect(throttled.headers.get("retry-after")).toBe("120");
            abuseFailure = true;
            const unavailableProtection = await handleAuthRequest(
              auth,
              post("/sign-in/email", signInBody(validCredentials)),
              baseURL,
            );
            expect(unavailableProtection.status).toBe(503);
            expect((await unavailableProtection.json()).code).toBe(
              "AUTHENTICATION_ABUSE_PROTECTION_UNAVAILABLE",
            );
            abuseFailure = false;
            abuseDecision = { outcome: "allow" };

            const anonymousSession = await auth.handler(
              request("/get-session"),
            );
            expect(anonymousSession.status).toBe(200);
            expect(await anonymousSession.json()).toBeNull();

            const untrustedOrigin = await handleAuthRequest(
              auth,
              post("/sign-up/email", {
                ...validCredentials,
                callbackURL: "https://attacker.example/account",
              }),
              baseURL,
            );
            expect(untrustedOrigin.status).toBe(403);
            expect(deliveries).toHaveLength(0);
            expect(
              (
                await client.query(
                  "SELECT count(*)::int AS count FROM auth_user",
                )
              ).rows[0],
            ).toEqual({ count: 0 });

            for (const invalidSignUp of [
              { ...validCredentials, image: "https://attacker.example/image" },
              { ...validCredentials, name: "x".repeat(101) },
              { ...validCredentials, name: `x${" ".repeat(100)}` },
            ]) {
              const invalid = await handleAuthRequest(
                auth,
                post("/sign-up/email", invalidSignUp),
                baseURL,
              );
              expect(invalid.status).toBe(400);
            }
            expect(
              (
                await client.query(
                  "SELECT count(*)::int AS count FROM auth_user",
                )
              ).rows[0],
            ).toEqual({ count: 0 });

            const signUp = await auth.handler(
              post("/sign-up/email", validCredentials),
            );
            expect(signUp.status).toBe(200);
            expect(signUp.headers.get("set-cookie")).toBeNull();
            expect(deliveries).toHaveLength(0);
            expect(
              (
                await client.query(
                  "SELECT count(*)::int AS count FROM auth_user",
                )
              ).rows[0],
            ).toEqual({ count: 1 });
            expect(scheduledTasks).toHaveLength(1);
            const firstDelivery = scheduledTasks.shift()?.();
            expect(firstDelivery).toBeDefined();
            releaseDelivery?.();
            await Promise.all([firstDelivery, ...backgroundTasks.splice(0)]);
            expect(deliveries).toHaveLength(1);
            expect(deliveries[0]?.recipient).toBe(validCredentials.email);
            expect(deliveries[0]?.verificationUrl).toContain(
              "/api/v1/auth/verify-email?token=",
            );
            expect(deliveries[0]?.verificationUrl).not.toContain(
              validCredentials.email,
            );

            const unverifiedSignIn = await auth.handler(
              post("/sign-in/email", validCredentials),
            );
            expect(unverifiedSignIn.status).toBe(403);
            expect(unverifiedSignIn.headers.get("set-cookie")).toBeNull();
            expect(deliveries).toHaveLength(1);

            const unknownResend = await auth.handler(
              post("/send-verification-email", {
                email: "unknown@example.test",
                callbackURL: `${baseURL}/account`,
              }),
            );
            const existingResend = await auth.handler(
              post("/send-verification-email", {
                email: validCredentials.email,
                callbackURL: `${baseURL}/account`,
              }),
            );
            expect(unknownResend.status).toBe(200);
            expect(existingResend.status).toBe(200);
            expect(await unknownResend.json()).toEqual(
              await existingResend.json(),
            );
            expect(scheduledTasks).toHaveLength(1);
            deliveryGate = Promise.resolve();
            await Promise.all([
              scheduledTasks.shift()?.(),
              ...backgroundTasks.splice(0),
            ]);
            expect(deliveries).toHaveLength(2);

            for (const [method, path] of [
              ["POST", "/change-password"],
              ["GET", "/list-sessions"],
            ]) {
              const unavailable = await handleAuthRequest(
                auth,
                request(path, { method }),
                baseURL,
              );
              expect(unavailable.status).toBe(404);
              expect(await unavailable.json()).toMatchObject({
                code: "AUTHENTICATION_ROUTE_NOT_FOUND",
              });
            }

            const duplicate = await auth.handler(
              post("/sign-up/email", validCredentials),
            );
            const unknown = await handleAuthRequest(
              auth,
              post(
                "/sign-in/email",
                signInBody(credentials("unknown@example.test")),
              ),
              baseURL,
            );
            const wrongPassword = await handleAuthRequest(
              auth,
              post("/sign-in/email", {
                ...signInBody(validCredentials),
                password: "wrong-password-value",
              }),
              baseURL,
            );
            expect(duplicate.status).toBe(200);
            expect(unknown.status).toBe(wrongPassword.status);
            const unknownBody = await unknown.json();
            const wrongPasswordBody = await wrongPassword.json();
            expect(unknownBody).toEqual(wrongPasswordBody);
            expect(() =>
              problemDetailsSchema.parse(wrongPasswordBody),
            ).not.toThrow();

            const verificationUrl = deliveries[0]?.verificationUrl;
            expect(verificationUrl).toBeDefined();
            const verify = await auth.handler(
              new Request(verificationUrl!, { redirect: "manual" }),
            );
            expect(verify.status).toBe(302);
            expect(verify.headers.get("location")).toBe(`${baseURL}/account`);
            expect(verify.headers.get("set-cookie")).toBeNull();

            const verifiedSignIn = await auth.handler(
              post("/sign-in/email", validCredentials),
            );
            expect(verifiedSignIn.status).toBe(200);
            const cookie = verifiedSignIn.headers.get("set-cookie");
            expect(cookie).toContain("__Secure-vowora.session_token=");
            expect(cookie).toContain("HttpOnly");
            expect(cookie).toContain("SameSite=Lax");
            expect(cookie).toContain("Secure");
            expect(cookie).not.toContain("Domain=");

            const activeSession = await auth.handler(
              request("/get-session", { headers: { Cookie: cookie! } }),
            );
            expect(activeSession.status).toBe(200);
            expect(await activeSession.json()).toMatchObject({
              user: { email: validCredentials.email, emailVerified: true },
            });

            const rows = await client.query(
              "SELECT u.id, u.email_verified, count(s.id)::int AS sessions FROM auth_user u LEFT JOIN auth_session s ON s.user_id = u.id GROUP BY u.id",
            );
            expect(rows.rows).toHaveLength(1);
            expect(rows.rows[0]).toMatchObject({
              email_verified: true,
              sessions: 1,
            });
            expect(rows.rows[0]?.id).toMatch(
              /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
            );

            const failedDeliveryTasks: Array<Promise<unknown>> = [];
            const failedScheduledTasks: Array<() => Promise<void>> = [];
            const authWithFailedDelivery = createVoworaAuth({
              baseURL,
              backgroundTaskHandler: (promise) =>
                failedDeliveryTasks.push(promise),
              database: createTestDatabase(client),
              rateLimitEnabled: false,
              scheduleBackgroundTask: (task) => failedScheduledTasks.push(task),
              secret,
              sendPasswordResetEmail: async () => {},
              sendVerificationEmail: async () => {
                throw new Error("synthetic delivery failure");
              },
              withCredentialLock: credentialLock,
            });
            const acceptedDespiteDeliveryFailure =
              await authWithFailedDelivery.handler(
                post(
                  "/sign-up/email",
                  credentials("delivery-failure@example.test"),
                ),
              );
            expect(acceptedDespiteDeliveryFailure.status).toBe(200);
            expect(failedScheduledTasks).toHaveLength(1);
            await Promise.all([
              failedScheduledTasks[0]?.(),
              ...failedDeliveryTasks,
            ]);
            expect(
              (
                await client.query(
                  "SELECT count(*)::int AS count FROM auth_user WHERE email = 'delivery-failure@example.test'",
                )
              ).rows[0],
            ).toEqual({ count: 1 });
          },
        ),
    );
  });

  it("manages owned sessions and consumes password resets exactly once", async () => {
    await withIsolatedTestSchema(
      config,
      `session-recovery-${randomUUID()}`,
      async ({ client, schemaName }) =>
        withTestAuthCredentialLock(
          config,
          schemaName,
          async (credentialLock) => {
            const scheduledTasks: Array<() => Promise<void>> = [];
            const resetDeliveries: Array<{
              recipient: string;
              resetUrl: string;
            }> = [];
            let passwordVerificationGate:
              | {
                  reached: () => void;
                  wait: Promise<void>;
                }
              | undefined;
            let passwordHashGate:
              | {
                  reached: () => void;
                  wait: Promise<void>;
                }
              | undefined;
            const auth = createVoworaAuth({
              baseURL,
              backgroundTaskHandler: () => {},
              database: createTestDatabase(client),
              rateLimitEnabled: false,
              scheduleBackgroundTask: (task) => scheduledTasks.push(task),
              secret,
              sendPasswordResetEmail: async (message) => {
                resetDeliveries.push(message);
              },
              sendVerificationEmail: async () => {},
              withCredentialLock: credentialLock,
              password: {
                hash: async (password) => {
                  if (passwordHashGate) {
                    passwordHashGate.reached();
                    await passwordHashGate.wait;
                  }
                  return hashPassword(password);
                },
                verify: async (input) => {
                  const valid = await verifyPassword(input);
                  if (valid && passwordVerificationGate) {
                    passwordVerificationGate.reached();
                    await passwordVerificationGate.wait;
                  }
                  return valid;
                },
              },
            });
            const primary = credentials("sessions@example.test");
            const second = credentials("other@example.test");
            for (const identity of [primary, second]) {
              expect(
                (await auth.handler(post("/sign-up/email", identity))).status,
              ).toBe(200);
            }
            scheduledTasks.splice(0);
            await client.query("UPDATE auth_user SET email_verified = true");

            const signIn = async (
              identity: ReturnType<typeof credentials>,
              agent: string,
            ) => {
              const response = await handleAuthRequest(
                auth,
                request("/sign-in/email", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": agent,
                  },
                  body: JSON.stringify(signInBody(identity)),
                }),
                baseURL,
              );
              expect(response.status).toBe(200);
              return response.headers.get("set-cookie")!;
            };
            const firstCookie = await signIn(
              primary,
              "Desktop synthetic browser",
            );
            const secondCookie = await signIn(
              primary,
              "Mobile synthetic browser",
            );
            const otherCookie = await signIn(second, "Other synthetic browser");

            const listResponse = await listAccountSessions(
              auth,
              request("/ignored", { headers: { Cookie: firstCookie } }),
            );
            expect(listResponse.status).toBe(200);
            const listed = (await listResponse.json()) as {
              data: Array<{
                id: string;
                current: boolean;
                device: string;
                token?: string;
              }>;
            };
            expect(listed.data).toHaveLength(2);
            expect(listed.data.some((entry) => entry.current)).toBe(true);
            expect(
              listed.data.every((entry) => entry.token === undefined),
            ).toBe(true);
            const secondary = listed.data.find((entry) => !entry.current)!;

            const otherRow = await client.query<{ id: string }>(
              "SELECT s.id FROM auth_session s JOIN auth_user u ON u.id = s.user_id WHERE u.email = $1",
              [second.email],
            );
            const crossAccount = await revokeAccountSession(
              auth,
              request("/ignored", {
                method: "DELETE",
                headers: { Cookie: firstCookie },
              }),
              otherRow.rows[0]!.id,
            );
            expect(crossAccount.status).toBe(404);

            expect(
              (
                await revokeAccountSession(
                  auth,
                  request("/ignored", {
                    method: "DELETE",
                    headers: { Cookie: firstCookie },
                  }),
                  secondary.id,
                )
              ).status,
            ).toBe(204);
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: secondCookie }),
              }),
            ).toBeNull();
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: otherCookie }),
              }),
            ).not.toBeNull();

            const thirdCookie = await signIn(
              primary,
              "Third synthetic browser",
            );
            expect(
              (
                await revokeOtherAccountSessions(
                  auth,
                  request("/ignored", {
                    method: "DELETE",
                    headers: { Cookie: firstCookie },
                  }),
                )
              ).status,
            ).toBe(204);
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: thirdCookie }),
              }),
            ).toBeNull();
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: firstCookie }),
              }),
            ).not.toBeNull();

            const unknownReset = await handleAuthRequest(
              auth,
              post("/request-password-reset", {
                email: "missing@example.test",
                redirectTo: `${baseURL}/reset-password`,
              }),
              baseURL,
            );
            const crossOriginReset = await handleAuthRequest(
              auth,
              post("/request-password-reset", {
                email: primary.email,
                redirectTo: "https://attacker.example/reset-password",
              }),
              baseURL,
            );
            const overpostedReset = await handleAuthRequest(
              auth,
              post("/request-password-reset", {
                email: primary.email,
                redirectTo: `${baseURL}/reset-password`,
                revealAccount: true,
              }),
              baseURL,
            );
            expect(crossOriginReset.status).toBe(403);
            expect(overpostedReset.status).toBe(400);
            const knownReset = await handleAuthRequest(
              auth,
              post("/request-password-reset", {
                email: primary.email,
                redirectTo: `${baseURL}/reset-password`,
              }),
              baseURL,
            );
            expect(unknownReset.status).toBe(200);
            expect(knownReset.status).toBe(200);
            const unknownAcknowledgement =
              passwordRecoveryAcknowledgementSchema.parse(
                await unknownReset.json(),
              );
            const knownAcknowledgement =
              passwordRecoveryAcknowledgementSchema.parse(
                await knownReset.json(),
              );
            expect(unknownAcknowledgement).toEqual(knownAcknowledgement);
            expect(resetDeliveries).toHaveLength(0);
            expect(scheduledTasks).toHaveLength(1);
            await scheduledTasks.shift()?.();
            expect(resetDeliveries).toHaveLength(1);
            expect(resetDeliveries[0]?.resetUrl).not.toContain(primary.email);

            const callback = await handleAuthRequest(
              auth,
              new Request(resetDeliveries[0]!.resetUrl, { redirect: "manual" }),
              baseURL,
            );
            expect(callback.status).toBe(302);
            const firstResetToken = new URL(
              callback.headers.get("location")!,
            ).searchParams.get("token")!;

            let reachedVerification!: () => void;
            const verificationReached = new Promise<void>((resolve) => {
              reachedVerification = resolve;
            });
            let releaseVerification!: () => void;
            const verificationReleased = new Promise<void>((resolve) => {
              releaseVerification = resolve;
            });
            passwordVerificationGate = {
              reached: reachedVerification,
              wait: verificationReleased,
            };
            const racingLogin = handleAuthRequest(
              auth,
              post("/sign-in/email", signInBody(primary)),
              baseURL,
            );
            await verificationReached;
            const racingReset = handleAuthRequest(
              auth,
              post("/reset-password", {
                token: firstResetToken,
                newPassword: "intermediate-passphrase-345",
              }),
              baseURL,
            );
            await waitForBlockedCredentialLock(
              client,
              "FROM auth_verification v JOIN auth_user u",
            );
            releaseVerification();
            const racingLoginResponse = await racingLogin;
            expect(racingLoginResponse.status).toBe(200);
            const racingCookie = racingLoginResponse.headers.get("set-cookie")!;
            const racingResetResponse = await racingReset;
            expect(racingResetResponse.status).toBe(200);
            passwordResetResponseSchema.parse(await racingResetResponse.json());
            passwordVerificationGate = undefined;
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: racingCookie }),
              }),
            ).toBeNull();

            expect(
              (
                await handleAuthRequest(
                  auth,
                  post("/request-password-reset", {
                    email: primary.email,
                    redirectTo: `${baseURL}/reset-password`,
                  }),
                  baseURL,
                )
              ).status,
            ).toBe(200);
            await scheduledTasks.shift()?.();
            const secondCallback = await handleAuthRequest(
              auth,
              new Request(resetDeliveries[1]!.resetUrl, { redirect: "manual" }),
              baseURL,
            );
            const token = new URL(
              secondCallback.headers.get("location")!,
            ).searchParams.get("token")!;

            let reachedHash!: () => void;
            const hashReached = new Promise<void>((resolve) => {
              reachedHash = resolve;
            });
            let releaseHash!: () => void;
            const hashReleased = new Promise<void>((resolve) => {
              releaseHash = resolve;
            });
            passwordHashGate = { reached: reachedHash, wait: hashReleased };
            const resetHoldingLock = handleAuthRequest(
              auth,
              post("/reset-password", {
                token,
                newPassword: "replacement-passphrase-456",
              }),
              baseURL,
            );
            await hashReached;
            const oldPasswordLogin = handleAuthRequest(
              auth,
              post("/sign-in/email", {
                ...signInBody(primary),
                password: "intermediate-passphrase-345",
              }),
              baseURL,
            );
            await waitForBlockedCredentialLock(
              client,
              "FROM auth_user WHERE email",
            );
            releaseHash();
            expect((await resetHoldingLock).status).toBe(200);
            passwordHashGate = undefined;
            const oldPasswordResponse = await oldPasswordLogin;
            expect(oldPasswordResponse.status).toBe(401);
            expect(oldPasswordResponse.headers.get("set-cookie")).toBeNull();

            expect(
              (
                await handleAuthRequest(
                  auth,
                  post("/request-password-reset", {
                    email: primary.email,
                    redirectTo: `${baseURL}/reset-password`,
                  }),
                  baseURL,
                )
              ).status,
            ).toBe(200);
            await scheduledTasks.shift()?.();
            const thirdCallback = await handleAuthRequest(
              auth,
              new Request(resetDeliveries[2]!.resetUrl, { redirect: "manual" }),
              baseURL,
            );
            const concurrentToken = new URL(
              thirdCallback.headers.get("location")!,
            ).searchParams.get("token")!;
            const resetRequest = () =>
              handleAuthRequest(
                auth,
                post("/reset-password", {
                  token: concurrentToken,
                  newPassword: "final-passphrase-567",
                }),
                baseURL,
              );
            const concurrent = await Promise.all([
              resetRequest(),
              resetRequest(),
            ]);
            expect(
              concurrent.map((response) => response.status).sort(),
            ).toEqual([200, 400]);
            expect(
              await auth.api.getSession({
                headers: new Headers({ Cookie: firstCookie }),
              }),
            ).toBeNull();
            expect(
              (
                await handleAuthRequest(
                  auth,
                  post("/sign-in/email", signInBody(primary)),
                  baseURL,
                )
              ).status,
            ).toBe(401);
            expect(
              (
                await handleAuthRequest(
                  auth,
                  post("/sign-in/email", {
                    ...signInBody(primary),
                    password: "final-passphrase-567",
                  }),
                  baseURL,
                )
              ).status,
            ).toBe(200);

            const userId = (
              await client.query<{ id: string }>(
                "SELECT id FROM auth_user WHERE email = $1",
                [primary.email],
              )
            ).rows[0]!.id;
            await client.query(
              "INSERT INTO auth_verification (id, identifier, value, expires_at) VALUES ($1, $2, $3, now() - interval '1 second')",
              [randomUUID(), "reset-password:expired-token", userId],
            );
            expect(
              (
                await handleAuthRequest(
                  auth,
                  post("/reset-password", {
                    token: "expired-token",
                    newPassword: "another-passphrase-789",
                  }),
                  baseURL,
                )
              ).status,
            ).toBe(400);

            const freshCookie = await signIn(
              { ...primary, password: "final-passphrase-567" },
              "Fresh browser",
            );
            await client.query(
              "UPDATE auth_session SET created_at = now() - interval '16 minutes' WHERE user_id = (SELECT id FROM auth_user WHERE email = $1)",
              [primary.email],
            );
            const stale = await requireSensitiveSession(
              auth,
              new Headers({ Cookie: freshCookie }),
            );
            expect(stale?.stale).toBe(true);
          },
        ),
    );
  });
});
