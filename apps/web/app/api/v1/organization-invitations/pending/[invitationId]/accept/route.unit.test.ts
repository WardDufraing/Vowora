import { beforeEach, describe, expect, it, vi } from "vitest";

const { claim, getSession, safeRequest } = vi.hoisted(() => ({
  claim: vi.fn(),
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
  claimOrganizationInvitation: claim,
}));

import { POST } from "./route";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const invitationId = "019a2f36-0eb9-7000-8000-000000000003";

beforeEach(() => {
  claim.mockReset();
  getSession.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
  getSession.mockResolvedValue({ user: { id: actorId } });
});

describe("pending organization invitation acceptance API", () => {
  it("returns the accepted role for a role-safe landing destination", async () => {
    claim.mockResolvedValue({
      organizationId,
      role: "employee",
      replayed: false,
    });

    const response = await POST(
      new Request(
        `https://app.test/api/v1/organization-invitations/pending/${invitationId}/accept`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accept: true }),
        },
      ),
      { params: Promise.resolve({ invitationId }) },
    );

    expect(response.status).toBe(200);
    expect(claim).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      invitationId,
    });
    expect(await response.json()).toMatchObject({
      data: { organizationId, role: "employee" },
      meta: { replayed: false },
    });
  });
});
