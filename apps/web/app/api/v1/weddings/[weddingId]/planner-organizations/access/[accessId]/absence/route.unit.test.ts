import { beforeEach, describe, expect, it, vi } from "vitest";
const { authorize, change, safeRequest } = vi.hoisted(() => ({
  authorize: vi.fn(),
  change: vi.fn(),
  safeRequest: vi.fn(),
}));
vi.mock("../../../../../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: safeRequest,
}));
vi.mock("../../../../../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../../../../../lib/wedding-service", () => ({
  authorizeLeadAbsenceApiOperation: authorize,
  changeLeadPlannerAbsence: change,
}));
import { PATCH } from "./route";
const weddingId = "019a2f36-0eb9-7000-8000-000000000001",
  accessId = "019a2f36-0eb9-7000-8000-000000000002";
const operation = {
  authorization: {
    correlationId: "7f26b5f5-1d9e-4a91-9fd8-87e0401d8fe0",
  },
};
const params = Promise.resolve({ weddingId, accessId });
beforeEach(() => {
  safeRequest.mockReturnValue(true);
  authorize.mockResolvedValue({ authorized: true, operation });
  change.mockResolvedValue(undefined);
});
function request(body: unknown) {
  return new Request("https://app.test", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
describe("lead planner absence API", () => {
  it("rejects CSRF before authorization", async () => {
    safeRequest.mockReturnValue(false);
    expect((await PATCH(request({}), { params })).status).toBe(403);
    expect(authorize).not.toHaveBeenCalled();
  });
  it("rejects invalid absence windows", async () => {
    expect(
      (await PATCH(request({ startsAt: "invalid", endsAt: null }), { params }))
        .status,
    ).toBe(400);
    expect(change).not.toHaveBeenCalled();
  });
  it("updates and clears the authorized lead absence", async () => {
    const startsAt = "2027-01-01T00:00:00.000Z",
      endsAt = "2027-01-02T00:00:00.000Z";
    expect(
      (await PATCH(request({ startsAt, endsAt }), { params })).status,
    ).toBe(200);
    expect(change).toHaveBeenCalledWith(operation, {
      accessId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });
    expect(
      (await PATCH(request({ startsAt: null, endsAt: null }), { params }))
        .status,
    ).toBe(200);
    expect(change).toHaveBeenLastCalledWith(operation, {
      accessId,
      startsAt: null,
      endsAt: null,
    });
  });
});
