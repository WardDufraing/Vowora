import {
  assertAuthorizedWeddingPermissionChange,
  completeAuthorizedWeddingPermissionChange,
  consumeAuthorizedWeddingPermissionChange,
  PermissionScopeChangeError,
  type AuthorizedWeddingPermissionChange,
  type PermissionChangeEventIdentity,
  type WeddingMembership,
  type WeddingPermissionMutationResult,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
  type AuditOutboxSession,
} from "./audit-outbox.js";
import type { TransactionHost } from "./tenant.js";

export interface WeddingPermissionMutationRequirement {
  readonly change: AuthorizedWeddingPermissionChange["change"];
  readonly expectedPermissionScopeVersion: string;
  readonly membership: WeddingMembership;
  readonly membershipId: string;
  readonly weddingId: string;
}

export interface AuthorizedWeddingPermissionChangeCall<Session> {
  readonly operation: AuthorizedWeddingPermissionChange;
  readonly session: Session;
}

export interface WeddingPermissionChangeRepository<Session> {
  compareAndSwap(
    call: AuthorizedWeddingPermissionChangeCall<Session>,
    requirement: WeddingPermissionMutationRequirement,
  ): Promise<WeddingPermissionMutationResult | undefined>;
}

const activeCalls = new WeakSet<object>();
const assertedCalls = new WeakSet<object>();

function membershipsEqual(
  left: WeddingMembership,
  right: WeddingMembership,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Mandatory repository assertion before the compare-and-swap statement. */
export function assertAuthorizedWeddingPermissionChangeCall<Session>(
  call: AuthorizedWeddingPermissionChangeCall<Session>,
  requirement: WeddingPermissionMutationRequirement,
): void {
  if (!activeCalls.has(call)) {
    throw new PermissionScopeChangeError("access_denied");
  }
  assertAuthorizedWeddingPermissionChange(call.operation);
  if (
    requirement.change !== call.operation.change ||
    requirement.expectedPermissionScopeVersion !==
      call.operation.expectedPermissionScopeVersion ||
    requirement.membershipId !== call.operation.membershipId ||
    requirement.weddingId !== call.operation.weddingId ||
    !membershipsEqual(requirement.membership, call.operation.membership)
  ) {
    throw new PermissionScopeChangeError("access_denied");
  }
  assertedCalls.add(call);
}

/**
 * Sole permission-change transaction coordinator. It revalidates and consumes
 * the access-management capability, requires an exact repository assertion,
 * derives audit facts from the authoritative compare-and-swap result, and
 * persists audit plus invalidation before the transaction can commit.
 */
export function withAuditedWeddingPermissionChange<
  Session extends AuditOutboxSession,
>(
  host: TransactionHost<Session>,
  operation: AuthorizedWeddingPermissionChange,
  repository: WeddingPermissionChangeRepository<Session>,
  eventIdentity: PermissionChangeEventIdentity,
): Promise<WeddingPermissionMutationResult> {
  assertAuthorizedWeddingPermissionChange(operation);
  return host.transaction(async (session) => {
    const consumed = await consumeAuthorizedWeddingPermissionChange(
      operation,
      session,
    );
    const call = Object.freeze({
      operation: consumed,
      get session() {
        if (!assertedCalls.has(call)) {
          throw new PermissionScopeChangeError("access_denied");
        }
        return session;
      },
    });
    const requirement = Object.freeze({
      change: consumed.change,
      expectedPermissionScopeVersion: consumed.expectedPermissionScopeVersion,
      membership: consumed.membership,
      membershipId: consumed.membershipId,
      weddingId: consumed.weddingId,
    });
    activeCalls.add(call);
    try {
      const result = await repository.compareAndSwap(call, requirement);
      if (!assertedCalls.has(call) || !result) {
        throw new PermissionScopeChangeError("stale");
      }
      const capture = completeAuthorizedWeddingPermissionChange(
        consumed,
        result,
        eventIdentity,
      );
      await appendAuthorizedAuditEvent(
        consumed.authorization,
        session,
        capture.audit,
      );
      await appendAuthorizedOutboxEvent(
        consumed.authorization,
        session,
        capture.invalidation,
      );
      return Object.freeze({
        ...result,
        membership: consumed.membership,
      });
    } finally {
      assertedCalls.delete(call);
      activeCalls.delete(call);
    }
  });
}
