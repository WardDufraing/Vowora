import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, create, list, safeRequest } = vi.hoisted(() => ({
  authorize: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: {} }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../lib/wedding-service", () => ({
  authorizeWeddingSettingsApiOperation: authorize,
  createPlannerOrganizationInvitation: create,
  loadPlannerOrganizationInvitations: list,
}));
import { GET, POST } from "./route";

const weddingId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const requestId = "7f26b5f5-1d9e-4a91-9fd8-87e0401d8fe0";
const operation = {
  authorization: { correlationId: requestId },
};
const params = Promise.resolve({ weddingId });
beforeEach(() => {
  safeRequest.mockReturnValue(true);
  authorize.mockResolvedValue({ authorized: true, operation });
  list.mockResolvedValue([]);
  create.mockResolvedValue({
    authorized: true,
    correlationId: requestId,
    result: {
      invitation: { id: "invitation" },
      organizationName: "Plan Co",
      replayed: false,
    },
  });
});
describe("wedding planner organization invitations API", () => {
  it("authorizes tenant-scoped listing", async () => {
    expect(
      (await GET(new Request("https://app.test"), { params })).status,
    ).toBe(200);
    expect(authorize).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Request),
      weddingId,
    );
    expect(list).toHaveBeenCalledWith(operation);
  });
  it("rejects unsafe state changes before service access", async () => {
    safeRequest.mockReturnValue(false);
    expect(
      (
        await POST(new Request("https://app.test", { method: "POST" }), {
          params,
        })
      ).status,
    ).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });
  it("validates the payload and idempotency key", async () => {
    const response = await POST(
      new Request("https://app.test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "bad",
        },
        body: "{}",
      }),
      { params },
    );
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it("passes stable request identity and reports replay", async () => {
    create.mockResolvedValueOnce({
      authorized: true,
      correlationId: requestId,
      result: {
        invitation: { id: "invitation" },
        organizationName: "Plan Co",
        replayed: true,
      },
    });
    const request = new Request("https://app.test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": requestId,
      },
      body: JSON.stringify({
        organizationId,
        permissionCeiling: [{ area: "tasks", actions: ["view"] }],
      }),
    });
    expect((await POST(request, { params })).status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ weddingId, issuanceRequestId: requestId }),
    );
  });
  it("uses a privacy-safe conflict response", async () => {
    create.mockRejectedValueOnce(new Error("cross-tenant details"));
    const request = new Request("https://app.test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": requestId,
      },
      body: JSON.stringify({
        organizationId,
        permissionCeiling: [{ area: "tasks", actions: ["view"] }],
      }),
    });
    const response = await POST(request, { params });
    expect(response.status).toBe(409);
    expect(await response.text()).not.toContain("cross-tenant");
  });
});
