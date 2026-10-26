import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

/** Better Auth identity record. Tenant membership remains domain-owned and is
 * deliberately absent from the authentication schema. */
export const user = pgTable(
  "auth_user",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_user_email_unique_idx").on(table.email),
    check(
      "auth_user_email_normalized",
      sql`${table.email} = lower(${table.email})`,
    ),
  ],
);

export const session = pgTable(
  "auth_session",
  {
    id: uuid("id").primaryKey(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("auth_session_user_idx").on(table.userId),
    index("auth_session_expires_idx").on(table.expiresAt),
  ],
);

export const account = pgTable(
  "auth_account",
  {
    id: uuid("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_account_user_idx").on(table.userId),
    uniqueIndex("auth_account_provider_unique_idx").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verification = pgTable(
  "auth_verification",
  {
    id: uuid("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_verification_identifier_idx").on(table.identifier),
    index("auth_verification_expires_idx").on(table.expiresAt),
  ],
);
