import { beforeEach, describe, expect, it, vi } from "vitest";

const { claim, reason, session } = vi.hoisted(() => ({
  claim: vi.fn(),
  reason: vi.fn(),
  session: vi.fn(),
}));

vi.mock("../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession: session } }),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../lib/wedding-service", () => ({
  claimPartnerInvitation: claim,
  isWeddingInvitationConflict: () => false,
  weddingInvitationUnavailableReason: reason,
}));

import { POST } from "./route";

const token = "a".repeat(43);

function request() {
  return new Request(`https://app.test/api/v1/invitations/${token}/accept`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accept: true }),
  });
}

beforeEach(() => {
  claim.mockReset();
  reason.mockReset();
  session.mockReset();
  session.mockResolvedValue({
    user: { id: "019a1f5e-70a0-7000-8000-000000000003" },
  });
});

describe("partner invitation acceptance API", () => {
  it("requires an authenticated session and explicit acceptance", async () => {
    session.mockResolvedValue(null);
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(401);
    expect(claim).not.toHaveBeenCalled();
  });

  it("returns the same privacy-safe response for wrong email and invalid token", async () => {
    for (const unavailable of ["email_mismatch", "invalid"] as const) {
      claim.mockRejectedValueOnce(new Error(unavailable));
      reason.mockReturnValueOnce(unavailable);
      const response = await POST(request(), {
        params: Promise.resolve({ token }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        code: "INVITATION_UNAVAILABLE",
        detail: "This invitation cannot be used with the signed-in account.",
      });
    }
  });

  it("returns a replay marker from the atomic claim", async () => {
    const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
    claim.mockResolvedValue({ weddingId, replayed: true });
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { weddingId },
      meta: { replayed: true },
    });
  });
});
