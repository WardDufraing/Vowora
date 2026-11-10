import { beforeEach, describe, expect, it, vi } from "vitest";

const { createInvitation, getSession, loadInvitations, safeRequest } =
  vi.hoisted(() => ({
    createInvitation: vi.fn(),
    getSession: vi.fn(),
    loadInvitations: vi.fn(),
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
  createOrganizationStaffInvitation: createInvitation,
  isOrganizationConflict: () => false,
  loadOrganizationInvitations: loadInvitations,
}));

import { GET, POST } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const actorId = "019a2f36-0eb9-7000-8000-000000000002";
const context = { params: Promise.resolve({ organizationId }) };

function request(method: "GET" | "POST", body?: unknown) {
  return new Request(
    `https://app.test/api/v1/organizations/${organizationId}/invitations`,
    {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

beforeEach(() => {
  createInvitation.mockReset();
  getSession.mockReset();
  loadInvitations.mockReset();
  safeRequest.mockReset();
  safeRequest.mockReturnValue(true);
  getSession.mockResolvedValue({ user: { id: actorId } });
});

describe("organization invitation API", () => {
  it("passes only authenticated and route-scoped authority to the service", async () => {
    createInvitation.mockResolvedValue({
      invitation: {
        id: "019a2f36-0eb9-7000-8000-000000000003",
        organizationId,
        invitedEmail: "staff@example.test",
        role: "employee",
        status: "pending",
        expiresAt: new Date().toISOString(),
        reminderAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      token: "secret-capability",
    });
    const response = await POST(
      request("POST", {
        email: "staff@example.test",
        role: "employee",
        locale: "en",
      }),
      context,
    );
    expect(response.status).toBe(201);
    expect(createInvitation).toHaveBeenCalledWith({
      actorId,
      correlationId: expect.any(String),
      organizationId,
      request: {
        email: "staff@example.test",
        role: "employee",
        locale: "en",
      },
    });
  });

  it("returns the same privacy-safe denial for unauthorized listing", async () => {
    loadInvitations.mockRejectedValue(new Error("cross organization"));
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "INVITATION_UNAVAILABLE",
      detail: "The invitations are unavailable.",
    });
  });
});
