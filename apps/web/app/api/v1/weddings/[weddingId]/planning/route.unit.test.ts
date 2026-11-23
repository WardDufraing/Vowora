import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const { authorizeCreate, getSession, loadWorkspace, safeRequest } = vi.hoisted(
  () => ({
    authorizeCreate: vi.fn(),
    getSession: vi.fn(),
    loadWorkspace: vi.fn(),
    safeRequest: vi.fn(() => true),
  }),
);

vi.mock("../../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({
    NEXT_PUBLIC_APP_URL: "https://app.example.test",
  }),
}));
vi.mock("../../../../../../lib/planning-service", () => ({
  addPlanningRecord: vi.fn(),
  authorizePlanningCreate: authorizeCreate,
  loadPlanningWorkspace: loadWorkspace,
  planningFailure: vi.fn(),
}));

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  safeRequest.mockReturnValue(true);
});

describe("planning collection route", () => {
  it("returns a permission-filtered workspace to an authenticated member", async () => {
    getSession.mockResolvedValue({ user: { id: "actor-1" } });
    loadWorkspace.mockResolvedValue({ tasks: [], milestones: [] });
    const response = await GET(new Request("https://app.example.test"), {
      params: Promise.resolve({ weddingId }),
    });
    expect(response.status).toBe(200);
    expect(loadWorkspace).toHaveBeenCalledWith({
      actorId: "actor-1",
      weddingId,
      limit: 50,
    });
  });

  it("does not disclose a workspace to an anonymous caller", async () => {
    getSession.mockResolvedValue(null);
    const response = await GET(new Request("https://app.example.test"), {
      params: Promise.resolve({ weddingId }),
    });
    expect(response.status).toBe(401);
    expect(loadWorkspace).not.toHaveBeenCalled();
  });

  it("rejects an invalid collection query before loading records", async () => {
    getSession.mockResolvedValue({ user: { id: "actor-1" } });
    const response = await GET(
      new Request("https://app.example.test?limit=101"),
      { params: Promise.resolve({ weddingId }) },
    );
    expect(response.status).toBe(400);
    expect(loadWorkspace).not.toHaveBeenCalled();
  });

  it("rejects an invalid create body before authorization", async () => {
    const response = await POST(
      new Request("https://app.example.test", {
        method: "POST",
        body: JSON.stringify({ kind: "task", title: "" }),
      }),
      { params: Promise.resolve({ weddingId }) },
    );
    expect(response.status).toBe(400);
    expect(authorizeCreate).not.toHaveBeenCalled();
  });
});
