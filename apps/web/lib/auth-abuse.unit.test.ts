import { describe, expect, it, vi } from "vitest";

import {
  createUpstashAuthAbuseProtection,
  trustedVercelClientAddress,
} from "./auth-abuse";

const config = {
  redisUrl: "https://synthetic-redis.example",
  redisToken: "synthetic-redis-token",
  hashSecret: "synthetic-hash-secret-longer-than-thirty-two-characters",
  turnstileSecret: "synthetic-turnstile-secret",
  expectedHostname: "app.vowora.test",
};

function redisResult(outcome: "allow" | "challenge" | "block", retry = 0) {
  return Response.json({
    result: [outcome, retry, outcome === "allow" ? 0 : 1],
  });
}

const input = {
  route: "/api/v1/auth/sign-in/email",
  identity: "partner@example.test",
  rule: { windowSeconds: 60, maximumAttempts: 5 },
} as const;

describe("managed authentication abuse protection", () => {
  it("uses opaque bounded Redis keys and permits a normal request", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(redisResult("allow"));
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    await expect(protection.evaluate(input)).resolves.toEqual({
      outcome: "allow",
    });
    const body = String(request.mock.calls[0]?.[1]?.body);
    expect(body).toContain("vowora:auth:v1:");
    expect(body).not.toContain(input.identity);
    expect(body).not.toContain(config.hashSecret);
    expect(body).toContain("redis.call('TIME')");
    expect(body).toContain("last_seen");
    expect(body).toContain("2 ^ (strikes - 1)");
    expect(body).toContain("redis.call('EXPIRE'");
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: `Bearer ${config.redisToken}`,
    });
  });

  it("requires a hostname/action-bound Turnstile challenge at elevated risk", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redisResult("challenge"))
      .mockResolvedValueOnce(redisResult("challenge"))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          hostname: config.expectedHostname,
          action: "vowora-auth",
        }),
      );
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    await expect(protection.evaluate(input)).resolves.toEqual({
      outcome: "challenge",
    });
    await expect(
      protection.evaluate({ ...input, challengeToken: "synthetic-token" }),
    ).resolves.toEqual({ outcome: "allow" });
    expect(request.mock.calls.at(-1)?.[0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
  });

  it("rejects expired, replayed, or context-mismatched challenge tokens", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redisResult("challenge"))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          hostname: config.expectedHostname,
          action: "vowora-auth",
        }),
      )
      .mockResolvedValueOnce(redisResult("challenge"))
      .mockResolvedValueOnce(
        Response.json({
          success: false,
          "error-codes": ["timeout-or-duplicate"],
        }),
      )
      .mockResolvedValueOnce(redisResult("challenge"))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          hostname: "attacker.example",
          action: "vowora-auth",
        }),
      );
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    const challenged = { ...input, challengeToken: "synthetic-token" };
    await expect(protection.evaluate(challenged)).resolves.toEqual({
      outcome: "allow",
    });
    await expect(protection.evaluate(challenged)).resolves.toEqual({
      outcome: "challenge",
    });
    await expect(protection.evaluate(challenged)).resolves.toEqual({
      outcome: "challenge",
    });
  });

  it("blocks progressively and preserves the bounded Retry-After", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(redisResult("block", 240));
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    await expect(protection.evaluate(input)).resolves.toEqual({
      outcome: "block",
      retryAfter: 240,
    });
  });

  it("combines opaque identity and trusted-network dimensions", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redisResult("allow"))
      .mockResolvedValueOnce(redisResult("block", 90));
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    await expect(
      protection.evaluate({ ...input, clientAddress: "203.0.113.7" }),
    ).resolves.toEqual({ outcome: "block", retryAfter: 90 });
    expect(request).toHaveBeenCalledTimes(2);
    const bodies = request.mock.calls.map((call) => String(call[1]?.body));
    expect(bodies[0]).not.toBe(bodies[1]);
    expect(bodies.join(" ")).not.toContain("203.0.113.7");
  });

  it("fails closed for invalid provider output without reflecting values", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ result: ["allow", 9999] }));
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: request,
    });
    await expect(protection.evaluate(input)).rejects.toThrow(
      "Authentication abuse store unavailable",
    );
  });

  it("uses only a singular Vercel-overwritten forwarded address", () => {
    const request = new Request("https://app.vowora.test", {
      headers: { "x-forwarded-for": "2001:db8::1" },
    });
    expect(trustedVercelClientAddress(request, false)).toBeUndefined();
    expect(trustedVercelClientAddress(request, true)).toBe("2001:db8::1");
    expect(
      trustedVercelClientAddress(
        new Request("https://app.vowora.test", {
          headers: { "x-forwarded-for": "203.0.113.5, 2001:db8::1" },
        }),
        true,
      ),
    ).toBeUndefined();
    expect(
      trustedVercelClientAddress(
        new Request("https://app.vowora.test", {
          headers: { "x-forwarded-for": "attacker-controlled" },
        }),
        true,
      ),
    ).toBeUndefined();
  });

  it("rejects non-HTTPS Redis endpoints and unknown key material", async () => {
    expect(() =>
      createUpstashAuthAbuseProtection({
        ...config,
        redisUrl: "http://localhost",
      }),
    ).toThrow("Invalid authentication abuse configuration");
    expect(() =>
      createUpstashAuthAbuseProtection({ ...config, hashSecret: "too-short" }),
    ).toThrow("Invalid authentication abuse configuration");
    const protection = createUpstashAuthAbuseProtection({
      ...config,
      fetch: vi.fn<typeof fetch>().mockResolvedValue(redisResult("allow")),
    });
    await expect(
      protection.evaluate({ ...input, identity: "x".repeat(4097) }),
    ).rejects.toThrow("Invalid authentication abuse policy");
  });
});
