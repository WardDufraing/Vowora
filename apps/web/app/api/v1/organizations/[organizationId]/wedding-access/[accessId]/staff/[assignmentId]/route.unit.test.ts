import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, remove, safeRequest } = vi.hoisted(() => ({
  getSession: vi.fn(),
  remove: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../../lib/organization-service", () => ({
  removePlannerWeddingStaff: remove,
}));

import { DELETE } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const accessId = "019a2f36-0eb9-7000-8000-000000000002";
const assignmentId = "019a2f36-0eb9-7000-8000-000000000003";
beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: "actor" } });
  safeRequest.mockReturnValue(true);
  remove.mockResolvedValue(true);
});

describe("planner assignment removal route", () => {
  it("rejects unsafe requests before session access", async () => {
    safeRequest.mockReturnValue(false);
    const response = await DELETE(
      new Request("https://app.test", { method: "DELETE" }),
      { params: Promise.resolve({ organizationId, accessId, assignmentId }) },
    );
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
  });
  it("uses authenticated actor and route-scoped identifiers", async () => {
    const response = await DELETE(
      new Request("https://app.test", { method: "DELETE" }),
      { params: Promise.resolve({ organizationId, accessId, assignmentId }) },
    );
    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      accessId,
      assignmentId,
    });
  });
  it("uses a privacy-safe unavailable response", async () => {
    remove.mockRejectedValue(new Error("cross tenant"));
    const response = await DELETE(
      new Request("https://app.test", { method: "DELETE" }),
      { params: Promise.resolve({ organizationId, accessId, assignmentId }) },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "ASSIGNMENT_UNAVAILABLE",
    });
  });
});
