import { randomUUID } from "node:crypto";

import {
  createTestDatabase,
  parseTestMigrationConfig,
  withIsolatedTestSchema,
} from "@vowora/database/testing";
import { describe, expect, it } from "vitest";
import { problemDetailsSchema } from "@vowora/contracts";

import { createVoworaAuth, handleAuthRequest } from "./auth";
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

function post(path: string, body: unknown) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Better Auth PostgreSQL integration", () => {
  it("requires verification before issuing a session and resists enumeration", async () => {
    await withIsolatedTestSchema(
      config,
      `auth-${randomUUID()}`,
      async ({ client }) => {
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
        const auth = createVoworaAuth({
          baseURL,
          backgroundTaskHandler: (promise) => backgroundTasks.push(promise),
          database: createTestDatabase(client),
          rateLimitEnabled: false,
          scheduleBackgroundTask: (task) => scheduledTasks.push(task),
          secret,
          sendPasswordResetEmail: async (message) => {
            resetDeliveries.push(message);
          },
          sendVerificationEmail: async (message) => {
            await deliveryGate;
            deliveries.push(message);
          },
        });
        const validCredentials = credentials();

        const anonymousSession = await auth.handler(request("/get-session"));
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
          (await client.query("SELECT count(*)::int AS count FROM auth_user"))
            .rows[0],
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
          (await client.query("SELECT count(*)::int AS count FROM auth_user"))
            .rows[0],
        ).toEqual({ count: 0 });

        const signUp = await auth.handler(
          post("/sign-up/email", validCredentials),
        );
        expect(signUp.status).toBe(200);
        expect(signUp.headers.get("set-cookie")).toBeNull();
        expect(deliveries).toHaveLength(0);
        expect(
          (await client.query("SELECT count(*)::int AS count FROM auth_user"))
            .rows[0],
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
        expect(await unknownResend.json()).toEqual(await existingResend.json());
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
          post("/sign-in/email", credentials("unknown@example.test")),
          baseURL,
        );
        const wrongPassword = await handleAuthRequest(
          auth,
          post("/sign-in/email", {
            ...validCredentials,
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
          backgroundTaskHandler: (promise) => failedDeliveryTasks.push(promise),
          database: createTestDatabase(client),
          rateLimitEnabled: false,
          scheduleBackgroundTask: (task) => failedScheduledTasks.push(task),
          secret,
          sendPasswordResetEmail: async () => {},
          sendVerificationEmail: async () => {
            throw new Error("synthetic delivery failure");
          },
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
    );
  });

  it("manages owned sessions and consumes password resets exactly once", async () => {
    await withIsolatedTestSchema(
      config,
      `session-recovery-${randomUUID()}`,
      async ({ client }) => {
        const scheduledTasks: Array<() => Promise<void>> = [];
        const resetDeliveries: Array<{ recipient: string; resetUrl: string }> =
          [];
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
          const response = await auth.handler(
            request("/sign-in/email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": agent,
              },
              body: JSON.stringify(identity),
            }),
          );
          expect(response.status).toBe(200);
          return response.headers.get("set-cookie")!;
        };
        const firstCookie = await signIn(primary, "Desktop synthetic browser");
        const secondCookie = await signIn(primary, "Mobile synthetic browser");
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
        expect(listed.data.every((entry) => entry.token === undefined)).toBe(
          true,
        );
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

        const thirdCookie = await signIn(primary, "Third synthetic browser");
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
        expect(await unknownReset.json()).toEqual(await knownReset.json());
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
        const token = new URL(
          callback.headers.get("location")!,
        ).searchParams.get("token")!;
        const resetRequest = () =>
          handleAuthRequest(
            auth,
            post("/reset-password", {
              token,
              newPassword: "replacement-passphrase-456",
            }),
            baseURL,
          );
        const concurrent = await Promise.all([resetRequest(), resetRequest()]);
        expect(concurrent.map((response) => response.status).sort()).toEqual([
          200, 400,
        ]);
        expect(
          await auth.api.getSession({
            headers: new Headers({ Cookie: firstCookie }),
          }),
        ).toBeNull();
        expect(
          (await auth.handler(post("/sign-in/email", primary))).status,
        ).toBe(401);
        expect(
          (
            await auth.handler(
              post("/sign-in/email", {
                ...primary,
                password: "replacement-passphrase-456",
              }),
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
          { ...primary, password: "replacement-passphrase-456" },
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
    );
  });
});
