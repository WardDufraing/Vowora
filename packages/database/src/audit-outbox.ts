import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertAuditEventEnvelope,
  assertAuthorizationContext,
  assertOutboxEventEnvelope,
  type AuditEventEnvelope,
  type AuthorizationContext,
  type OutboxEventEnvelope,
} from "@vowora/domain";

import { auditEvents, outboxEvents } from "./schema.js";
import {
  assertActiveAuthorizedRepositoryCall,
  type AuthorizedTenantTransaction,
  TenantScopeViolationError,
} from "./tenant.js";

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

/** The sole application write interface for audit events. It intentionally
 * exposes no update/delete methods. */
export class AuditEventWriter {
  async append(
    call: AuthorizedTenantTransaction<AuditOutboxSession>,
    event: AuditEventEnvelope,
  ): Promise<void> {
    assertActiveAuthorizedRepositoryCall(call);
    const { authorization, session } = call;
    assertAuditEventEnvelope(event);
    assertEnvelopeScope(authorization, event);
    await session.insert(auditEvents).values({
      ...event,
      occurredAt: new Date(event.occurredAt),
    });
  }
}

/** Captures an event on the caller-owned business transaction. Dispatch and
 * delivery state are deliberately deferred to task 16-a. */
export class OutboxEventWriter {
  async enqueue(
    call: AuthorizedTenantTransaction<AuditOutboxSession>,
    event: OutboxEventEnvelope,
  ): Promise<void> {
    assertActiveAuthorizedRepositoryCall(call);
    const { authorization, session } = call;
    assertOutboxEventEnvelope(event);
    assertEnvelopeScope(authorization, event);
    await session.insert(outboxEvents).values({
      ...event,
      occurredAt: new Date(event.occurredAt),
    });
  }
}
