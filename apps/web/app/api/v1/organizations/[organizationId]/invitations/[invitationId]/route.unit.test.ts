import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, revoke, safeRequest } = vi.hoisted(() => ({
  getSession: vi.fn(),
  revoke: vi.fn(),
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
  revokePlannerOrganizationInvitation: revoke,
}));

import { DELETE } from "./route";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const invitationId = "019a2f36-0eb9-7000-8000-000000000003";
const context = { params: Promise.resolve({ organizationId, invitationId }) };

function request() {
  return new Request(
    `https://app.test/api/v1/organizations/${organizationId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

beforeEach(() => {
  getSession.mockReset();
  revoke.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
  getSession.mockResolvedValue({ user: { id: actorId } });
});

describe("organization invitation revocation API", () => {
  it("rejects unsafe requests before session or repository access", async () => {
    safeRequest.mockReturnValue(false);
    const response = await DELETE(request(), context);
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
  });

  it("passes only authenticated and route-scoped identifiers", async () => {
    revoke.mockResolvedValue(true);
    const response = await DELETE(request(), context);
    expect(response.status).toBe(204);
    expect(revoke).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      organizationId,
      invitationId,
    });
  });

  it("returns the same response for protected and cross-organization invitations", async () => {
    revoke.mockResolvedValue(false);
    const response = await DELETE(request(), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "INVITATION_UNAVAILABLE",
      detail: "The invitation is unavailable.",
    });
  });
});
