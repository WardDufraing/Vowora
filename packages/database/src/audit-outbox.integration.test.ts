import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuthorizationContext,
} from "@vowora/domain";

import {
  syntheticOrganizationOperation,
  syntheticWeddingOperation,
} from "./authorization-test-helper.js";
import {
  AuditEventWriter,
  type AuditOutboxSession,
  OutboxEventWriter,
} from "./audit-outbox.js";
import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import { auditEvents, outboxEvents } from "./schema.js";
import {
  TenantScopeViolationError,
  type TransactionHost,
  withAuthorizedTenantTransaction,
} from "./tenant.js";

const businessRecords = pgTable("audit_outbox_business_records", {
  id: uuid("id").primaryKey(),
  weddingId: uuid("wedding_id").notNull(),
  value: text("value").notNull(),
});

type Schema = {
  auditEvents: typeof auditEvents;
  businessRecords: typeof businessRecords;
  outboxEvents: typeof outboxEvents;
};
type Database = NodePgDatabase<Schema>;

const migrationConfig = parseTestMigrationConfig(process.env);
const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const organizationA = "019a1f5e-70a0-7000-8000-000000000020";
const organizationB = "019a1f5e-70a0-7000-8000-000000000021";
function syntheticUuid(index: number): string {
  return `019a1f5e-70a0-7000-8000-${index.toString().padStart(12, "0")}`;
}

function authorizationOperation(scopes: {
  activeWeddingId?: string;
  activeOrganizationId?: string;
}) {
  if (scopes.activeWeddingId && !scopes.activeOrganizationId) {
    return syntheticWeddingOperation(actorId, scopes.activeWeddingId);
  }
  if (scopes.activeOrganizationId && !scopes.activeWeddingId) {
    return syntheticOrganizationOperation(actorId, scopes.activeOrganizationId);
  }
  throw new Error("Synthetic tests issue exactly one authoritative scope");
}

function events(
  context: AuthorizationContext,
  eventId: string,
  businessId: string,
) {
  const eventBase = {
    eventId,
    eventType: "wedding.record_changed",
    schemaVersion: 1,
    occurredAt: "2026-10-26T10:00:00.000Z",
  } as const;
  return {
    audit: createAuditEventEnvelope(context, {
      ...eventBase,
      subjectType: "synthetic_record",
      subjectId: businessId,
      metadata: { operation: "created" },
    }),
    outbox: createOutboxEventEnvelope(context, {
      ...eventBase,
      payload: { recordId: businessId },
    }),
  };
}

async function withDatabase(
  name: string,
  callback: (database: Database) => Promise<void>,
) {
  await withIsolatedTestSchema(
    migrationConfig,
    `${name}-${randomUUID()}`,
    async ({ client }) => {
      await client.query(`
        CREATE TABLE audit_outbox_business_records (
          id uuid PRIMARY KEY,
          wedding_id uuid NOT NULL,
          value text NOT NULL
        )
      `);
      await callback(
        drizzle(client, {
          casing: "snake_case",
          schema: { auditEvents, businessRecords, outboxEvents },
        }),
      );
    },
  );
}

function transactionHost(
  database: Database,
): TransactionHost<AuditOutboxSession> {
  return {
    transaction: (callback) =>
      database.transaction((session) => callback(session)),
  };
}

describe("transactional audit and outbox persistence", () => {
  it("commits business, audit and outbox rows in one tenant transaction", async () => {
    await withDatabase("audit-outbox-commit", async (database) => {
      const operation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const context = operation.authorization;
      const businessId = syntheticUuid(100);
      const event = events(context, syntheticUuid(101), businessId);
      const auditWriter = new AuditEventWriter();
      const outboxWriter = new OutboxEventWriter();

      await withAuthorizedTenantTransaction(
        transactionHost(database),
        operation,
        async (transaction) => {
          await transaction.session.insert(businessRecords).values({
            id: businessId,
            weddingId: weddingA,
            value: "committed",
          });
          await auditWriter.append(transaction, event.audit);
          await outboxWriter.enqueue(transaction, event.outbox);
        },
      );

      const business = await database.select().from(businessRecords);
      const audit = await database.select().from(auditEvents);
      const outbox = await database.select().from(outboxEvents);
      expect(business).toHaveLength(1);
      expect(audit).toMatchObject([
        {
          actorId,
          eventId: event.audit.eventId,
          weddingId: weddingA,
          metadata: { operation: "created" },
        },
      ]);
      expect(outbox).toMatchObject([
        {
          actorId,
          eventId: event.outbox.eventId,
          weddingId: weddingA,
          payload: { recordId: businessId },
        },
      ]);
    });
  });

  it("rolls every row back on application failure and tenant mismatch", async () => {
    await withDatabase("audit-outbox-rollback", async (database) => {
      const operationA = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const contextA = operationA.authorization;
      const contextB = (
        await authorizationOperation({ activeWeddingId: weddingB })
      ).authorization;
      const auditWriter = new AuditEventWriter();
      const outboxWriter = new OutboxEventWriter();
      const host = transactionHost(database);
      const failedBusinessId = syntheticUuid(200);
      const failedEvent = events(
        contextA,
        syntheticUuid(201),
        failedBusinessId,
      );

      await expect(
        withAuthorizedTenantTransaction(
          host,
          operationA,
          async (transaction) => {
            await transaction.session.insert(businessRecords).values({
              id: failedBusinessId,
              weddingId: weddingA,
              value: "roll back on application error",
            });
            await auditWriter.append(transaction, failedEvent.audit);
            await outboxWriter.enqueue(transaction, failedEvent.outbox);
            throw new Error("synthetic application failure");
          },
        ),
      ).rejects.toThrow("synthetic application failure");

      const crossTenantBusinessId = syntheticUuid(202);
      const crossTenantEvent = events(
        contextB,
        syntheticUuid(203),
        crossTenantBusinessId,
      );
      const crossTenantOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      await expect(
        withAuthorizedTenantTransaction(
          host,
          crossTenantOperation,
          async (transaction) => {
            await transaction.session.insert(businessRecords).values({
              id: crossTenantBusinessId,
              weddingId: weddingA,
              value: "roll back on tenant mismatch",
            });
            await auditWriter.append(transaction, crossTenantEvent.audit);
          },
        ),
      ).rejects.toBeInstanceOf(TenantScopeViolationError);

      const organizationOperationA = await authorizationOperation({
        activeOrganizationId: organizationA,
      });
      const organizationContextB = (
        await authorizationOperation({ activeOrganizationId: organizationB })
      ).authorization;
      const crossOrganizationEvent = events(
        organizationContextB,
        syntheticUuid(204),
        syntheticUuid(205),
      );
      await expect(
        withAuthorizedTenantTransaction(
          host,
          organizationOperationA,
          (transaction) =>
            outboxWriter.enqueue(transaction, crossOrganizationEvent.outbox),
        ),
      ).rejects.toBeInstanceOf(TenantScopeViolationError);

      expect(await database.select().from(businessRecords)).toEqual([]);
      expect(await database.select().from(auditEvents)).toEqual([]);
      expect(await database.select().from(outboxEvents)).toEqual([]);
    });
  });

  it("rejects duplicate audit and outbox IDs and rolls back business work", async () => {
    await withDatabase("audit-outbox-idempotency", async (database) => {
      const originalOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const context = originalOperation.authorization;
      const auditWriter = new AuditEventWriter();
      const outboxWriter = new OutboxEventWriter();
      const host = transactionHost(database);
      const originalBusinessId = syntheticUuid(300);
      const originalEventId = syntheticUuid(301);
      const original = events(context, originalEventId, originalBusinessId);

      await withAuthorizedTenantTransaction(
        host,
        originalOperation,
        async (transaction) => {
          await transaction.session.insert(businessRecords).values({
            id: originalBusinessId,
            weddingId: weddingA,
            value: "original",
          });
          await auditWriter.append(transaction, original.audit);
          await outboxWriter.enqueue(transaction, original.outbox);
        },
      );

      const duplicateAuditBusinessId = syntheticUuid(302);
      const duplicateAuditOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const duplicateAudit = events(
        duplicateAuditOperation.authorization,
        originalEventId,
        duplicateAuditBusinessId,
      );
      await expect(
        withAuthorizedTenantTransaction(
          host,
          duplicateAuditOperation,
          async (transaction) => {
            await transaction.session.insert(businessRecords).values({
              id: duplicateAuditBusinessId,
              weddingId: weddingA,
              value: "duplicate audit",
            });
            await auditWriter.append(transaction, duplicateAudit.audit);
          },
        ),
      ).rejects.toThrow();

      const duplicateOutboxBusinessId = syntheticUuid(303);
      const duplicateOutboxOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const duplicateOutbox = events(
        duplicateOutboxOperation.authorization,
        originalEventId,
        duplicateOutboxBusinessId,
      );
      await expect(
        withAuthorizedTenantTransaction(
          host,
          duplicateOutboxOperation,
          async (transaction) => {
            await transaction.session.insert(businessRecords).values({
              id: duplicateOutboxBusinessId,
              weddingId: weddingA,
              value: "duplicate outbox",
            });
            await outboxWriter.enqueue(transaction, duplicateOutbox.outbox);
          },
        ),
      ).rejects.toThrow();

      expect(await database.select().from(businessRecords)).toMatchObject([
        { id: originalBusinessId, value: "original" },
      ]);
      expect(await database.select().from(auditEvents)).toHaveLength(1);
      expect(await database.select().from(outboxEvents)).toHaveLength(1);
    });
  });

  it("rejects forged envelopes and database mutation of audit history", async () => {
    await withDatabase("audit-append-only", async (database) => {
      const forgedOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const context = forgedOperation.authorization;
      const businessId = syntheticUuid(400);
      const event = events(context, syntheticUuid(401), businessId);
      const auditWriter = new AuditEventWriter();
      const host = transactionHost(database);

      await expect(
        withAuthorizedTenantTransaction(host, forgedOperation, (transaction) =>
          auditWriter.append(transaction, {
            ...event.audit,
          } as typeof event.audit),
        ),
      ).rejects.toThrow("Invalid event envelope");

      const validOperation = await authorizationOperation({
        activeWeddingId: weddingA,
      });
      const validEvent = events(
        validOperation.authorization,
        event.audit.eventId,
        businessId,
      );
      await withAuthorizedTenantTransaction(
        host,
        validOperation,
        (transaction) => auditWriter.append(transaction, validEvent.audit),
      );

      for (const mutation of [
        database
          .update(auditEvents)
          .set({ subjectType: "changed" })
          .where(eq(auditEvents.eventId, event.audit.eventId)),
        database
          .delete(auditEvents)
          .where(eq(auditEvents.eventId, event.audit.eventId)),
        database.execute(sql`TRUNCATE TABLE audit_events`),
      ]) {
        await expect(mutation).rejects.toMatchObject({
          cause: {
            code: "55000",
            message: "audit events are append-only",
          },
        });
      }
      expect(await database.select().from(auditEvents)).toMatchObject([
        { eventId: event.audit.eventId, subjectType: "synthetic_record" },
      ]);
    });
  });
});
