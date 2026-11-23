import { describe, expect, it } from "vitest";

import {
  decodePlanningCursor,
  encodePlanningCursor,
  PlanningCursorError,
} from "./planning-cursor";

const secret = "a".repeat(32);
const actorId = "actor-1";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const afterId = "019a1f5e-70a0-7000-8000-000000000003";

function expected(
  overrides: Partial<Parameters<typeof decodePlanningCursor>[2]> = {},
) {
  return {
    actorId,
    weddingId,
    permissionScopeVersion: "scope:1",
    kind: "task" as const,
    limit: 50,
    ...overrides,
  };
}

describe("planning cursor", () => {
  it("round-trips a signed versioned cursor bound to the request", () => {
    const cursor = encodePlanningCursor(secret, {
      ...expected(),
      afterId,
    });
    expect(decodePlanningCursor(secret, cursor, expected())).toBe(afterId);
    expect(cursor).not.toContain(afterId);
  });

  it("rejects tampering and cross-scope, wedding, kind and limit reuse", () => {
    const cursor = encodePlanningCursor(secret, {
      ...expected(),
      afterId,
    });
    const [payload, digest] = cursor.split(".");
    for (const candidate of [
      `${payload}x.${digest}`,
      cursor.slice(0, -1) + (cursor.endsWith("a") ? "b" : "a"),
    ])
      expect(() => decodePlanningCursor(secret, candidate, expected())).toThrow(
        PlanningCursorError,
      );
    for (const binding of [
      expected({ actorId: "actor-2" }),
      expected({ weddingId: "019a1f5e-70a0-7000-8000-000000000004" }),
      expected({ permissionScopeVersion: "scope:2" }),
      expected({ kind: "milestone" }),
      expected({ limit: 25 }),
    ])
      expect(() => decodePlanningCursor(secret, cursor, binding)).toThrow(
        PlanningCursorError,
      );
  });
});
