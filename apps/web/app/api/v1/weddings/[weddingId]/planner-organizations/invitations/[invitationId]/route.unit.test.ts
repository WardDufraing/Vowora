import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, revoke, safeRequest } = vi.hoisted(() => ({
  authorize: vi.fn(),
  revoke: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../lib/wedding-service", () => ({
  authorizeWeddingSettingsApiOperation: authorize,
  revokePlannerOrganizationInvitation: revoke,
}));
import { DELETE } from "./route";
const weddingId = "019a2f36-0eb9-7000-8000-000000000001",
  invitationId = "019a2f36-0eb9-7000-8000-000000000002";
const operation = {
  authorization: {
    correlationId: "7f26b5f5-1d9e-4a91-9fd8-87e0401d8fe0",
  },
};
const params = Promise.resolve({ weddingId, invitationId });
beforeEach(() => {
  safeRequest.mockReturnValue(true);
  authorize.mockResolvedValue({ authorized: true, operation });
  revoke.mockResolvedValue(true);
});
describe("planner invitation revocation API", () => {
  it("rejects CSRF before authorization", async () => {
    safeRequest.mockReturnValue(false);
    expect(
      (
        await DELETE(new Request("https://app.test", { method: "DELETE" }), {
          params,
        })
      ).status,
    ).toBe(403);
    expect(authorize).not.toHaveBeenCalled();
  });
  it("revokes only through the authorized wedding operation", async () => {
    expect(
      (
        await DELETE(new Request("https://app.test", { method: "DELETE" }), {
          params,
        })
      ).status,
    ).toBe(204);
    expect(revoke).toHaveBeenCalledWith(operation, invitationId);
  });
  it("does not disclose unavailable invitation state", async () => {
    revoke.mockResolvedValue(false);
    const response = await DELETE(
      new Request("https://app.test", { method: "DELETE" }),
      { params },
    );
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(organizationId);
  });
});
const organizationId = "unrelated-tenant";
