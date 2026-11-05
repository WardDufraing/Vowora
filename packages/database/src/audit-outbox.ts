import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

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

export type AuditOutboxSession<
  HKT extends PgQueryResultHKT = PgQueryResultHKT,
> = Pick<PgDatabase<HKT, AuditOutboxSchema>, "insert">;

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

/** Package-internal primitive shared by authorized business and permission
 * change transaction boundaries. It is not exported from the package root. */
export async function appendAuthorizedAuditEvent<HKT extends PgQueryResultHKT>(
  authorization: AuthorizationContext,
  session: AuditOutboxSession<HKT>,
  event: AuditEventEnvelope,
): Promise<void> {
  assertAuditEventEnvelope(event);
  assertEnvelopeScope(authorization, event);
  await session.insert(auditEvents).values({
    ...event,
    occurredAt: new Date(event.occurredAt),
  });
}

/** Package-internal counterpart for transactionally captured outbox events. */
export async function appendAuthorizedOutboxEvent<HKT extends PgQueryResultHKT>(
  authorization: AuthorizationContext,
  session: AuditOutboxSession<HKT>,
  event: OutboxEventEnvelope,
): Promise<void> {
  assertOutboxEventEnvelope(event);
  assertEnvelopeScope(authorization, event);
  await session.insert(outboxEvents).values({
    ...event,
    occurredAt: new Date(event.occurredAt),
  });
}

/** The sole application write interface for audit events. It intentionally
 * exposes no update/delete methods. */
export class AuditEventWriter {
  async append<HKT extends PgQueryResultHKT>(
    call: AuthorizedTenantTransaction<AuditOutboxSession<HKT>>,
    event: AuditEventEnvelope,
  ): Promise<void> {
    assertActiveAuthorizedRepositoryCall(call);
    const { authorization, session } = call;
    await appendAuthorizedAuditEvent(authorization, session, event);
  }
}

/** Captures an event on the caller-owned business transaction. Dispatch and
 * delivery state are deliberately deferred to task 16-a. */
export class OutboxEventWriter {
  async enqueue<HKT extends PgQueryResultHKT>(
    call: AuthorizedTenantTransaction<AuditOutboxSession<HKT>>,
    event: OutboxEventEnvelope,
  ): Promise<void> {
    assertActiveAuthorizedRepositoryCall(call);
    const { authorization, session } = call;
    await appendAuthorizedOutboxEvent(authorization, session, event);
  }
}
