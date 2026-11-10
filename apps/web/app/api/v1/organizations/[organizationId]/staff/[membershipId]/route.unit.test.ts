import { beforeEach, describe, expect, it, vi } from "vitest";

const { deactivate, getSession, safeRequest } = vi.hoisted(() => ({
  deactivate: vi.fn(),
  getSession: vi.fn(),
  safeRequest: vi.fn(),
}));

vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../lib/organization-service", () => ({
  deactivatePlannerOrganizationMember: deactivate,
}));

import { DELETE } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const membershipId = "019a2f36-0eb9-7000-8000-000000000002";
const actorId = "019a2f36-0eb9-7000-8000-000000000003";

function request() {
  return new Request(
    `https://app.test/api/v1/organizations/${organizationId}/staff/${membershipId}`,
    { method: "DELETE" },
  );
}

beforeEach(() => {
  deactivate.mockReset();
  getSession.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
  getSession.mockResolvedValue({ user: { id: actorId } });
});

describe("organization staff deactivation API", () => {
  it("rejects an unsafe cross-origin request before session access", async () => {
    safeRequest.mockReturnValue(false);
    const response = await DELETE(request(), {
      params: Promise.resolve({ organizationId, membershipId }),
    });
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(deactivate).not.toHaveBeenCalled();
  });

  it("uses only the authenticated actor and route-scoped identifiers", async () => {
    deactivate.mockResolvedValue({ id: membershipId, actorId });
    const response = await DELETE(request(), {
      params: Promise.resolve({ organizationId, membershipId }),
    });
    expect(response.status).toBe(200);
    expect(deactivate).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      organizationId,
      membershipId,
    });
  });

  it("returns one privacy-safe denial for protected or cross-organization members", async () => {
    deactivate.mockRejectedValue(new Error("not available"));
    const response = await DELETE(request(), {
      params: Promise.resolve({ organizationId, membershipId }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "ACCESS_DENIED",
      detail: "The requested staff change is not permitted.",
    });
  });
});
