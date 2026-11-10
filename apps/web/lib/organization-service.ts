import type {
  CreateOrganizationInvitationRequest,
  CreateOrganizationRequest,
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
} from "@vowora/database";
import {
  authorizeOrganizationCreation,
  authorizeOrganizationInvitationClaim,
  authorizeOrganizationServerOperation,
  OrganizationAuthorizationError,
} from "@vowora/domain";

import { getRuntimeDatabase } from "./database";

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
  readonly request: CreateOrganizationInvitationRequest;
}) {
  return issueOrganizationInvitation(
    getRuntimeDatabase().database,
    await authorizeManagement(input),
    input.request,
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
