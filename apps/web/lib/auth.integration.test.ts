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
const baseURL = "http://auth.vowora.test";
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
        const auth = createVoworaAuth({
          baseURL,
          database: createTestDatabase(client),
          rateLimitEnabled: false,
          secret,
          secureCookies: true,
          sendVerificationEmail: async (message) => {
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

        const signUp = await auth.handler(
          post("/sign-up/email", validCredentials),
        );
        expect(signUp.status).toBe(200);
        expect(signUp.headers.get("set-cookie")).toBeNull();
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
        expect(deliveries).toHaveLength(2);

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
      },
    );
  });
});
