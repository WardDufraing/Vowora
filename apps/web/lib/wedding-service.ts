import type {
  CreateWeddingOrganizationInvitationRequest,
  CreateWeddingRequest,
  PermissionCeilingEntry,
  UpdateWeddingSettingsRequest,
} from "@vowora/contracts";
import {
  acceptPartnerInvitation,
  createCoupleWedding,
  DatabaseWeddingAuthorizationState,
  issuePartnerInvitation,
  listPartnerInvitations,
  listAccessibleWeddingWorkspaces,
  readWeddingWorkspaceEntryState,
  readWeddingSettings,
  readPartnerInvitationForActor,
  revokePartnerInvitation,
  updateWeddingSettings,
  WeddingCreationConflictError,
  WeddingInvitationConflictError,
  WeddingInvitationUnavailableError,
  WeddingSettingsConflictError,
  issueWeddingOrganizationInvitation,
  listWeddingOrganizationInvitations,
  revokeWeddingOrganizationInvitation,
  revokeWeddingOrganizationAccess,
  setPlannerStaffRestriction,
  getWeddingOrganizationAccessManagement,
  setLeadPlannerAbsence,
} from "@vowora/database";
import {
  authorizeCoupleWeddingCreation,
  authorizeWeddingServerOperation,
  WeddingCreationAuthorizationError,
  type AuthorizedServerOperation,
} from "@vowora/domain";

import {
  authorizeApiOperation,
  type ApiAuthorizationResult,
} from "./server-authorization";
import { getRuntimeDatabase } from "./database";

function publicPermissionCeiling(value: unknown): PermissionCeilingEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { area?: unknown; actions?: unknown };
    if (typeof candidate.area !== "string" || !Array.isArray(candidate.actions))
      return [];
    const actions = candidate.actions.filter(
      (action): action is "view" | "edit" | "download_export" =>
        action === "view" || action === "edit" || action === "download_export",
    );
    return actions.length
      ? [{ area: candidate.area, actions } as PermissionCeilingEntry]
      : [];
  });
}

interface SessionReader {
  readonly api: {
    getSession(input: {
      readonly headers: Headers;
      readonly query: {
        readonly disableCookieCache: true;
        readonly disableRefresh: true;
      };
    }): Promise<{ readonly user: { readonly id: string } } | null>;
  };
}

export function createWeddingWorkspace(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly creationRequestId: string;
  readonly request: CreateWeddingRequest;
}) {
  const command = authorizeCoupleWeddingCreation({
    actorId: input.actorId,
    correlationId: input.correlationId,
    creationRequestId: input.creationRequestId,
    ...input.request,
  });
  return createCoupleWedding(getRuntimeDatabase().database, command);
}

export function isWeddingCreationConflict(error: unknown): boolean {
  return error instanceof WeddingCreationConflictError;
}

export function isWeddingCreationAuthorizationFailure(error: unknown): boolean {
  return error instanceof WeddingCreationAuthorizationError;
}

export function isWeddingSettingsConflict(error: unknown): boolean {
  return error instanceof WeddingSettingsConflictError;
}

export function authorizeWeddingSettingsApiOperation(
  auth: SessionReader,
  request: Request,
  weddingId: string,
): Promise<ApiAuthorizationResult> {
  const database = getRuntimeDatabase().database;
  return authorizeApiOperation(
    auth,
    request,
    {
      tenant: "wedding",
      operation: {
        resource: "existing",
        recordId: weddingId,
        weddingId,
        action: "edit",
      },
    },
    new DatabaseWeddingAuthorizationState(database),
  );
}

export function updateWeddingWorkspace(
  operation: AuthorizedServerOperation,
  request: UpdateWeddingSettingsRequest,
) {
  return updateWeddingSettings(
    getRuntimeDatabase().database,
    operation,
    request,
  );
}

export async function createPartnerInvitation(input: {
  readonly auth: SessionReader;
  readonly email: string;
  readonly locale: "en" | "nl" | "fr" | "de";
  readonly request: Request;
  readonly weddingId: string;
}) {
  const authorized = await authorizeWeddingSettingsApiOperation(
    input.auth,
    input.request,
    input.weddingId,
  );
  if (!authorized.authorized) return authorized;
  let result;
  try {
    result = await issuePartnerInvitation(
      getRuntimeDatabase().database,
      authorized.operation,
      { email: input.email, locale: input.locale },
    );
  } catch (error) {
    throw new PartnerInvitationRequestError(
      authorized.operation.authorization.correlationId,
      error,
    );
  }
  return Object.freeze({
    authorized: true as const,
    correlationId: authorized.operation.authorization.correlationId,
    result,
  });
}

export class PartnerInvitationRequestError extends Error {
  constructor(
    readonly correlationId: string,
    readonly cause: unknown,
  ) {
    super("The partner invitation request failed");
    this.name = "PartnerInvitationRequestError";
  }
}

export function claimPartnerInvitation(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly token: string;
}) {
  return acceptPartnerInvitation(getRuntimeDatabase().database, input);
}

export function claimPartnerInvitationByEmail(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly invitationId: string;
}) {
  return acceptPartnerInvitation(getRuntimeDatabase().database, input);
}

export function loadPartnerInvitations(operation: AuthorizedServerOperation) {
  return listPartnerInvitations(getRuntimeDatabase().database, operation);
}

export function loadPartnerInvitationForActor(
  input: { readonly actorId: string } & (
    { readonly token: string } | { readonly invitationId: string }
  ),
) {
  return readPartnerInvitationForActor(getRuntimeDatabase().database, input);
}

export function revokeWeddingPartnerInvitation(
  operation: AuthorizedServerOperation,
  invitationId: string,
) {
  return revokePartnerInvitation(
    getRuntimeDatabase().database,
    operation,
    invitationId,
  );
}

export function isWeddingInvitationConflict(error: unknown): boolean {
  const cause =
    error instanceof PartnerInvitationRequestError ? error.cause : error;
  return cause instanceof WeddingInvitationConflictError;
}

export function partnerInvitationCorrelationId(error: unknown) {
  return error instanceof PartnerInvitationRequestError
    ? error.correlationId
    : undefined;
}

export function weddingInvitationUnavailableReason(error: unknown) {
  return error instanceof WeddingInvitationUnavailableError
    ? error.reason
    : undefined;
}

export async function loadWeddingSettingsForActor(input: {
  readonly actorId: string;
  readonly correlationId: string;
  readonly weddingId: string;
}) {
  const database = getRuntimeDatabase().database;
  const operation = await authorizeWeddingServerOperation(
    { actorId: input.actorId },
    {
      resource: "existing",
      recordId: input.weddingId,
      weddingId: input.weddingId,
      action: "view",
      correlationId: input.correlationId,
    },
    new DatabaseWeddingAuthorizationState(database),
  );
  const settings = await readWeddingSettings(database, operation);
  if (!settings) return undefined;
  const workspaces = await listAccessibleWeddingWorkspaces(database, {
    actorId: input.actorId,
    openedWeddingId: input.weddingId,
  });
  return Object.freeze({ ...settings, workspaces });
}

export function loadWeddingWorkspaceEntryForActor(input: {
  readonly actorId: string;
}) {
  return readWeddingWorkspaceEntryState(getRuntimeDatabase().database, input);
}

export async function createPlannerOrganizationInvitation(input: {
  auth: SessionReader;
  request: Request;
  weddingId: string;
  issuanceRequestId: string;
  body: CreateWeddingOrganizationInvitationRequest;
}) {
  const authorized = await authorizeWeddingSettingsApiOperation(
    input.auth,
    input.request,
    input.weddingId,
  );
  if (!authorized.authorized) return authorized;
  const issued = await issueWeddingOrganizationInvitation(
    getRuntimeDatabase().database,
    authorized.operation,
    {
      organizationId: input.body.organizationId,
      ceiling: input.body.permissionCeiling,
      requestId: input.issuanceRequestId,
      reissueInvitationId: input.body.reissueInvitationId,
    },
  );
  return {
    authorized: true as const,
    correlationId: authorized.operation.authorization.correlationId,
    result: {
      invitation: {
        id: issued.invitation.id,
        weddingId: issued.invitation.weddingId,
        organizationId: issued.invitation.organizationId,
        status: issued.invitation.status,
        permissionCeiling: publicPermissionCeiling(
          issued.invitation.permissionCeiling,
        ),
        expiresAt: issued.invitation.expiresAt.toISOString(),
        createdAt: issued.invitation.createdAt.toISOString(),
      },
      organizationName: issued.organizationName,
      replayed: issued.replayed,
    },
  };
}
export async function loadPlannerOrganizationInvitations(
  operation: AuthorizedServerOperation,
) {
  const rows = await listWeddingOrganizationInvitations(
    getRuntimeDatabase().database,
    operation,
  );
  return rows.map(({ invitation, organizationName }) => ({
    invitation: {
      id: invitation.id,
      weddingId: invitation.weddingId,
      organizationId: invitation.organizationId,
      status: invitation.status,
      permissionCeiling: publicPermissionCeiling(invitation.permissionCeiling),
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    },
    organizationName,
  }));
}
export async function loadPlannerOrganizationInvitationsForActor(input: {
  actorId: string;
  correlationId: string;
  weddingId: string;
}) {
  const database = getRuntimeDatabase().database;
  const operation = await authorizeWeddingServerOperation(
    { actorId: input.actorId },
    {
      resource: "existing",
      recordId: input.weddingId,
      weddingId: input.weddingId,
      action: "edit",
      correlationId: input.correlationId,
    },
    new DatabaseWeddingAuthorizationState(database),
  );
  return loadPlannerOrganizationInvitations(operation);
}
export async function loadPlannerOrganizationAccess(
  operation: AuthorizedServerOperation,
) {
  const access = await getWeddingOrganizationAccessManagement(
    getRuntimeDatabase().database,
    operation,
  );
  if (!access) return null;
  return {
    id: access.id,
    organizationId: access.organizationId,
    organizationName: access.organizationName,
    permissionCeiling: publicPermissionCeiling(access.permissionCeiling),
    assignments: access.assignments.map((assignment) => ({
      id: assignment.id,
      organizationMembershipId: assignment.organizationMembershipId,
      name: assignment.name,
      role: assignment.role,
      isLead: assignment.isLead,
      active: assignment.assignmentStatus === "active",
      blocked: assignment.restrictionStatus === "blocked",
    })),
  };
}
export async function loadPlannerOrganizationAccessForActor(input: {
  actorId: string;
  correlationId: string;
  weddingId: string;
}) {
  const database = getRuntimeDatabase().database;
  const operation = await authorizeWeddingServerOperation(
    { actorId: input.actorId },
    {
      resource: "existing",
      recordId: input.weddingId,
      weddingId: input.weddingId,
      action: "edit",
      correlationId: input.correlationId,
    },
    new DatabaseWeddingAuthorizationState(database),
  );
  return loadPlannerOrganizationAccess(operation);
}
export function revokePlannerOrganizationInvitation(
  operation: AuthorizedServerOperation,
  invitationId: string,
) {
  return revokeWeddingOrganizationInvitation(
    getRuntimeDatabase().database,
    operation,
    invitationId,
  );
}
export function revokePlannerOrganizationRelationship(
  operation: AuthorizedServerOperation,
  accessId: string,
) {
  return revokeWeddingOrganizationAccess(
    getRuntimeDatabase().database,
    operation,
    accessId,
  );
}
export function changePlannerStaffRestriction(
  operation: AuthorizedServerOperation,
  input: {
    accessId: string;
    organizationMembershipId: string;
    blocked: boolean;
  },
) {
  return setPlannerStaffRestriction(
    getRuntimeDatabase().database,
    operation,
    input,
  );
}
export async function authorizeLeadAbsenceApiOperation(
  auth: SessionReader,
  request: Request,
  weddingId: string,
) {
  return authorizeApiOperation(
    auth,
    request,
    {
      tenant: "wedding",
      operation: { resource: "new", area: "tasks", weddingId, action: "edit" },
    },
    new DatabaseWeddingAuthorizationState(getRuntimeDatabase().database),
  );
}
export function changeLeadPlannerAbsence(
  operation: AuthorizedServerOperation,
  input: { accessId: string; startsAt: Date | null; endsAt: Date | null },
) {
  return setLeadPlannerAbsence(getRuntimeDatabase().database, operation, input);
}

/**
 * Loads the exact actor's accessible shell projection and records personal
 * recency for an opened wedding. The navigation resolver still validates the
 * active exact membership before presenting links.
 */
export async function loadWeddingShellForActor(input: {
  readonly actorId: string;
  readonly weddingId: string;
}) {
  const workspaces = await listAccessibleWeddingWorkspaces(
    getRuntimeDatabase().database,
    { actorId: input.actorId, openedWeddingId: input.weddingId },
  );
  const current = workspaces.find(
    (workspace) => workspace.weddingId === input.weddingId,
  );
  return current ? Object.freeze({ current, workspaces }) : undefined;
}
