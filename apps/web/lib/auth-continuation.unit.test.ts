import { describe, expect, it } from "vitest";

import {
  authContinuationQuery,
  safeAuthContinuation,
} from "./auth-continuation";

describe("authentication continuation", () => {
  it("preserves an invitation path and encodes it for auth links", () => {
    const path = "/invitations/a_safe-token?locale=nl";
    expect(safeAuthContinuation(path)).toBe(path);
    expect(authContinuationQuery(path)).toBe(
      `?next=${encodeURIComponent(path)}`,
    );
  });

  it.each([
    "https://attacker.test/invitations/token",
    "//attacker.test/path",
    "/\\attacker.test/path",
    "invitations/token",
    "/safe\nunsafe",
  ])("rejects unsafe continuation %s", (value) => {
    expect(safeAuthContinuation(value)).toBe("/account");
  });
});
