import { beforeEach, describe, expect, it, vi } from "vitest";

const { add, getSession, list, safeRequest } = vi.hoisted(() => ({
  add: vi.fn(),
  getSession: vi.fn(),
  list: vi.fn(),
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
  addOrganizationPrivateNote: add,
  loadOrganizationPrivateNotes: list,
}));

import { GET, POST } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const weddingId = "019a2f36-0eb9-7000-8000-000000000002";
const params = Promise.resolve({ organizationId });

beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: "actor" } });
  safeRequest.mockReturnValue(true);
  list.mockResolvedValue([]);
  add.mockResolvedValue({ id: "note" });
});

describe("organization-private notes API", () => {
  it("uses only authenticated organization scope when listing", async () => {
    const response = await GET(new Request("https://app.test"), { params });
    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
    });
  });

  it("rejects CSRF before session or note content is processed", async () => {
    safeRequest.mockReturnValue(false);
    const response = await POST(
      new Request("https://app.test", { method: "POST" }),
      { params },
    );
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("passes a validated optional wedding link without tenant identifiers", async () => {
    const response = await POST(
      new Request("https://app.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Private", body: "Internal", weddingId }),
      }),
      { params },
    );
    expect(response.status).toBe(201);
    expect(add).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      request: { title: "Private", body: "Internal", weddingId },
    });
  });
});
