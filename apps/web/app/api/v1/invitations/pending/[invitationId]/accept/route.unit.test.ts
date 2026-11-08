import { beforeEach, describe, expect, it, vi } from "vitest";

const { claim, reason, session } = vi.hoisted(() => ({
  claim: vi.fn(),
  reason: vi.fn(),
  session: vi.fn(),
}));

vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession: session } }),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../lib/wedding-service", () => ({
  claimPartnerInvitationByEmail: claim,
  isWeddingInvitationConflict: () => false,
  weddingInvitationUnavailableReason: reason,
}));

import { POST } from "./route";

const invitationId = "019a1f5e-70a0-7000-8000-000000000003";

function request() {
  return new Request(
    `https://app.test/api/v1/invitations/pending/${invitationId}/accept`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accept: true }),
    },
  );
}

beforeEach(() => {
  claim.mockReset();
  reason.mockReset();
  session.mockReset();
  session.mockResolvedValue({ user: { id: "actor-id" } });
});

describe("verified-email invitation acceptance API", () => {
  it("requires a session and explicit acceptance", async () => {
    session.mockResolvedValue(null);
    const response = await POST(request(), {
      params: Promise.resolve({ invitationId }),
    });
    expect(response.status).toBe(401);
    expect(claim).not.toHaveBeenCalled();
  });

  it("keeps wrong-email and unknown-id outcomes privacy-equivalent", async () => {
    for (const unavailable of ["email_mismatch", "invalid"] as const) {
      claim.mockRejectedValueOnce(new Error(unavailable));
      reason.mockReturnValueOnce(unavailable);
      const response = await POST(request(), {
        params: Promise.resolve({ invitationId }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        code: "INVITATION_UNAVAILABLE",
        detail: "This invitation cannot be used with the signed-in account.",
      });
    }
  });

  it("returns a specific expiry and replay-safe success", async () => {
    claim.mockRejectedValueOnce(new Error("expired"));
    reason.mockReturnValueOnce("expired");
    const expired = await POST(request(), {
      params: Promise.resolve({ invitationId }),
    });
    expect(expired.status).toBe(410);
    expect(await expired.json()).toMatchObject({ code: "INVITATION_EXPIRED" });

    claim.mockResolvedValueOnce({ weddingId: invitationId, replayed: true });
    const replay = await POST(request(), {
      params: Promise.resolve({ invitationId }),
    });
    expect(await replay.json()).toMatchObject({ meta: { replayed: true } });
  });
});
