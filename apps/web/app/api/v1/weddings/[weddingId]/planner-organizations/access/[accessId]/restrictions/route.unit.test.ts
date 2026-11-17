import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, change, safeRequest } = vi.hoisted(() => ({
  authorize: vi.fn(),
  change: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../../lib/wedding-service", () => ({
  authorizeWeddingSettingsApiOperation: authorize,
  changePlannerStaffRestriction: change,
}));
import { PATCH } from "./route";
const weddingId = "019a2f36-0eb9-7000-8000-000000000001",
  accessId = "019a2f36-0eb9-7000-8000-000000000002",
  organizationMembershipId = "019a2f36-0eb9-7000-8000-000000000003";
const operation = {
  authorization: {
    correlationId: "7f26b5f5-1d9e-4a91-9fd8-87e0401d8fe0",
  },
};
const params = Promise.resolve({ weddingId, accessId });
beforeEach(() => {
  safeRequest.mockReturnValue(true);
  authorize.mockResolvedValue({ authorized: true, operation });
  change.mockResolvedValue(undefined);
});
function request(body: unknown) {
  return new Request("https://app.test", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
describe("planner staff restriction API", () => {
  it("rejects CSRF before authorization", async () => {
    safeRequest.mockReturnValue(false);
    expect((await PATCH(request({}), { params })).status).toBe(403);
    expect(authorize).not.toHaveBeenCalled();
  });
  it("rejects invalid membership payloads", async () => {
    expect(
      (
        await PATCH(
          request({ organizationMembershipId: "wrong-tenant", blocked: true }),
          { params },
        )
      ).status,
    ).toBe(400);
    expect(change).not.toHaveBeenCalled();
  });
  it("passes exact tenant-scoped restriction and hides service errors", async () => {
    expect(
      (
        await PATCH(request({ organizationMembershipId, blocked: true }), {
          params,
        })
      ).status,
    ).toBe(200);
    expect(change).toHaveBeenCalledWith(operation, {
      accessId,
      organizationMembershipId,
      blocked: true,
    });
    change.mockRejectedValueOnce(new Error("foreign organization"));
    const response = await PATCH(
      request({ organizationMembershipId, blocked: false }),
      { params },
    );
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("foreign organization");
  });
});
