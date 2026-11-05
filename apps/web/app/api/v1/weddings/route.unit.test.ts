import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, create, getSession } = vi.hoisted(() => ({
  authorize: vi.fn((value) => value),
  create: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@vowora/database", () => ({
  createCoupleWedding: create,
  WeddingCreationConflictError: class extends Error {},
}));
vi.mock("@vowora/domain", () => ({
  authorizeCoupleWeddingCreation: authorize,
  WeddingCreationAuthorizationError: class extends Error {},
}));
vi.mock("../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
  isSafeStateChangingRequest: () => true,
}));
vi.mock("../../../../lib/database", () => ({
  getRuntimeDatabase: () => ({ database: {} }),
}));
vi.mock("../../../../lib/env", () => ({
  readAuthEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test" }),
}));

import { POST } from "./route";

function request(body: unknown, idempotencyKey = crypto.randomUUID()) {
  return new Request("https://app.test/api/v1/weddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

const valid = {
  name: "Jordan & Alex",
  weddingDate: "2027-06-12",
  timeZone: "Europe/Brussels",
};

beforeEach(() => {
  authorize.mockClear();
  create.mockReset();
  getSession.mockReset();
});

describe("wedding creation API", () => {
  it("rejects unauthenticated creation without touching persistence", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(request(valid));
    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a client-declared planner path", async () => {
    getSession.mockResolvedValue({
      user: { id: "019a1f5e-70a0-7000-8000-000000000001" },
    });
    const response = await POST(request({ ...valid, creationMode: "planner" }));
    expect(response.status).toBe(400);
    expect(authorize).not.toHaveBeenCalled();
  });

  it("binds creation to the authenticated actor and returns the replay state", async () => {
    const actorId = "019a1f5e-70a0-7000-8000-000000000001";
    getSession.mockResolvedValue({ user: { id: actorId } });
    create.mockResolvedValue({
      replayed: false,
      wedding: {
        id: "019a1f5e-70a0-7000-8000-000000000002",
        ...valid,
        settingsVersion: 1,
      },
    });
    const response = await POST(request(valid));
    expect(response.status).toBe(201);
    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ actorId, ...valid }),
    );
    expect(await response.json()).toMatchObject({
      meta: { replayed: false },
      data: { name: valid.name, settingsVersion: 1 },
    });
  });
});
