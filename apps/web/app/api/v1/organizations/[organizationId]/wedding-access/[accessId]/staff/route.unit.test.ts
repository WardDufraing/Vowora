import { beforeEach, describe, expect, it, vi } from "vitest";

const { assign, getSession, list, safeRequest } = vi.hoisted(() => ({
  assign: vi.fn(),
  getSession: vi.fn(),
  list: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../lib/organization-service", () => ({
  assignPlannerWeddingStaff: assign,
  loadPlannerWeddingAccesses: list,
}));
import { GET, POST } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const accessId = "019a2f36-0eb9-7000-8000-000000000002";
const memberId = "019a2f36-0eb9-7000-8000-000000000003";
const params = Promise.resolve({ organizationId, accessId });
beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: "actor" } });
  safeRequest.mockReturnValue(true);
  assign.mockResolvedValue({ id: "assignment" });
  list.mockResolvedValue([{ id: accessId, assignments: [] }]);
});
describe("planner staff assignment API", () => {
  it("loads only the route-scoped access", async () => {
    const response = await GET(new Request("https://app.test"), { params });
    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
    });
  });
  it("rejects CSRF before session access", async () => {
    safeRequest.mockReturnValue(false);
    const response = await POST(
      new Request("https://app.test", { method: "POST" }),
      { params },
    );
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
  });
  it("passes validated assignment input with authenticated identity", async () => {
    const request = new Request("https://app.test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationMembershipId: memberId,
        permissions: [{ area: "tasks", actions: ["view"] }],
        isLead: true,
      }),
    });
    const response = await POST(request, { params });
    expect(response.status).toBe(201);
    expect(assign).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      accessId,
      request: {
        organizationMembershipId: memberId,
        permissions: [{ area: "tasks", actions: ["view"] }],
        isLead: true,
      },
    });
  });
});
