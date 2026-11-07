import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, conflict, update } = vi.hoisted(() => ({
  authorize: vi.fn(),
  conflict: vi.fn(() => false),
  update: vi.fn(),
}));

vi.mock("../../../../../lib/auth", () => ({
  getAuth: () => ({}),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));
vi.mock("../../../../../lib/wedding-service", () => ({
  authorizeWeddingSettingsApiOperation: authorize,
  isWeddingSettingsConflict: conflict,
  updateWeddingWorkspace: update,
}));

import { PATCH } from "./route";

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const validPatch = {
  expectedVersion: 1,
  name: "Jordan & Alex",
  weddingDate: "2027-06-12",
  timeZone: "Europe/Brussels",
};

function request(correlationId?: string) {
  return new Request(`https://app.test/api/v1/weddings/${weddingId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(correlationId ? { "x-correlation-id": correlationId } : {}),
    },
    body: JSON.stringify(validPatch),
  });
}

function authorizeWith(correlationId: string) {
  const operation = { authorization: { correlationId } };
  authorize.mockResolvedValue({ authorized: true, operation });
  return operation;
}

beforeEach(() => {
  authorize.mockReset();
  conflict.mockReset();
  conflict.mockReturnValue(false);
  update.mockReset();
  update.mockResolvedValue({
    id: weddingId,
    ...validPatch,
    settingsVersion: 2,
  });
});

describe("wedding settings API correlation", () => {
  it.each([
    ["valid", "fd901f2e-3f91-4e12-a32e-cf48c853fd44"],
    ["invalid", "aaf5f9b0-b453-4db0-8d20-e62c7f0a68d7"],
    ["absent", "c96ef7c6-b4c8-43d9-89b7-84312791afe8"],
  ])(
    "uses the authorized %s request ID for success",
    async (kind, resolvedId) => {
      const operation = authorizeWith(resolvedId);
      const supplied =
        kind === "valid"
          ? resolvedId
          : kind === "invalid"
            ? "client-controlled-invalid-id"
            : undefined;
      const response = await PATCH(request(supplied), {
        params: Promise.resolve({ weddingId }),
      });
      expect(update).toHaveBeenCalledWith(operation, validPatch);
      expect(response.headers.get("x-correlation-id")).toBe(resolvedId);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toMatchObject({
        meta: { correlationId: resolvedId },
      });
    },
  );

  it("keeps the authorized request ID on a post-authorization problem", async () => {
    const correlationId = "ed901f2e-3f91-4e12-a32e-cf48c853fd44";
    authorizeWith(correlationId);
    conflict.mockReturnValue(true);
    update.mockRejectedValue(new Error("conflict"));
    const response = await PATCH(request(), {
      params: Promise.resolve({ weddingId }),
    });
    expect(response.status).toBe(409);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
    expect(await response.json()).toMatchObject({ correlationId });
  });
});
