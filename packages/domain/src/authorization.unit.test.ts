import { describe, expect, it } from "vitest";

import {
  AuthorizationContextError,
  parseAuthorizationContext,
} from "./index.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

describe("authorization context", () => {
  it("validates and freezes an explicitly scoped actor context", () => {
    const context = parseAuthorizationContext({
      actorId,
      activeWeddingId: weddingId,
      permissionScopeVersion: "wedding:7",
      correlationId,
    });

    expect(context).toEqual({
      actorId,
      activeWeddingId: weddingId,
      permissionScopeVersion: "wedding:7",
      correlationId,
    });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it("denies unscoped, malformed and over-posted contexts without reflecting values", () => {
    const privateValue = "private-invalid-actor";
    for (const input of [
      {
        actorId,
        permissionScopeVersion: "v1",
        correlationId,
      },
      {
        actorId: privateValue,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId,
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId,
        untrustedGrant: "admin",
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "",
        correlationId,
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId: "not-a-correlation-id",
      },
    ]) {
      let caught: unknown;
      try {
        parseAuthorizationContext(input);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AuthorizationContextError);
      expect(String(caught)).not.toContain(privateValue);
    }
  });
});
