import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createUuidV7 } from "./uuid.js";

/**
 * Infrastructure-only marker for migration compatibility checks. Product
 * entities begin in their owning tasks and must not be added here speculatively.
 */
export const schemaMetadata = pgTable("schema_metadata", {
  id: uuid("id").primaryKey().$defaultFn(createUuidV7),
  key: text("key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type SchemaMetadata = typeof schemaMetadata.$inferSelect;
export type NewSchemaMetadata = typeof schemaMetadata.$inferInsert;

function eventColumns() {
  return {
    eventId: uuid("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    actorId: uuid("actor_id").notNull(),
    weddingId: uuid("wedding_id"),
    organizationId: uuid("organization_id"),
    correlationId: uuid("correlation_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  };
}

/** Durable append-only audit facts. Mutation APIs are intentionally absent;
 * the migration also installs a database trigger that rejects update/delete. */
export const auditEvents = pgTable(
  "audit_events",
  {
    ...eventColumns(),
    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    metadata: jsonb("metadata").notNull(),
  },
  (table) => [
    check(
      "audit_events_has_scope",
      sql`${table.weddingId} IS NOT NULL OR ${table.organizationId} IS NOT NULL`,
    ),
    check(
      "audit_events_schema_version_positive",
      sql`${table.schemaVersion} > 0`,
    ),
    index("audit_events_wedding_occurred_idx").on(
      table.weddingId,
      table.occurredAt,
    ),
    index("audit_events_organization_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
  ],
);

/** Pending domain events. Task 16-a owns leases, retry/dispatch state and
 * external Trigger.dev execution; this table only establishes atomic capture. */
export const outboxEvents = pgTable(
  "outbox_events",
  {
    ...eventColumns(),
    payload: jsonb("payload").notNull(),
  },
  (table) => [
    check(
      "outbox_events_has_scope",
      sql`${table.weddingId} IS NOT NULL OR ${table.organizationId} IS NOT NULL`,
    ),
    check(
      "outbox_events_schema_version_positive",
      sql`${table.schemaVersion} > 0`,
    ),
    index("outbox_events_wedding_created_idx").on(
      table.weddingId,
      table.createdAt,
    ),
    index("outbox_events_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
export type OutboxEventRow = typeof outboxEvents.$inferSelect;
export type NewOutboxEventRow = typeof outboxEvents.$inferInsert;
