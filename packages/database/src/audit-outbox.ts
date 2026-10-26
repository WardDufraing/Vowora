import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertAuditEventEnvelope,
  assertAuthorizationContext,
  assertOutboxEventEnvelope,
  type AuditEventEnvelope,
  type AuthorizationContext,
  type OutboxEventEnvelope,
  type TenantRepositoryCall,
  type TenantScopedRepository,
} from "@vowora/domain";

import { auditEvents, outboxEvents } from "./schema.js";
import { TenantScopeViolationError } from "./tenant.js";

type AuditOutboxSchema = {
  auditEvents: typeof auditEvents;
  outboxEvents: typeof outboxEvents;
};

export type AuditOutboxSession = Pick<
  NodePgDatabase<AuditOutboxSchema>,
  "insert"
>;

function assertEnvelopeScope(
  authorization: AuthorizationContext,
  envelope: AuditEventEnvelope | OutboxEventEnvelope,
): void {
  assertAuthorizationContext(authorization);
  if (
    envelope.actorId !== authorization.actorId ||
    envelope.correlationId !== authorization.correlationId ||
    envelope.weddingId !== authorization.activeWeddingId ||
    envelope.organizationId !== authorization.activeOrganizationId
  ) {
    throw new TenantScopeViolationError();
  }
}

interface AuditEventOperations {
  append(
    call: TenantRepositoryCall<AuditOutboxSession>,
    event: AuditEventEnvelope,
  ): Promise<void>;
}

/** The sole application write interface for audit events. It intentionally
 * exposes no update/delete methods. */
export class AuditEventWriter implements TenantScopedRepository<
  AuditOutboxSession,
  AuditEventOperations
> {
  async append(
    { authorization, session }: TenantRepositoryCall<AuditOutboxSession>,
    event: AuditEventEnvelope,
  ): Promise<void> {
    assertAuditEventEnvelope(event);
    assertEnvelopeScope(authorization, event);
    await session.insert(auditEvents).values({
      ...event,
      occurredAt: new Date(event.occurredAt),
    });
  }
}

interface OutboxEventOperations {
  enqueue(
    call: TenantRepositoryCall<AuditOutboxSession>,
    event: OutboxEventEnvelope,
  ): Promise<void>;
}

/** Captures an event on the caller-owned business transaction. Dispatch and
 * delivery state are deliberately deferred to task 16-a. */
export class OutboxEventWriter implements TenantScopedRepository<
  AuditOutboxSession,
  OutboxEventOperations
> {
  async enqueue(
    { authorization, session }: TenantRepositoryCall<AuditOutboxSession>,
    event: OutboxEventEnvelope,
  ): Promise<void> {
    assertOutboxEventEnvelope(event);
    assertEnvelopeScope(authorization, event);
    await session.insert(outboxEvents).values({
      ...event,
      occurredAt: new Date(event.occurredAt),
    });
  }
}
