import type {
  AssignWeddingOrganizationStaffRequest,
  CreateOrganizationInvitationRequest,
  CreateOrganizationRequest,
  PermissionCeilingEntry,
} from "@vowora/contracts";
import {
  acceptOrganizationInvitation,
  createOrganization,
  DatabaseOrganizationAuthorizationState,
  deactivateOrganizationMember,
  issueOrganizationInvitation,
  listOrganizationInvitations,
  listOrganizationStaff,
  readOrganizationInvitationForActor,
  revokeOrganizationInvitation,
  OrganizationConflictError,
  OrganizationInvitationUnavailableError,
  assignOrganizationStaffToWedding,
  listOrganizationWeddingInvitations,
  listOrganizationWeddingAccesses,
  respondWeddingOrganizationInvitation,
  removeOrganizationStaffFromWedding,
} from "@vowora/database";
import {
  authorizeOrganizationCreation,
  authorizeOrganizationInvitationClaim,
  authorizeOrganizationServerOperation,
  OrganizationAuthorizationError,
} from "@vowora/domain";

import { getRuntimeDatabase } from "./database";

function permissionEntries(value: unknown): PermissionCeilingEntry[] {
  if (!Array.isArray(value)) return [];
  const grouped = new Map<string, Set<"view" | "edit" | "download_export">>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const grant = item as {
      area?: string;
      action?: string;
      effect?: string;
      scope?: string;
    };
    if (grant.effect !== "allow" || grant.scope !== "workspace") continue;
    if (
      grant.action !== "view" &&
      grant.action !== "edit" &&
      grant.action !== "download_export"
    )
      continue;
    const actions = grouped.get(grant.area ?? "") ?? new Set();
    actions.add(grant.action);
    grouped.set(grant.area ?? "", actions);
  }
  return [...grouped].map(([area, actions]) => ({
    area,
    actions: [...actions],
  })) as PermissionCeilingEntry[];
}

export function createPlannerOrganization(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly creationRequestId: string;
  readonly request: CreateOrganizationRequest;
}) {
  return createOrganization(
    getRuntimeDatabase().database,
    authorizeOrganizationCreation({
      actorId: input.actorId,
      correlationId: input.correlationId,
      creationRequestId: input.creationRequestId,
      name: input.request.name,
    }),
  );
}

async function authorizeManagement(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
}) {
  const database = getRuntimeDatabase().database;
  return authorizeOrganizationServerOperation(
    { actorId: input.actorId },
    {
      organizationId: input.organizationId,
      recordId: input.organizationId,
      action: "edit",
      correlationId: input.correlationId,
    },
    new DatabaseOrganizationAuthorizationState(database),
  );
}

export async function loadOrganizationStaff(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
}) {
  return listOrganizationStaff(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
  );
}

export async function loadOrganizationInvitations(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
}) {
  return listOrganizationInvitations(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
  );
}

export async function createOrganizationStaffInvitation(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
  readonly issuanceRequestId: string;
  readonly request: CreateOrganizationInvitationRequest;
}) {
  return issueOrganizationInvitation(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    { ...input.request, issuanceRequestId: input.issuanceRequestId },
  );
}

export async function revokePlannerOrganizationInvitation(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
  readonly invitationId: string;
}) {
  return revokeOrganizationInvitation(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    input.invitationId,
  );
}

export function loadOrganizationInvitationForActor(
  actorId: string,
  invitation: { readonly token: string } | { readonly invitationId: string },
) {
  return readOrganizationInvitationForActor(getRuntimeDatabase().database, {
    actorId,
    ...invitation,
  });
}

export function claimOrganizationInvitation(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly token?: string;
  readonly invitationId?: string;
}) {
  return acceptOrganizationInvitation(
    getRuntimeDatabase().database,
    authorizeOrganizationInvitationClaim(input),
  );
}

export async function deactivatePlannerOrganizationMember(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly organizationId: string;
  readonly membershipId: string;
}) {
  return deactivateOrganizationMember(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    input.membershipId,
  );
}

export function isOrganizationConflict(error: unknown) {
  return error instanceof OrganizationConflictError;
}
export function isOrganizationAuthorizationFailure(error: unknown) {
  return error instanceof OrganizationAuthorizationError;
}
export function isOrganizationInvitationUnavailable(error: unknown) {
  return error instanceof OrganizationInvitationUnavailableError;
}

export async function loadPlannerWeddingInvitations(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
}) {
  const rows = await listOrganizationWeddingInvitations(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
  );
  return rows.map(({ invitation, weddingName }) => ({
    invitation: {
      id: invitation.id,
      weddingId: invitation.weddingId,
      organizationId: invitation.organizationId,
      status: invitation.status,
      permissionCeiling: invitation.permissionCeiling,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    },
    weddingName,
  }));
}
export async function loadPlannerWeddingAccesses(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
}) {
  const accesses = await listOrganizationWeddingAccesses(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
  );
  return accesses.map((access) => ({
    id: access.id,
    weddingId: access.weddingId,
    weddingName: access.weddingName,
    status: access.status,
    permissionCeiling: access.permissionCeiling as PermissionCeilingEntry[],
    assignments: access.assignments.map((assignment) => ({
      id: assignment.id,
      organizationMembershipId: assignment.organizationMembershipId,
      role: assignment.role,
      status: assignment.status,
      isLead: assignment.isLead,
      permissions: permissionEntries(assignment.permissions),
      absenceStartsAt: assignment.absenceStartsAt?.toISOString() ?? null,
      absenceEndsAt: assignment.absenceEndsAt?.toISOString() ?? null,
    })),
  }));
}
export async function respondToPlannerWeddingInvitation(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  invitationId: string;
  decision: "accept" | "reject";
}) {
  const result = await respondWeddingOrganizationInvitation(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    input.invitationId,
    input.decision,
  );
  return {
    accepted: result.accepted,
    access: result.access
      ? {
          id: result.access.id,
          weddingId: result.access.weddingId,
          organizationId: result.access.organizationId,
          status: result.access.status,
          permissionCeiling: result.access.permissionCeiling,
          grantedAt: result.access.grantedAt.toISOString(),
        }
      : undefined,
  };
}
export async function assignPlannerWeddingStaff(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  accessId: string;
  request: AssignWeddingOrganizationStaffRequest;
}) {
  const assignment = await assignOrganizationStaffToWedding(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    {
      accessId: input.accessId,
      organizationMembershipId: input.request.organizationMembershipId,
      permissions: input.request.permissions,
      isLead: input.request.isLead,
    },
  );
  return {
    id: assignment.id,
    accessId: assignment.accessId,
    organizationMembershipId: assignment.organizationMembershipId,
    status: assignment.status,
    isLead: assignment.isLead,
    permissions: permissionEntries(assignment.permissionOverrides),
  };
}
export async function removePlannerWeddingStaff(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  accessId: string;
  assignmentId: string;
}) {
  return removeOrganizationStaffFromWedding(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    { accessId: input.accessId, assignmentId: input.assignmentId },
  );
}
