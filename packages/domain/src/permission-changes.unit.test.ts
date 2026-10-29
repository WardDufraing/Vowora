import { describe, expect, it, vi } from "vitest";

import {
  authorizeWeddingPermissionChange,
  completeAuthorizedWeddingPermissionChange,
  consumeAuthorizedWeddingPermissionChange,
  PermissionScopeChangeError,
  type WeddingPermissionChangeAuthorizationState,
} from "./permission-changes.js";
import { weddingPermissionAreas } from "./permissions.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const targetActorId = "019a1f5e-70a0-7000-8000-000000000002";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const membershipId = "019a1f5e-70a0-7000-8000-000000000030";
const auditEventId = "019a1f5e-70a0-7000-8000-000000000040";
const outboxEventId = "019a1f5e-70a0-7000-8000-000000000041";
const evaluatedAt = new Date("2026-10-29T09:00:00.000Z");
const eventIdentity = {
  auditEventId,
  outboxEventId,
  occurredAt: evaluatedAt.toISOString(),
};

type Role =
  "partner" | "planner" | "coordinator" | "helper" | "read_only_guest";

function membership(
  actor: string,
  role: Role,
  overrides: Record<string, unknown> = {},
) {
  return {
    actorId: actor,
    weddingId: weddingA,
    role,
    status: "active",
    accessExpiresAt: null,
    permissionOverrides: [],
    ...overrides,
  };
}

function mutableState(
  input: {
    actorRole?: Role;
    targetRole?: Role;
    targetStatus?: "active" | "revoked";
    lead?: boolean;
    coupleAllows?: boolean;
  } = {},
) {
  let version = "membership:1";
  let actorVersion = "actor:1";
  let target = membership(targetActorId, input.targetRole ?? "helper", {
    status: input.targetStatus ?? "active",
  });
  const loadWeddingPermissionChange = vi.fn(async () => ({
    actorIsAssignedLeadPlanner: input.lead ?? false,
    actorPermissionScopeVersion: actorVersion,
    coupleAllowsLeadPlannerAccessManagement: input.coupleAllows ?? false,
    actorMembership: membership(actorId, input.actorRole ?? "partner"),
    targetMembership: target,
    membershipId,
    targetPermissionScopeVersion: version,
  }));
  return {
    state: {
      loadWeddingPermissionChange,
    } satisfies WeddingPermissionChangeAuthorizationState,
    setVersion(next: string) {
      version = next;
    },
    setActorVersion(next: string) {
      actorVersion = next;
    },
    setTarget(next: ReturnType<typeof membership>) {
      target = next;
    },
  };
}

function command(
  mutation: Record<string, unknown> = { kind: "access_revoked" },
  weddingId = weddingA,
) {
  return {
    correlationId: "d04002c3-1f13-4da5-87a0-000000000001",
    membershipId,
    mutation,
    weddingId,
  };
}

describe("wedding access-management capability", () => {
  it("derives a revocation reduction and immutable audit facts from the consumed mutation result", async () => {
    const operation = await authorizeWeddingPermissionChange(
      { actorId },
      command(),
      mutableState().state,
      evaluatedAt,
    );
    expect(operation).toMatchObject({
      change: "access_revoked",
      effectiveAccess: "reduced",
      expectedPermissionScopeVersion: "membership:1",
      membershipId,
      weddingId: weddingA,
      membership: { status: "revoked" },
    });

    await consumeAuthorizedWeddingPermissionChange(operation, {
      database: true,
    });
    const capture = completeAuthorizedWeddingPermissionChange(
      operation,
      {
        membership: operation.membership,
        membershipId,
        weddingId: weddingA,
        previousPermissionScopeVersion: "membership:1",
        permissionScopeVersion: "membership:2",
      },
      eventIdentity,
    );

    expect(capture.audit).toMatchObject({
      subjectId: membershipId,
      metadata: {
        change: "access_revoked",
        effectiveAccess: "reduced",
        previousPermissionScopeVersion: "membership:1",
        permissionScopeVersion: "membership:2",
      },
    });
    expect(capture.invalidation.payload).toMatchObject({
      membershipId,
      permissionScopeVersion: "membership:2",
      scope: "wedding",
      scopeId: weddingA,
    });
    expect(Object.isFrozen(capture.audit.metadata)).toBe(true);
  });

  it.each(["coordinator", "helper", "read_only_guest"] as const)(
    "denies %s access management",
    async (actorRole) => {
      await expect(
        authorizeWeddingPermissionChange(
          { actorId },
          command(),
          mutableState({ actorRole }).state,
          evaluatedAt,
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
    },
  );

  it("allows only an assigned, couple-permitted lead planner to manage collaborator access", async () => {
    for (const input of [
      { lead: false, coupleAllows: true },
      { lead: true, coupleAllows: false },
    ]) {
      await expect(
        authorizeWeddingPermissionChange(
          { actorId },
          command(),
          mutableState({ actorRole: "planner", ...input }).state,
          evaluatedAt,
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
    }
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command(),
        mutableState({
          actorRole: "planner",
          lead: true,
          coupleAllows: true,
        }).state,
        evaluatedAt,
      ),
    ).resolves.toMatchObject({ change: "access_revoked" });
  });

  it("protects either partner from every unilateral membership change", async () => {
    for (const mutation of [
      { kind: "access_revoked" },
      { kind: "role_changed", role: "helper" },
      { kind: "permissions_changed", permissionOverrides: [] },
    ]) {
      await expect(
        authorizeWeddingPermissionChange(
          { actorId },
          command(mutation),
          mutableState({ targetRole: "partner" }).state,
          evaluatedAt,
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
    }
  });

  it("denies unrelated planners, cross-wedding targets and malformed private inputs without reflection", async () => {
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command(),
        mutableState({ actorRole: "planner" }).state,
        evaluatedAt,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command(undefined, weddingB),
        mutableState().state,
        evaluatedAt,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });

    const privateValue = "private-person@example.com";
    let caught: unknown;
    try {
      await authorizeWeddingPermissionChange(
        { actorId },
        { ...command(), email: privateValue },
        mutableState().state,
        evaluatedAt,
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(PermissionScopeChangeError);
    expect(String(caught)).not.toContain(privateValue);
  });

  it("computes effective direction from before/after state, including expiry notification semantics", async () => {
    const restore = await authorizeWeddingPermissionChange(
      { actorId },
      command({
        kind: "access_restored",
        accessExpiresAt: "2026-11-05T09:00:00.000Z",
      }),
      mutableState({ targetStatus: "revoked" }).state,
      evaluatedAt,
    );
    expect(restore.effectiveAccess).toBe("expanded");

    const expiry = await authorizeWeddingPermissionChange(
      { actorId },
      command({
        kind: "expiry_changed",
        accessExpiresAt: "2026-11-05T09:00:00.000Z",
      }),
      mutableState().state,
      evaluatedAt,
    );
    expect(expiry.effectiveAccess).toBe("unchanged");
  });

  it("rejects restoration with a past expiry, an unapproved role, or no effective access", async () => {
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command({
          kind: "access_restored",
          accessExpiresAt: "2026-10-28T09:00:00.000Z",
        }),
        mutableState({ targetStatus: "revoked" }).state,
        evaluatedAt,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command({
          kind: "access_restored",
          accessExpiresAt: "2026-11-05T09:00:00.000Z",
        }),
        mutableState({
          targetRole: "planner",
          targetStatus: "revoked",
        }).state,
        evaluatedAt,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
    const noAccess = mutableState({ targetStatus: "revoked" });
    noAccess.setTarget(
      membership(targetActorId, "helper", {
        status: "revoked",
        permissionOverrides: weddingPermissionAreas.map((area) => ({
          area,
          action: "view",
          effect: "deny",
        })),
      }),
    );
    await expect(
      authorizeWeddingPermissionChange(
        { actorId },
        command({
          kind: "access_restored",
          accessExpiresAt: "2026-11-05T09:00:00.000Z",
        }),
        noAccess.state,
        evaluatedAt,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
  });

  it("rejects stale, forged, mismatched and reused mutation results", async () => {
    const mutable = mutableState();
    const stale = await authorizeWeddingPermissionChange(
      { actorId },
      command(),
      mutable.state,
      evaluatedAt,
    );
    mutable.setVersion("membership:2");
    await expect(
      consumeAuthorizedWeddingPermissionChange(stale, { database: true }),
    ).rejects.toBeInstanceOf(PermissionScopeChangeError);

    const actorChanged = mutableState();
    const actorStale = await authorizeWeddingPermissionChange(
      { actorId },
      command(),
      actorChanged.state,
      evaluatedAt,
    );
    actorChanged.setActorVersion("actor:2");
    await expect(
      consumeAuthorizedWeddingPermissionChange(actorStale, {
        database: true,
      }),
    ).rejects.toBeInstanceOf(PermissionScopeChangeError);

    const fresh = await authorizeWeddingPermissionChange(
      { actorId },
      command(),
      mutableState().state,
      evaluatedAt,
    );
    expect(() =>
      completeAuthorizedWeddingPermissionChange(
        fresh,
        {
          membership: fresh.membership,
          membershipId,
          weddingId: weddingA,
          previousPermissionScopeVersion: "membership:1",
          permissionScopeVersion: "membership:2",
        },
        eventIdentity,
      ),
    ).toThrow(PermissionScopeChangeError);
    await consumeAuthorizedWeddingPermissionChange(fresh, {});
    expect(() =>
      completeAuthorizedWeddingPermissionChange(
        fresh,
        {
          membership: fresh.beforeMembership,
          membershipId,
          weddingId: weddingA,
          previousPermissionScopeVersion: "membership:1",
          permissionScopeVersion: "membership:2",
        },
        eventIdentity,
      ),
    ).toThrow(PermissionScopeChangeError);
  });
});
