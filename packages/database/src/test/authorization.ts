import { randomUUID } from "node:crypto";

import {
  authorizeIndependentPlannerServerOperation,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
  type AuthorizationContext,
  type ServerAuthorizationState,
} from "@vowora/domain";

const syntheticRecordId = "019a1f5e-70a0-7000-8000-000000999999";

function emptyState(): ServerAuthorizationState {
  return {
    loadWeddingMembership: async () => undefined,
    loadWeddingRecord: async () => undefined,
    loadOrganizationMembership: async () => undefined,
    loadOrganizationRecord: async () => undefined,
    loadIndependentPlannerIdentity: async () => undefined,
    loadIndependentPlannerRecord: async () => undefined,
  };
}

/** Package-private test fixture. It is deliberately absent from package
 * exports so application code cannot issue a bare authorization context. */
export async function syntheticWeddingAuthorization(
  actorId: string,
  weddingId: string,
): Promise<AuthorizationContext> {
  return (await syntheticWeddingOperation(actorId, weddingId)).authorization;
}

export async function syntheticWeddingOperation(
  actorId: string,
  weddingId: string,
) {
  const state = emptyState();
  state.loadWeddingMembership = async () => ({
    membership: {
      actorId,
      weddingId,
      role: "partner",
      status: "active",
      accessExpiresAt: null,
      permissionOverrides: [],
    },
    permissionScopeVersion: "synthetic:1",
  });
  return authorizeWeddingServerOperation(
    { actorId },
    {
      action: "edit",
      area: "tasks",
      correlationId: randomUUID(),
      resource: "new",
      weddingId,
    },
    state,
  );
}

export async function syntheticOrganizationAuthorization(
  actorId: string,
  organizationId: string,
): Promise<AuthorizationContext> {
  return (await syntheticOrganizationOperation(actorId, organizationId))
    .authorization;
}

export async function syntheticOrganizationOperation(
  actorId: string,
  organizationId: string,
) {
  const state = emptyState();
  state.loadOrganizationMembership = async () => ({
    membership: {
      actorId,
      organizationId,
      status: "active",
      permissionOverrides: [
        {
          action: "view",
          area: "notes",
          effect: "allow",
          scope: "workspace",
        },
      ],
    },
    permissionScopeVersion: "synthetic:1",
  });
  state.loadOrganizationRecord = async () => ({
    area: "notes",
    organizationId,
    relationship: "workspace",
    visibility: "organization_private",
  });
  return authorizeOrganizationServerOperation(
    { actorId },
    {
      action: "view",
      correlationId: randomUUID(),
      organizationId,
      recordId: syntheticRecordId,
    },
    state,
  );
}

export async function syntheticPrivateOwnerAuthorization(
  actorId: string,
): Promise<AuthorizationContext> {
  const state = emptyState();
  state.loadIndependentPlannerIdentity = async () => ({
    membership: { actorId, status: "active" },
    permissionScopeVersion: "synthetic:1",
  });
  state.loadIndependentPlannerRecord = async () => ({
    area: "notes",
    ownerActorId: actorId,
    relationship: "workspace",
    visibility: "independent_planner_private",
  });
  return (
    await authorizeIndependentPlannerServerOperation(
      { actorId },
      {
        action: "view",
        correlationId: randomUUID(),
        recordId: syntheticRecordId,
      },
      state,
    )
  ).authorization;
}
