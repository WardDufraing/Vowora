import { and, eq, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import {
  assertAuthorizedOperationRequirement,
  assertAuthorizedServerOperation,
  assertAuthorizationContext,
  consumeAuthorizedServerOperation,
  type AuthorizedOperationRequirement,
  type AuthorizedServerOperation,
  type AuthorizationContext,
} from "@vowora/domain";

export interface TenantScopeColumns {
  readonly weddingId?: AnyPgColumn;
  readonly organizationId?: AnyPgColumn;
  readonly privateOwnerActorId?: AnyPgColumn;
}

export interface TenantScopeValues {
  readonly weddingId?: string | null;
  readonly organizationId?: string | null;
  readonly privateOwnerActorId?: string | null;
}

export class TenantScopeViolationError extends Error {
  constructor() {
    super("The operation is outside the validated tenant scope");
    this.name = "TenantScopeViolationError";
  }
}

const scopeDimensions = [
  ["activeWeddingId", "weddingId"],
  ["activeOrganizationId", "organizationId"],
  ["activePrivateOwnerActorId", "privateOwnerActorId"],
] as const;

function scopeEntries<T>(values: {
  readonly weddingId?: T;
  readonly organizationId?: T;
  readonly privateOwnerActorId?: T;
}) {
  return [
    ["activeWeddingId", "weddingId", values.weddingId],
    ["activeOrganizationId", "organizationId", values.organizationId],
    [
      "activePrivateOwnerActorId",
      "privateOwnerActorId",
      values.privateOwnerActorId,
    ],
  ] as const;
}

/** Produces the mandatory tenant predicate for a repository's declared scope
 * columns. Missing active scope denies the query rather than broadening it. */
export function tenantScopePredicate(
  authorization: AuthorizationContext,
  columns: TenantScopeColumns,
): SQL {
  assertAuthorizationContext(authorization);
  const predicates: SQL[] = [];
  for (const [contextKey, , column] of scopeEntries(columns)) {
    if (column === undefined) continue;
    const activeId = authorization[contextKey];
    if (activeId === undefined) return sql`false`;
    predicates.push(eq(column, activeId));
  }
  if (predicates.length === 0) throw new TenantScopeViolationError();
  return and(...predicates) ?? sql`false`;
}

/** Rejects tenant IDs supplied by write inputs unless every declared ID
 * exactly matches the already validated active context. */
export function assertTenantWriteScope(
  authorization: AuthorizationContext,
  values: TenantScopeValues,
  requiredColumns: TenantScopeColumns,
): void {
  assertAuthorizationContext(authorization);
  let required = false;
  for (const [contextKey, valueKey] of scopeDimensions) {
    if (requiredColumns[valueKey] === undefined) continue;
    required = true;
    const value = values[valueKey];
    if (
      value === undefined ||
      value === null ||
      authorization[contextKey] !== value
    ) {
      throw new TenantScopeViolationError();
    }
  }
  if (!required) throw new TenantScopeViolationError();
}

export interface TransactionHost<Session> {
  transaction<Result>(
    callback: (session: Session) => Promise<Result>,
  ): Promise<Result>;
}

/** Package-internal compatibility contract for pre-04 infrastructure tests.
 * Feature repositories use AuthorizedTenantTransaction. */
export interface TenantRepositoryCall<Session> {
  readonly authorization: AuthorizationContext;
  readonly session: Session;
}

export type TenantScopedRepository<Session, Operations> = {
  [Operation in keyof Operations]: Operations[Operation] extends (
    ...arguments_: infer Arguments
  ) => infer Result
    ? Arguments extends [TenantRepositoryCall<Session>, ...unknown[]]
      ? (...arguments_: Arguments) => Result
      : never
    : never;
};

export type TenantTransaction<Session> = TenantRepositoryCall<Session>;

export interface AuthorizedTenantTransaction<
  Session,
> extends TenantRepositoryCall<Session> {
  readonly operation: AuthorizedServerOperation;
}

const activeAuthorizedRepositoryCalls = new WeakSet<object>();

export function assertActiveAuthorizedRepositoryCall<Session>(
  call: AuthorizedTenantTransaction<Session>,
): void {
  if (!activeAuthorizedRepositoryCalls.has(call)) {
    throw new TenantScopeViolationError();
  }
  assertAuthorizationContext(call.authorization);
  assertAuthorizedServerOperation(call.operation);
  if (call.authorization !== call.operation.authorization) {
    throw new TenantScopeViolationError();
  }
}

/** Repository methods call this with their static contract before issuing SQL.
 * It prevents a capability for one action, area, visibility or record from
 * being reused for a different repository operation. */
export function assertAuthorizedRepositoryCall<Session>(
  call: AuthorizedTenantTransaction<Session>,
  requirement: AuthorizedOperationRequirement,
): void {
  assertActiveAuthorizedRepositoryCall(call);
  assertAuthorizedOperationRequirement(call.operation, requirement);
}

/** Application-service transaction boundary for bounded database work only.
 * Repositories receive the same caller-owned session and validated context;
 * they never start transactions. External calls belong before or after this
 * callback so they cannot extend database lock lifetimes. */
export function withTenantTransaction<Session, Result>(
  host: TransactionHost<Session>,
  authorization: AuthorizationContext,
  callback: (context: TenantTransaction<Session>) => Promise<Result>,
): Promise<Result> {
  assertAuthorizationContext(authorization);
  return host.transaction((session) =>
    callback(Object.freeze({ authorization, session })),
  );
}

/**
 * Domain-operation transaction boundary. The opaque operation proves that an
 * authenticated actor, authoritative membership, record visibility and action
 * were evaluated before the transaction opens. Feature services should use
 * this boundary; the lower-level helper remains for infrastructure writers and
 * compatibility with the pre-04 authorization foundation.
 */
export function withAuthorizedTenantTransaction<Session, Result>(
  host: TransactionHost<Session>,
  operation: AuthorizedServerOperation,
  callback: (context: AuthorizedTenantTransaction<Session>) => Promise<Result>,
): Promise<Result> {
  assertAuthorizedServerOperation(operation);
  return host.transaction(async (session) => {
    const consumed = await consumeAuthorizedServerOperation(operation, session);
    const call = Object.freeze({
      authorization: consumed.authorization,
      operation: consumed,
      session,
    });
    activeAuthorizedRepositoryCalls.add(call);
    try {
      return await callback(call);
    } finally {
      activeAuthorizedRepositoryCalls.delete(call);
    }
  });
}
