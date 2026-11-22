import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "./route";

const { authorizeUpdate, changeRecord, safeRequest } = vi.hoisted(() => ({
  authorizeUpdate: vi.fn(),
  changeRecord: vi.fn(),
  safeRequest: vi.fn(() => true),
}));

vi.mock("../../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({
    NEXT_PUBLIC_APP_URL: "https://app.example.test",
  }),
}));
vi.mock("../../../../../../../lib/planning-service", () => ({
  authorizePlanningUpdate: authorizeUpdate,
  changePlanningRecord: changeRecord,
  planningFailure: vi.fn(),
}));

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const recordId = "019a1f5e-70a0-7000-8000-000000000003";

beforeEach(() => {
  vi.clearAllMocks();
  safeRequest.mockReturnValue(true);
});

describe("planning record route", () => {
  it("checks the exact wedding and record before applying an update", async () => {
    const operation = { authorized: true, operation: { resourceId: recordId } };
    authorizeUpdate.mockResolvedValue(operation);
    changeRecord.mockResolvedValue({ recordType: "task", id: recordId });
    const response = await PATCH(
      new Request("https://app.example.test", {
        method: "PATCH",
        body: JSON.stringify({
          kind: "task",
          expectedVersion: 1,
          title: "Confirm venue",
          description: null,
          dueDate: null,
          phaseId: null,
          ownerMembershipId: null,
          status: "not_started",
          blockedReason: null,
          lifecycle: "active",
        }),
      }),
      { params: Promise.resolve({ weddingId, recordId }) },
    );
    expect(response.status).toBe(200);
    expect(authorizeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Request),
      weddingId,
      recordId,
    );
    expect(changeRecord).toHaveBeenCalledWith(
      operation.operation,
      recordId,
      expect.objectContaining({ expectedVersion: 1 }),
    );
  });

  it("rejects unsafe state-changing requests before authorization", async () => {
    safeRequest.mockReturnValue(false);
    const response = await PATCH(
      new Request("https://evil.example", { method: "PATCH" }),
      { params: Promise.resolve({ weddingId, recordId }) },
    );
    expect(response.status).toBe(403);
    expect(authorizeUpdate).not.toHaveBeenCalled();
  });
});
