import { describe, expect, it } from "vitest";

import { resolveAuthorizationContext } from "./authorization.js";
import {
  createPermissionScopeChangeCapture,
  PermissionScopeChangeValidationError,
} from "./permission-changes.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const organizationA = "019a1f5e-70a0-7000-8000-000000000020";
const membershipId = "019a1f5e-70a0-7000-8000-000000000030";
const auditEventId = "019a1f5e-70a0-7000-8000-000000000040";
const outboxEventId = "019a1f5e-70a0-7000-8000-000000000041";
const occurredAt = "2026-10-29T09:00:00.000Z";

async function context(scope: "wedding" | "organization") {
  return resolveAuthorizationContext(
    {
      actorId,
      ...(scope === "wedding"
        ? { activeWeddingId: weddingA }
        : { activeOrganizationId: organizationA }),
      permissionScopeVersion: "actor:7",
      correlationId: "d04002c3-1f13-4da5-87a0-000000000001",
    },
    { authorize: async () => true },
  );
}

describe("permission scope change capture", () => {
  it("creates immutable, privacy-minimized wedding audit and invalidation events", async () => {
    const capture = createPermissionScopeChangeCapture(
      await context("wedding"),
      {
        scope: "wedding",
        weddingId: weddingA,
        membershipId,
        change: "access_revoked",
        effectiveAccess: "reduced",
        previousPermissionScopeVersion: "membership:7",
        permissionScopeVersion: "membership:8",
        auditEventId,
        outboxEventId,
        occurredAt,
      },
    );

    expect(capture.audit).toMatchObject({
      eventId: auditEventId,
      eventType: "authorization.permission_scope_changed",
      subjectType: "wedding_membership",
      subjectId: membershipId,
      weddingId: weddingA,
      actorId,
      metadata: {
        change: "access_revoked",
        effectiveAccess: "reduced",
        previousPermissionScopeVersion: "membership:7",
        permissionScopeVersion: "membership:8",
      },
    });
    expect(capture.invalidation).toMatchObject({
      eventId: outboxEventId,
      eventType: "authorization.permission_scope_invalidated",
      weddingId: weddingA,
      payload: {
        change: "access_revoked",
        effectiveAccess: "reduced",
        membershipId,
        permissionScopeVersion: "membership:8",
        scope: "wedding",
        scopeId: weddingA,
      },
    });
    expect(Object.isFrozen(capture)).toBe(true);
    expect(Object.isFrozen(capture.audit.metadata)).toBe(true);
    expect(Object.isFrozen(capture.invalidation.payload)).toBe(true);
    expect(JSON.stringify(capture)).not.toContain("email");
  });

  it("captures organization changes only in their exact organization scope", async () => {
    const capture = createPermissionScopeChangeCapture(
      await context("organization"),
      {
        scope: "organization",
        organizationId: organizationA,
        membershipId,
        change: "permissions_changed",
        effectiveAccess: "expanded",
        previousPermissionScopeVersion: "org:3",
        permissionScopeVersion: "org:4",
        auditEventId,
        outboxEventId,
        occurredAt,
      },
    );

    expect(capture.audit).toMatchObject({
      organizationId: organizationA,
      subjectType: "organization_membership",
    });
    expect(capture.invalidation.payload).toMatchObject({
      scope: "organization",
      scopeId: organizationA,
    });
  });

  it("rejects cross-tenant capture and unchanged or ambiguous versions", async () => {
    const authorization = await context("wedding");
    const base = {
      scope: "wedding" as const,
      weddingId: weddingA,
      membershipId,
      change: "permissions_changed" as const,
      effectiveAccess: "reduced" as const,
      previousPermissionScopeVersion: "membership:7",
      permissionScopeVersion: "membership:8",
      auditEventId,
      outboxEventId,
      occurredAt,
    };

    expect(() =>
      createPermissionScopeChangeCapture(authorization, {
        ...base,
        weddingId: weddingB,
      }),
    ).toThrow(PermissionScopeChangeValidationError);
    expect(() =>
      createPermissionScopeChangeCapture(authorization, {
        ...base,
        permissionScopeVersion: base.previousPermissionScopeVersion,
      }),
    ).toThrow(PermissionScopeChangeValidationError);
    expect(() =>
      createPermissionScopeChangeCapture(authorization, {
        ...base,
        outboxEventId: auditEventId,
      }),
    ).toThrow(PermissionScopeChangeValidationError);
  });

  it("rejects over-posted private data without reflecting its value", async () => {
    const privateValue = "private-person@example.com";
    let caught: unknown;
    try {
      createPermissionScopeChangeCapture(await context("wedding"), {
        scope: "wedding",
        weddingId: weddingA,
        membershipId,
        change: "role_changed",
        effectiveAccess: "unchanged",
        previousPermissionScopeVersion: "membership:7",
        permissionScopeVersion: "membership:8",
        auditEventId,
        outboxEventId,
        occurredAt,
        email: privateValue,
      } as never);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PermissionScopeChangeValidationError);
    expect(String(caught)).not.toContain(privateValue);
  });
});
