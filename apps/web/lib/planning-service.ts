import type {
  CreatePlanningRecordRequest,
  UpdatePlanningRecordRequest,
} from "@vowora/contracts";
import {
  createPlanningRecord,
  DatabaseWeddingAuthorizationState,
  listPlanningWorkspace,
  PlanningUnavailableError,
  updatePlanningRecord,
} from "@vowora/database";

import { getRuntimeDatabase } from "./database";
import {
  authorizeApiOperation,
  type ApiAuthorizationResult,
} from "./server-authorization";

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

export function loadPlanningWorkspace(input: {
  actorId: string;
  weddingId: string;
}) {
  return listPlanningWorkspace(getRuntimeDatabase().database, input);
}

export function authorizePlanningCreate(
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
        resource: "new",
        area: "tasks",
        weddingId,
        action: "edit",
      },
    },
    new DatabaseWeddingAuthorizationState(database),
  );
}

export function authorizePlanningUpdate(
  auth: SessionReader,
  request: Request,
  weddingId: string,
  recordId: string,
): Promise<ApiAuthorizationResult> {
  const database = getRuntimeDatabase().database;
  return authorizeApiOperation(
    auth,
    request,
    {
      tenant: "wedding",
      operation: {
        resource: "existing",
        recordId,
        weddingId,
        action: "edit",
      },
    },
    new DatabaseWeddingAuthorizationState(database),
  );
}

export function addPlanningRecord(
  operation: Extract<ApiAuthorizationResult, { authorized: true }>["operation"],
  input: CreatePlanningRecordRequest,
) {
  return createPlanningRecord(getRuntimeDatabase().database, operation, input);
}

export function changePlanningRecord(
  operation: Extract<ApiAuthorizationResult, { authorized: true }>["operation"],
  recordId: string,
  input: UpdatePlanningRecordRequest,
) {
  return updatePlanningRecord(
    getRuntimeDatabase().database,
    operation,
    recordId,
    input,
  );
}

export function planningFailure(error: unknown) {
  return error instanceof PlanningUnavailableError ? error.reason : undefined;
}
