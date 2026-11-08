import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, revoke } = vi.hoisted(() => ({
  authorize: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../lib/wedding-service", () => ({
  authorizeWeddingSettingsApiOperation: authorize,
  revokeWeddingPartnerInvitation: revoke,
}));

import { DELETE } from "./route";

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const invitationId = "019a1f5e-70a0-7000-8000-000000000003";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function request() {
  return new Request(
    `https://app.test/api/v1/weddings/${weddingId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

beforeEach(() => {
  authorize.mockReset();
  revoke.mockReset();
});

describe("partner invitation revocation API", () => {
  it("uses central wedding settings authorization before revocation", async () => {
    const denied = new Response(null, { status: 403 });
    authorize.mockResolvedValue({ authorized: false, response: denied });
    const response = await DELETE(request(), {
      params: Promise.resolve({ weddingId, invitationId }),
    });
    expect(response).toBe(denied);
    expect(revoke).not.toHaveBeenCalled();
  });

  it("returns the same privacy-safe not-found response for an invitation outside the wedding", async () => {
    const operation = { authorization: { correlationId } };
    authorize.mockResolvedValue({ authorized: true, operation });
    revoke.mockResolvedValue(false);
    const response = await DELETE(request(), {
      params: Promise.resolve({ weddingId, invitationId }),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
    expect(await response.json()).toMatchObject({
      code: "INVITATION_UNAVAILABLE",
      detail: "The invitation is unavailable.",
    });
  });

  it("revokes with the authorized operation and preserves correlation", async () => {
    const operation = { authorization: { correlationId } };
    authorize.mockResolvedValue({ authorized: true, operation });
    revoke.mockResolvedValue(true);
    const response = await DELETE(request(), {
      params: Promise.resolve({ weddingId, invitationId }),
    });
    expect(revoke).toHaveBeenCalledWith(operation, invitationId);
    expect(response.status).toBe(204);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
  });
});
