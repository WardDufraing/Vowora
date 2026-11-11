import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, getSession, safeRequest } = vi.hoisted(() => ({
  create: vi.fn(),
  getSession: vi.fn(),
  safeRequest: vi.fn(),
}));

vi.mock("../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../lib/organization-service", () => ({
  createPlannerOrganization: create,
  isOrganizationAuthorizationFailure: () => false,
  isOrganizationConflict: () => false,
}));

import { POST } from "./route";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";

function request(body: unknown, key = crypto.randomUUID()) {
  return new Request("https://app.test/api/v1/organizations", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": key },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  create.mockReset();
  getSession.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
});

describe("organization creation API", () => {
  it("requires an authenticated verified identity", async () => {
    getSession.mockResolvedValue({
      user: { id: actorId, emailVerified: false },
    });
    const response = await POST(request({ name: "North Star" }));
    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it("binds an idempotent request to the authenticated actor", async () => {
    const key = crypto.randomUUID();
    getSession.mockResolvedValue({
      user: { id: actorId, emailVerified: true },
    });
    create.mockResolvedValue({
      replayed: false,
      organization: {
        id: "019a2f36-0eb9-7000-8000-000000000002",
        name: "North Star",
        createdAt: new Date().toISOString(),
      },
    });
    const response = await POST(request({ name: "North Star" }, key));
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      creationRequestId: key,
      request: { name: "North Star" },
    });
    expect(await response.json()).toMatchObject({
      data: { name: "North Star" },
      meta: { replayed: false },
    });
  });
});
