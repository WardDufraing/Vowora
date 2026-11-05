import type {
  CreateWeddingRequest,
  UpdateWeddingSettingsRequest,
} from "@vowora/contracts";
import {
  createCoupleWedding,
  DatabaseWeddingAuthorizationState,
  readWeddingSettings,
  updateWeddingSettings,
  WeddingCreationConflictError,
  WeddingSettingsConflictError,
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
  return readWeddingSettings(database, operation);
}
