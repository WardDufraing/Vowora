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
import { readAuthEnvironment } from "./env";
import { decodePlanningCursor, encodePlanningCursor } from "./planning-cursor";
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

export async function loadPlanningWorkspace(input: {
  actorId: string;
  weddingId: string;
  taskCursor?: string;
  milestoneCursor?: string;
  limit?: number;
}) {
  const database = getRuntimeDatabase().database;
  const authorization = await new DatabaseWeddingAuthorizationState(
    database,
  ).loadWeddingMembership(input);
  if (!authorization) throw new PlanningUnavailableError("access_denied");
  const limit = input.limit ?? 50;
  const secret = readAuthEnvironment().AUTH_SECRET;
  const binding = {
    actorId: input.actorId,
    weddingId: input.weddingId,
    permissionScopeVersion: authorization.permissionScopeVersion,
    limit,
  };
  const result = await listPlanningWorkspace(database, {
    actorId: input.actorId,
    weddingId: input.weddingId,
    limit,
    expectedPermissionScopeVersion: authorization.permissionScopeVersion,
    taskCursor: input.taskCursor
      ? decodePlanningCursor(secret, input.taskCursor, {
          ...binding,
          kind: "task",
        })
      : undefined,
    milestoneCursor: input.milestoneCursor
      ? decodePlanningCursor(secret, input.milestoneCursor, {
          ...binding,
          kind: "milestone",
        })
      : undefined,
  });
  return {
    ...result,
    page: {
      nextTaskCursor: result.page.nextTaskCursor
        ? encodePlanningCursor(secret, {
            ...binding,
            kind: "task",
            afterId: result.page.nextTaskCursor,
          })
        : null,
      nextMilestoneCursor: result.page.nextMilestoneCursor
        ? encodePlanningCursor(secret, {
            ...binding,
            kind: "milestone",
            afterId: result.page.nextMilestoneCursor,
          })
        : null,
    },
  };
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
