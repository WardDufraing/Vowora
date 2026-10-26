import { randomUUID } from "node:crypto";

import {
  createTestDatabase,
  parseTestMigrationConfig,
  withIsolatedTestSchema,
} from "@vowora/database/testing";
import { describe, expect, it } from "vitest";
import { problemDetailsSchema } from "@vowora/contracts";

import { createVoworaAuth, handleAuthRequest } from "./auth";

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
          ["POST", "/request-password-reset"],
          ["POST", "/sign-out"],
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
});
