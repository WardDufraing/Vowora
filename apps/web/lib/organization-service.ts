import type {
  AssignWeddingOrganizationStaffRequest,
  CreateOrganizationInvitationRequest,
  CreateOrganizationPrivateNoteRequest,
  CreateOrganizationRequest,
  OrganizationWeddingExitRequest,
  PermissionCeilingEntry,
  UpdateOrganizationPrivateNoteRequest,
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
  listCurrentLeadWeddingAccesses,
  respondWeddingOrganizationInvitation,
  removeOrganizationStaffFromWedding,
  transferCurrentLeadPlanner,
  completeOrganizationWeddingExit,
  createOrganizationPrivateNote,
  listOrganizationPrivateNotes,
  PlannerPrivateUnavailableError,
  previewOrganizationWeddingExit,
  updateOrganizationPrivateNote,
} from "@vowora/database";
import {
  authorizeOrganizationCreation,
  authorizeOrganizationInvitationClaim,
  authorizeOrganizationLeadTransfer,
  authorizeOrganizationHandover,
  authorizeOrganizationPrivateNote,
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

export async function loadCurrentLeadWeddingContext(input: {
  actorId: string;
  organizationId: string;
}) {
  const context = await listCurrentLeadWeddingAccesses(
    getRuntimeDatabase().database,
    input,
  );
  if (context.accesses.length === 0) throw new Error("access unavailable");
  return {
    accesses: context.accesses.map((access) => ({
      id: access.id,
      weddingId: access.weddingId,
      weddingName: access.weddingName,
      assignments: access.assignments.map((assignment) => ({
        id: assignment.id,
        organizationMembershipId: assignment.organizationMembershipId,
        isLead: assignment.isLead,
        ...(assignment.absenceStartsAt !== undefined
          ? {
              absenceStartsAt:
                assignment.absenceStartsAt?.toISOString() ?? null,
              absenceEndsAt: assignment.absenceEndsAt?.toISOString() ?? null,
            }
          : {}),
      })),
    })),
    staff: context.staff,
    currentMembershipId: context.accesses[0]!.currentMembershipId,
  };
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
  let managementOperation;
  try {
    managementOperation = await authorizeManagement(input);
  } catch (error) {
    if (!input.request.isLead) throw error;
    const assignment = await transferCurrentLeadPlanner(
      getRuntimeDatabase().database,
      authorizeOrganizationLeadTransfer({
        actorId: input.actorId,
        correlationId: input.correlationId,
        organizationId: input.organizationId,
        accessId: input.accessId,
        targetOrganizationMembershipId: input.request.organizationMembershipId,
      }),
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
  const assignment = await assignOrganizationStaffToWedding(
    getRuntimeDatabase().database,
    managementOperation,
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

export function loadOrganizationPrivateNotes(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
}) {
  return listOrganizationPrivateNotes(
    getRuntimeDatabase().database,
    authorizeOrganizationPrivateNote({ ...input, action: "list" }),
  );
}

export function addOrganizationPrivateNote(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  request: CreateOrganizationPrivateNoteRequest;
}) {
  return createOrganizationPrivateNote(
    getRuntimeDatabase().database,
    authorizeOrganizationPrivateNote({
      actorId: input.actorId,
      correlationId: input.correlationId,
      organizationId: input.organizationId,
      action: "create",
    }),
    input.request,
  );
}

export function changeOrganizationPrivateNote(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  noteId: string;
  request: UpdateOrganizationPrivateNoteRequest;
}) {
  return updateOrganizationPrivateNote(
    getRuntimeDatabase().database,
    authorizeOrganizationPrivateNote({
      actorId: input.actorId,
      correlationId: input.correlationId,
      organizationId: input.organizationId,
      action: input.request.archive ? "archive" : "update",
      noteId: input.noteId,
    }),
    { noteId: input.noteId, ...input.request },
  );
}

function handoverCapability(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  accessId: string;
  request: OrganizationWeddingExitRequest;
}) {
  return authorizeOrganizationHandover({
    actorId: input.actorId,
    correlationId: input.correlationId,
    organizationId: input.organizationId,
    accessId: input.accessId,
    mode: input.request.mode,
    requestId: input.request.requestId,
  });
}

export function loadOrganizationWeddingExitPreview(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  accessId: string;
  request: OrganizationWeddingExitRequest;
}) {
  return previewOrganizationWeddingExit(
    getRuntimeDatabase().database,
    handoverCapability(input),
  );
}

export function finishOrganizationWeddingExit(input: {
  actorId: string;
  correlationId: string;
  organizationId: string;
  accessId: string;
  request: OrganizationWeddingExitRequest;
}) {
  return completeOrganizationWeddingExit(
    getRuntimeDatabase().database,
    handoverCapability(input),
  );
}

export function isPlannerPrivateUnavailable(
  error: unknown,
): error is PlannerPrivateUnavailableError {
  return error instanceof PlannerPrivateUnavailableError;
}
