import { beforeEach, describe, expect, it, vi } from "vitest";

const { finish, getSession, preview, safeRequest, unavailable } = vi.hoisted(
  () => ({
    finish: vi.fn(),
    getSession: vi.fn(),
    preview: vi.fn(),
    safeRequest: vi.fn(),
    unavailable: vi.fn(),
  }),
);
vi.mock("../../../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../lib/organization-service", () => ({
  finishOrganizationWeddingExit: finish,
  isPlannerPrivateUnavailable: unavailable,
  loadOrganizationWeddingExitPreview: preview,
}));

import { GET, POST } from "./route";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const accessId = "019a2f36-0eb9-7000-8000-000000000002";
const requestId = "019a2f36-0eb9-4000-8000-000000000003";
const params = Promise.resolve({ organizationId, accessId });

beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: "actor" } });
  safeRequest.mockReturnValue(true);
  preview.mockResolvedValue({ accessId });
  finish.mockResolvedValue({ id: "handover", replayed: false, snapshot: {} });
  unavailable.mockReturnValue(false);
});

describe("organization wedding handover API", () => {
  it("generates preview from authenticated exact access scope", async () => {
    const response = await GET(new Request("https://app.test?mode=guided"), {
      params,
    });
    expect(response.status).toBe(200);
    expect(preview).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      accessId,
      request: { mode: "guided", requestId: expect.any(String) },
    });
  });

  it("rejects CSRF before exit authority is evaluated", async () => {
    safeRequest.mockReturnValue(false);
    const response = await POST(
      new Request("https://app.test", { method: "POST" }),
      { params },
    );
    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
  });

  it("passes stable request identity and immediate-exit choice", async () => {
    const response = await POST(
      new Request("https://app.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "immediate", requestId }),
      }),
      { params },
    );
    expect(response.status).toBe(200);
    expect(finish).toHaveBeenCalledWith({
      actorId: "actor",
      correlationId: expect.any(String),
      organizationId,
      accessId,
      request: { mode: "immediate", requestId },
    });
  });
});
