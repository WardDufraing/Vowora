import { describe, expect, it, vi } from "vitest";

import {
  assertAuthorizedServerOperation,
  assertAuthorizationContext,
  authorizeIndependentPlannerServerOperation,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
  type ServerAuthorizationState,
} from "./index.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const otherActorId = "019a1f5e-70a0-7000-8000-000000000002";
const weddingId = "019a1f5e-70a0-7000-8000-000000000003";
const otherWeddingId = "019a1f5e-70a0-7000-8000-000000000004";
const organizationId = "019a1f5e-70a0-7000-8000-000000000005";
const otherOrganizationId = "019a1f5e-70a0-7000-8000-000000000006";
const recordId = "019a1f5e-70a0-7000-8000-000000000007";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function weddingMembership(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    actorId,
    weddingId,
    role: "partner",
    status: "active",
    accessExpiresAt: null,
    permissionOverrides: [],
    ...overrides,
  };
}

function organizationMembership(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    actorId,
    organizationId,
    status: "active",
    permissionOverrides: [
      {
        area: "notes",
        action: "view",
        effect: "allow",
        scope: "workspace",
      },
    ],
    ...overrides,
  };
}

function state(
  overrides: Partial<ServerAuthorizationState> = {},
): ServerAuthorizationState {
  return {
    loadWeddingMembership: vi.fn(async () => ({
      membership: weddingMembership(),
      permissionScopeVersion: "wedding:4",
    })),
    loadWeddingRecord: vi.fn(
      async () =>
        ({
          weddingId,
          area: "tasks",
          relationship: "workspace",
          visibility: "wedding_shared",
        }) as const,
    ),
    loadOrganizationMembership: vi.fn(async () => ({
      membership: organizationMembership(),
      permissionScopeVersion: "organization:7",
    })),
    loadOrganizationRecord: vi.fn(
      async () =>
        ({
          organizationId,
          area: "notes",
          relationship: "workspace",
          visibility: "organization_private",
        }) as const,
    ),
    loadIndependentPlannerIdentity: vi.fn(async () => ({
      membership: { actorId, status: "active" },
      permissionScopeVersion: "private-owner:2",
    })),
    loadIndependentPlannerRecord: vi.fn(async () => ({
      area: "notes" as const,
      ownerActorId: actorId,
      relationship: "workspace" as const,
      visibility: "independent_planner_private" as const,
    })),
    ...overrides,
  };
}

describe("server authorization", () => {
  it("derives actor, record policy and context only from server-owned state", async () => {
    const authorizationState = state();
    const operation = await authorizeWeddingServerOperation(
      { actorId },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
      },
      authorizationState,
    );

    expect(authorizationState.loadWeddingMembership).toHaveBeenCalledWith({
      actorId,
      weddingId,
    });
    expect(authorizationState.loadWeddingRecord).toHaveBeenCalledWith({
      actorId,
      recordId,
    });
    expect(operation).toMatchObject({
      area: "tasks",
      action: "view",
      resourceId: recordId,
      visibility: "wedding_shared",
      authorization: {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "wedding:4",
        correlationId,
      },
    });
    expect(() =>
      assertAuthorizationContext(operation.authorization),
    ).not.toThrow();
    expect(() => assertAuthorizedServerOperation(operation)).not.toThrow();
    expect(() => assertAuthorizedServerOperation({ ...operation })).toThrow(
      ServerAuthorizationError,
    );
  });

  it("rejects forged actor, relationship, visibility and grants before loading state", async () => {
    const authorizationState = state();
    for (const input of [
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
        actorId: otherActorId,
      },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
        relationship: "workspace",
      },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
        visibility: "wedding_shared",
      },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
        permissionScopeVersion: "forged:admin",
      },
    ]) {
      await expect(
        authorizeWeddingServerOperation({ actorId }, input, authorizationState),
      ).rejects.toMatchObject({ failure: "access_denied" });
    }
    expect(authorizationState.loadWeddingMembership).not.toHaveBeenCalled();
    expect(authorizationState.loadWeddingRecord).not.toHaveBeenCalled();

    await expect(
      authorizeWeddingServerOperation(
        { actorId: "untrusted-session-value" },
        {
          action: "view",
          correlationId,
          recordId,
          resource: "existing",
          weddingId,
        },
        authorizationState,
      ),
    ).rejects.toMatchObject({ failure: "authentication_required" });
  });

  it("denies cross-wedding records and inactive membership without minting context", async () => {
    await expect(
      authorizeWeddingServerOperation(
        { actorId },
        {
          action: "view",
          correlationId,
          recordId,
          resource: "existing",
          weddingId,
        },
        state({
          loadWeddingRecord: async () => ({
            weddingId: otherWeddingId,
            area: "tasks",
            relationship: "workspace",
            visibility: "wedding_shared",
          }),
        }),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });

    for (const membership of [
      weddingMembership({ status: "revoked" }),
      weddingMembership({
        role: "helper",
        accessExpiresAt: "2026-10-28T10:00:00.000Z",
      }),
    ]) {
      await expect(
        authorizeWeddingServerOperation(
          { actorId },
          {
            action: "view",
            correlationId,
            recordId,
            resource: "existing",
            weddingId,
          },
          state({
            loadWeddingMembership: async () => ({
              membership,
              permissionScopeVersion: "wedding:5",
            }),
          }),
          new Date("2026-10-28T10:00:00.000Z"),
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
    }
  });

  it("uses authoritative assignment and sharing for collaborator scope", async () => {
    const helperState = (relationship: "assigned" | "workspace") =>
      state({
        loadWeddingMembership: async () => ({
          membership: weddingMembership({ role: "helper" }),
          permissionScopeVersion: "wedding:6",
        }),
        loadWeddingRecord: async () => ({
          weddingId,
          area: "tasks",
          relationship,
          visibility: "wedding_shared",
        }),
      });

    await expect(
      authorizeWeddingServerOperation(
        { actorId },
        {
          action: "view",
          correlationId,
          recordId,
          resource: "existing",
          weddingId,
        },
        helperState("assigned"),
      ),
    ).resolves.toMatchObject({ area: "tasks", action: "view" });
    await expect(
      authorizeWeddingServerOperation(
        { actorId },
        {
          action: "view",
          correlationId,
          recordId,
          resource: "existing",
          weddingId,
        },
        helperState("workspace"),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
  });

  it("authorizes record creation only through an authoritative active grant", async () => {
    await expect(
      authorizeWeddingServerOperation(
        { actorId },
        {
          action: "edit",
          area: "budget",
          correlationId,
          resource: "new",
          weddingId,
        },
        state(),
      ),
    ).resolves.toMatchObject({
      area: "budget",
      action: "edit",
      visibility: "wedding_shared",
    });

    await expect(
      authorizeWeddingServerOperation(
        { actorId },
        {
          action: "edit",
          area: "budget",
          correlationId,
          resource: "new",
          weddingId,
        },
        state({
          loadWeddingMembership: async () => ({
            membership: weddingMembership({ role: "helper" }),
            permissionScopeVersion: "wedding:8",
          }),
        }),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
  });

  it("keeps organization-private authorization separate from wedding access", async () => {
    const operation = await authorizeOrganizationServerOperation(
      { actorId },
      {
        action: "view",
        correlationId,
        organizationId,
        recordId,
      },
      state(),
    );
    expect(operation).toMatchObject({
      area: "notes",
      visibility: "organization_private",
      authorization: {
        actorId,
        activeOrganizationId: organizationId,
        permissionScopeVersion: "organization:7",
      },
    });
    expect(operation.authorization).not.toHaveProperty("activeWeddingId");

    await expect(
      authorizeOrganizationServerOperation(
        { actorId },
        {
          action: "view",
          correlationId,
          organizationId,
          recordId,
        },
        state({
          loadOrganizationRecord: async () => ({
            organizationId: otherOrganizationId,
            area: "notes",
            relationship: "workspace",
            visibility: "organization_private",
          }),
        }),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });

    await expect(
      authorizeOrganizationServerOperation(
        { actorId },
        {
          action: "view",
          correlationId,
          organizationId,
          recordId,
        },
        state({ loadOrganizationMembership: async () => undefined }),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
  });

  it("binds independent-planner private records to exact authenticated ownership", async () => {
    const operation = await authorizeIndependentPlannerServerOperation(
      { actorId },
      { action: "view", correlationId, recordId },
      state(),
    );
    expect(operation).toMatchObject({
      area: "notes",
      visibility: "independent_planner_private",
      authorization: {
        actorId,
        activePrivateOwnerActorId: actorId,
        permissionScopeVersion: "private-owner:2",
      },
    });

    await expect(
      authorizeIndependentPlannerServerOperation(
        { actorId },
        { action: "view", correlationId, recordId },
        state({
          loadIndependentPlannerRecord: async () => ({
            area: "notes",
            ownerActorId: otherActorId,
            relationship: "workspace",
            visibility: "independent_planner_private",
          }),
        }),
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
  });

  it("fails closed and hides malformed authoritative state and loader errors", async () => {
    for (const authorizationState of [
      state({
        loadWeddingMembership: async () => ({
          membership: weddingMembership(),
          permissionScopeVersion: "contains spaces",
        }),
      }),
      state({
        loadWeddingRecord: async () => ({
          weddingId,
          area: "tasks",
          relationship: "new_record" as "assigned",
          visibility: "wedding_shared",
        }),
      }),
      state({
        loadWeddingMembership: async () => {
          throw new Error("private database detail");
        },
      }),
    ]) {
      let caught: unknown;
      try {
        await authorizeWeddingServerOperation(
          { actorId },
          {
            action: "view",
            correlationId,
            recordId,
            resource: "existing",
            weddingId,
          },
          authorizationState,
        );
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchObject({ failure: "authorization_unavailable" });
      expect(String(caught)).not.toContain("private database detail");
    }
  });
});
