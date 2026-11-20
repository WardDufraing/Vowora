import { beforeEach, describe, expect, it, vi } from "vitest";

const { change, getSession, safeRequest, unavailable } = vi.hoisted(() => ({
  change: vi.fn(),
  getSession: vi.fn(),
  safeRequest: vi.fn(),
  unavailable: vi.fn(),
}));
vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../lib/organization-service", () => ({
  changeOrganizationPrivateNote: change,
  isPlannerPrivateUnavailable: unavailable,
}));

import { PATCH } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const noteId = "019a2f36-0eb9-7000-8000-000000000002";
const params = Promise.resolve({ organizationId, noteId });

beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: "actor" } });
  safeRequest.mockReturnValue(true);
  unavailable.mockReturnValue(false);
  change.mockResolvedValue({ id: noteId, status: "archived" });
});

describe("organization-private note API", () => {
  it("binds archive authority to the authenticated organization and exact note", async () => {
    const response = await PATCH(
      new Request("https://app.test", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ archive: true }),
      }),
      { params },
    );
    expect(response.status).toBe(200);
    expect(change).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      noteId,
      request: { archive: true },
    });
  });

  it("returns a privacy-safe conflict for an already archived note", async () => {
    unavailable.mockReturnValue(true);
    change.mockRejectedValue({ reason: "stale" });
    const response = await PATCH(
      new Request("https://app.test", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ archive: true }),
      }),
      { params },
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({
      code: "NOTE_ARCHIVED",
      detail: "The private note could not be changed.",
    });
    expect(JSON.stringify(body)).not.toContain(noteId);
  });

  it("rejects CSRF before session or note content is processed", async () => {
    safeRequest.mockReturnValue(false);
    const response = await PATCH(
      new Request("https://app.test", { method: "PATCH" }),
      { params },
    );
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
});
