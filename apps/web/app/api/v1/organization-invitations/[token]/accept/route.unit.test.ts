import { beforeEach, describe, expect, it, vi } from "vitest";

const { claim, getSession, safeRequest } = vi.hoisted(() => ({
  claim: vi.fn(),
  getSession: vi.fn(),
  safeRequest: vi.fn(),
}));

vi.mock("../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../lib/organization-service", () => ({
  claimOrganizationInvitation: claim,
}));

import { POST } from "./route";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const token = "a".repeat(43);

function request(body: unknown = { accept: true }) {
  return new Request(
    `https://app.test/api/v1/organization-invitations/${token}/accept`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  claim.mockReset();
  getSession.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
  getSession.mockResolvedValue({ user: { id: actorId } });
});

describe("organization invitation acceptance API", () => {
  it("rejects unsafe requests before session or claim access", async () => {
    safeRequest.mockReturnValue(false);
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("requires an authenticated actor and explicit acceptance", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(401);
    expect(claim).not.toHaveBeenCalled();

    getSession.mockResolvedValue({ user: { id: actorId } });
    const invalid = await POST(request({ accept: false }), {
      params: Promise.resolve({ token }),
    });
    expect(invalid.status).toBe(400);
    expect(claim).not.toHaveBeenCalled();
  });

  it("binds the token to the authenticated actor and preserves replay state", async () => {
    claim.mockResolvedValue({ organizationId, replayed: true });
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(200);
    expect(claim).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      token,
    });
    expect(await response.json()).toMatchObject({
      data: { organizationId },
      meta: { replayed: true },
    });
  });

  it("uses one privacy-safe response for every rejected capability", async () => {
    claim.mockRejectedValue(new Error("wrong email"));
    const response = await POST(request(), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "INVITATION_UNAVAILABLE",
      detail: "The invitation is unavailable.",
    });
  });
});
