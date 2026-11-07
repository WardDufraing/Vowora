import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, conflict, correlation } = vi.hoisted(() => ({
  create: vi.fn(),
  conflict: vi.fn(() => false),
  correlation: vi.fn(),
}));

vi.mock("../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../lib/wedding-service", () => ({
  createPartnerInvitation: create,
  isWeddingInvitationConflict: conflict,
  partnerInvitationCorrelationId: correlation,
}));

import { POST } from "./route";

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function request() {
  return new Request(
    `https://app.test/api/v1/weddings/${weddingId}/invitations`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "partner@example.test" }),
    },
  );
}

beforeEach(() => {
  create.mockReset();
  conflict.mockReset();
  conflict.mockReturnValue(false);
  correlation.mockReset();
});

describe("partner invitation API", () => {
  it("returns the secure path only once and preserves authorization correlation", async () => {
    create.mockResolvedValue({
      authorized: true,
      correlationId,
      result: {
        invitation: {
          id: "019a1f5e-70a0-7000-8000-000000000003",
          weddingId,
          invitedEmail: "partner@example.test",
          role: "partner",
          status: "pending",
          expiresAt: "2026-11-21T12:00:00.000Z",
          reminderAt: "2026-11-18T12:00:00.000Z",
          createdAt: "2026-11-07T12:00:00.000Z",
        },
        token: "one-time-secret",
      },
    });
    const response = await POST(request(), {
      params: Promise.resolve({ weddingId }),
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
    expect(await response.json()).toMatchObject({
      data: { acceptancePath: "/invitations/one-time-secret" },
      meta: { correlationId },
    });
  });

  it("keeps the authorized correlation ID on a post-authorization conflict", async () => {
    const failure = new Error("conflict");
    create.mockRejectedValue(failure);
    conflict.mockReturnValue(true);
    correlation.mockReturnValue(correlationId);
    const response = await POST(request(), {
      params: Promise.resolve({ weddingId }),
    });
    expect(response.status).toBe(409);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
  });
});
