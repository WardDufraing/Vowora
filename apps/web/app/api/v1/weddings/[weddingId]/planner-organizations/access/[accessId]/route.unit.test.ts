import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, load, revoke, safeRequest } = vi.hoisted(() => ({
  authorize: vi.fn(),
  load: vi.fn(),
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
  loadPlannerOrganizationAccess: load,
  revokePlannerOrganizationRelationship: revoke,
}));
import { DELETE, GET } from "./route";
const weddingId = "019a2f36-0eb9-7000-8000-000000000001",
  accessId = "019a2f36-0eb9-7000-8000-000000000002";
const operation = {
  authorization: {
    correlationId: "7f26b5f5-1d9e-4a91-9fd8-87e0401d8fe0",
  },
};
const params = Promise.resolve({ weddingId, accessId });
beforeEach(() => {
  safeRequest.mockReturnValue(true);
  authorize.mockResolvedValue({ authorized: true, operation });
  revoke.mockResolvedValue(true);
  load.mockResolvedValue({ id: accessId, assignments: [] });
});
describe("planner access revocation API", () => {
  it("loads only the exact authorized access DTO", async () => {
    const response = await GET(new Request("https://app.test"), { params });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      id: accessId,
      assignments: [],
    });
    expect(load).toHaveBeenCalledWith(operation);
  });
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
    expect(revoke).toHaveBeenCalledWith(operation, accessId);
  });
  it("returns the same private not-found for unavailable access", async () => {
    revoke.mockResolvedValue(false);
    const response = await DELETE(
      new Request("https://app.test", { method: "DELETE" }),
      { params },
    );
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(accessId);
  });
});
