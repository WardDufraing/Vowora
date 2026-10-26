import { and, eq, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import {
  assertAuthorizationContext,
  type AuthorizationContext,
  type TenantRepositoryCall,
} from "@vowora/domain";

export interface TenantScopeColumns {
  readonly weddingId?: AnyPgColumn;
  readonly organizationId?: AnyPgColumn;
}

export interface TenantScopeValues {
  readonly weddingId?: string | null;
  readonly organizationId?: string | null;
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
] as const;

function scopeEntries<T>(values: {
  readonly weddingId?: T;
  readonly organizationId?: T;
}) {
  return [
    ["activeWeddingId", "weddingId", values.weddingId],
    ["activeOrganizationId", "organizationId", values.organizationId],
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

export type TenantTransaction<Session> = TenantRepositoryCall<Session>;

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
