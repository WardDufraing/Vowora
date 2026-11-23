import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
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

/** Authoritative wedding workspace. Claim/invitation lifecycle state is owned
 * by 06-b; creation mode only records which approved bootstrap path was used. */
export const weddings = pgTable(
  "weddings",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    name: text("name").notNull(),
    weddingDate: date("wedding_date", { mode: "string" }),
    timeZone: text("time_zone").notNull(),
    creationMode: text("creation_mode").notNull(),
    creatorActorId: uuid("creator_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    creationRequestId: uuid("creation_request_id").notNull(),
    creationRequestFingerprint: text("creation_request_fingerprint").notNull(),
    settingsVersion: integer("settings_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "weddings_name_length",
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 120`,
    ),
    check(
      "weddings_time_zone_length",
      sql`char_length(${table.timeZone}) BETWEEN 1 AND 64`,
    ),
    check(
      "weddings_creation_mode",
      sql`${table.creationMode} IN ('couple', 'planner')`,
    ),
    check(
      "weddings_creation_request_fingerprint",
      sql`${table.creationRequestFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "weddings_settings_version_positive",
      sql`${table.settingsVersion} > 0`,
    ),
    uniqueIndex("weddings_creator_request_unique_idx").on(
      table.creatorActorId,
      table.creationRequestId,
    ),
    index("weddings_creator_idx").on(table.creatorActorId),
  ],
);

export const weddingMemberships = pgTable(
  "wedding_memberships",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    accessExpiresAt: timestamp("access_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    permissionOverrides: jsonb("permission_overrides").notNull().default([]),
    permissionScopeVersion: integer("permission_scope_version")
      .notNull()
      .default(1),
    lastOpenedAt: timestamp("last_opened_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_memberships_role",
      sql`${table.role} IN ('partner', 'planner', 'coordinator', 'helper', 'read_only_guest')`,
    ),
    check(
      "wedding_memberships_status",
      sql`${table.status} IN ('active', 'revoked')`,
    ),
    check(
      "wedding_memberships_scope_version_positive",
      sql`${table.permissionScopeVersion} > 0`,
    ),
    check(
      "wedding_memberships_partner_no_expiry",
      sql`${table.role} <> 'partner' OR ${table.accessExpiresAt} IS NULL`,
    ),
    uniqueIndex("wedding_memberships_wedding_actor_unique_idx").on(
      table.weddingId,
      table.actorId,
    ),
    uniqueIndex("wedding_memberships_wedding_id_unique_idx").on(
      table.weddingId,
      table.id,
    ),
    index("wedding_memberships_actor_idx").on(table.actorId),
    index("wedding_memberships_wedding_idx").on(table.weddingId),
  ],
);

/** Single-use authorization to join a wedding. Only a SHA-256 digest of the
 * bearer secret is persisted; acceptance additionally requires the signed-in
 * account to own the normalized, verified invited email address. */
export const weddingInvitations = pgTable(
  "wedding_invitations",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    invitedEmail: text("invited_email").notNull(),
    role: text("role").notNull(),
    tokenDigest: text("token_digest").notNull(),
    status: text("status").notNull().default("pending"),
    issuedByActorId: uuid("issued_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    acceptedByActorId: uuid("accepted_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    reminderAt: timestamp("reminder_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    replacedByInvitationId: uuid("replaced_by_invitation_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_invitations_email_normalized",
      sql`${table.invitedEmail} = lower(btrim(${table.invitedEmail}))`,
    ),
    check("wedding_invitations_role", sql`${table.role} IN ('partner')`),
    check(
      "wedding_invitations_status",
      sql`${table.status} IN ('pending', 'accepted', 'revoked', 'replaced')`,
    ),
    check(
      "wedding_invitations_token_digest",
      sql`${table.tokenDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "wedding_invitations_deadlines",
      sql`${table.reminderAt} < ${table.expiresAt}`,
    ),
    check(
      "wedding_invitations_acceptance_consistent",
      sql`(${table.status} = 'accepted') = (${table.acceptedAt} IS NOT NULL AND ${table.acceptedByActorId} IS NOT NULL)`,
    ),
    uniqueIndex("wedding_invitations_token_digest_unique_idx").on(
      table.tokenDigest,
    ),
    uniqueIndex("wedding_invitations_one_pending_partner_idx")
      .on(table.weddingId)
      .where(sql`${table.status} = 'pending' AND ${table.role} = 'partner'`),
    index("wedding_invitations_wedding_status_idx").on(
      table.weddingId,
      table.status,
    ),
    index("wedding_invitations_reminder_idx").on(
      table.reminderAt,
      table.status,
    ),
  ],
);

/** Authoritative professional organization identity. Wedding assignment is
 * intentionally owned by 07-b and is not represented here. */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    name: text("name").notNull(),
    creatorActorId: uuid("creator_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    creationRequestId: uuid("creation_request_id").notNull(),
    creationRequestFingerprint: text("creation_request_fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organizations_name_length",
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 120`,
    ),
    uniqueIndex("organizations_creator_request_unique_idx").on(
      table.creatorActorId,
      table.creationRequestId,
    ),
  ],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    permissionOverrides: jsonb("permission_overrides").notNull().default([]),
    permissionScopeVersion: integer("permission_scope_version")
      .notNull()
      .default(1),
    deactivatedAt: timestamp("deactivated_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organization_memberships_role",
      sql`${table.role} IN ('owner', 'manager', 'employee')`,
    ),
    check(
      "organization_memberships_status",
      sql`${table.status} IN ('active', 'revoked')`,
    ),
    check(
      "organization_memberships_deactivation_consistent",
      sql`(${table.status} = 'revoked') = (${table.deactivatedAt} IS NOT NULL)`,
    ),
    check(
      "organization_memberships_owner_immutable",
      sql`${table.role} <> 'owner' OR (${table.status} = 'active' AND ${table.deactivatedAt} IS NULL)`,
    ),
    check(
      "organization_memberships_scope_version_positive",
      sql`${table.permissionScopeVersion} > 0`,
    ),
    uniqueIndex("organization_memberships_actor_unique_idx").on(
      table.organizationId,
      table.actorId,
    ),
    uniqueIndex("organization_memberships_owner_unique_idx")
      .on(table.organizationId)
      .where(sql`${table.role} = 'owner'`),
    index("organization_memberships_actor_status_idx").on(
      table.actorId,
      table.status,
    ),
  ],
);

export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    invitedEmail: text("invited_email").notNull(),
    role: text("role").notNull(),
    tokenDigest: text("token_digest").notNull(),
    status: text("status").notNull().default("pending"),
    issuedByActorId: uuid("issued_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    issuanceRequestId: uuid("issuance_request_id").notNull(),
    issuanceRequestFingerprint: text("issuance_request_fingerprint").notNull(),
    acceptedByActorId: uuid("accepted_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    reminderAt: timestamp("reminder_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    replacedByInvitationId: uuid("replaced_by_invitation_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organization_invitations_email_normalized",
      sql`${table.invitedEmail} = lower(btrim(${table.invitedEmail}))`,
    ),
    check(
      "organization_invitations_role",
      sql`${table.role} IN ('manager', 'employee')`,
    ),
    check(
      "organization_invitations_status",
      sql`${table.status} IN ('pending', 'accepted', 'revoked', 'replaced')`,
    ),
    check(
      "organization_invitations_token_digest",
      sql`${table.tokenDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "organization_invitations_deadlines",
      sql`${table.reminderAt} < ${table.expiresAt}`,
    ),
    check(
      "organization_invitations_acceptance_consistent",
      sql`(${table.status} = 'accepted') = (${table.acceptedAt} IS NOT NULL AND ${table.acceptedByActorId} IS NOT NULL)`,
    ),
    uniqueIndex("organization_invitations_token_unique_idx").on(
      table.tokenDigest,
    ),
    uniqueIndex("organization_invitations_issuance_request_unique_idx").on(
      table.organizationId,
      table.issuedByActorId,
      table.issuanceRequestId,
    ),
    uniqueIndex("organization_invitations_pending_email_unique_idx")
      .on(table.organizationId, table.invitedEmail)
      .where(sql`${table.status} = 'pending'`),
    index("organization_invitations_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("organization_invitations_reminder_idx").on(
      table.reminderAt,
      table.status,
    ),
    foreignKey({
      columns: [table.replacedByInvitationId],
      foreignColumns: [table.id],
      name: "organization_invitations_replaced_by_fk",
    }).onDelete("restrict"),
  ],
);

/** Couple-issued invitation for one verified planner organization. The
 * organization id is the recipient identity; no bearer capability is needed. */
export const weddingOrganizationInvitations = pgTable(
  "wedding_organization_invitations",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("pending"),
    permissionCeiling: jsonb("permission_ceiling").notNull().default([]),
    issuedByActorId: uuid("issued_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    issuanceRequestId: uuid("issuance_request_id").notNull(),
    issuanceRequestFingerprint: text("issuance_request_fingerprint").notNull(),
    acceptedByActorId: uuid("accepted_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    rejectedByActorId: uuid("rejected_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    revokedByActorId: uuid("revoked_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    replacedByInvitationId: uuid("replaced_by_invitation_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_organization_invitations_status",
      sql`${table.status} IN ('pending', 'accepted', 'rejected', 'revoked', 'replaced')`,
    ),
    check(
      "wedding_organization_invitations_fingerprint",
      sql`${table.issuanceRequestFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "wedding_organization_invitations_lifecycle_consistent",
      sql`(
        (${table.status} = 'pending' AND ${table.acceptedByActorId} IS NULL AND ${table.acceptedAt} IS NULL AND ${table.rejectedByActorId} IS NULL AND ${table.rejectedAt} IS NULL AND ${table.revokedByActorId} IS NULL AND ${table.revokedAt} IS NULL AND ${table.replacedByInvitationId} IS NULL) OR
        (${table.status} = 'accepted' AND ${table.acceptedByActorId} IS NOT NULL AND ${table.acceptedAt} IS NOT NULL AND ${table.rejectedByActorId} IS NULL AND ${table.rejectedAt} IS NULL AND ${table.revokedByActorId} IS NULL AND ${table.revokedAt} IS NULL AND ${table.replacedByInvitationId} IS NULL) OR
        (${table.status} = 'rejected' AND ${table.acceptedByActorId} IS NULL AND ${table.acceptedAt} IS NULL AND ${table.rejectedByActorId} IS NOT NULL AND ${table.rejectedAt} IS NOT NULL AND ${table.revokedByActorId} IS NULL AND ${table.revokedAt} IS NULL AND ${table.replacedByInvitationId} IS NULL) OR
        (${table.status} = 'revoked' AND ${table.acceptedByActorId} IS NULL AND ${table.acceptedAt} IS NULL AND ${table.rejectedByActorId} IS NULL AND ${table.rejectedAt} IS NULL AND ${table.revokedByActorId} IS NOT NULL AND ${table.revokedAt} IS NOT NULL AND ${table.replacedByInvitationId} IS NULL) OR
        (${table.status} = 'replaced' AND ${table.acceptedByActorId} IS NULL AND ${table.acceptedAt} IS NULL AND ${table.rejectedByActorId} IS NULL AND ${table.rejectedAt} IS NULL AND ${table.revokedByActorId} IS NULL AND ${table.revokedAt} IS NULL AND ${table.replacedByInvitationId} IS NOT NULL)
      )`,
    ),
    uniqueIndex("wedding_organization_invitation_request_unique_idx").on(
      table.weddingId,
      table.issuedByActorId,
      table.issuanceRequestId,
    ),
    uniqueIndex("wedding_organization_invitation_pending_wedding_idx")
      .on(table.weddingId)
      .where(sql`${table.status} = 'pending'`),
    index("wedding_organization_invitation_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("wedding_organization_invitation_expiry_idx").on(
      table.expiresAt,
      table.status,
    ),
    foreignKey({
      columns: [table.replacedByInvitationId],
      foreignColumns: [table.id],
      name: "wedding_organization_invitations_replaced_by_fk",
    }).onDelete("restrict"),
  ],
);

/** Couple-controlled boundary between a shared wedding and a planner
 * organization. Staff access is always derived through this record and ends
 * immediately when the couple revokes it. */
export const weddingOrganizationAccesses = pgTable(
  "wedding_organization_accesses",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => weddingOrganizationInvitations.id, {
        onDelete: "restrict",
      }),
    status: text("status").notNull().default("active"),
    permissionCeiling: jsonb("permission_ceiling").notNull().default([]),
    permissionScopeVersion: integer("permission_scope_version")
      .notNull()
      .default(1),
    grantedByActorId: uuid("granted_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    revokedByActorId: uuid("revoked_by_actor_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_organization_accesses_status",
      sql`${table.status} IN ('active', 'revoked')`,
    ),
    check(
      "wedding_organization_accesses_revocation_consistent",
      sql`(${table.status} = 'revoked') = (${table.revokedAt} IS NOT NULL AND ${table.revokedByActorId} IS NOT NULL)`,
    ),
    check(
      "wedding_organization_accesses_scope_version_positive",
      sql`${table.permissionScopeVersion} > 0`,
    ),
    uniqueIndex("wedding_organization_accesses_invitation_unique_idx").on(
      table.invitationId,
    ),
    uniqueIndex("wedding_organization_accesses_one_active_wedding_idx")
      .on(table.weddingId)
      .where(sql`${table.status} = 'active'`),
    index("wedding_organization_accesses_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("wedding_organization_accesses_wedding_status_idx").on(
      table.weddingId,
      table.status,
    ),
  ],
);

/** Organization-controlled staffing within the couple's access ceiling. Lead
 * designation coordinates work but never changes the stored permission set. */
export const weddingOrganizationStaffAssignments = pgTable(
  "wedding_organization_staff_assignments",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    accessId: uuid("access_id")
      .notNull()
      .references(() => weddingOrganizationAccesses.id, {
        onDelete: "restrict",
      }),
    organizationMembershipId: uuid("organization_membership_id")
      .notNull()
      .references(() => organizationMemberships.id, { onDelete: "restrict" }),
    weddingMembershipId: uuid("wedding_membership_id")
      .notNull()
      .references(() => weddingMemberships.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("active"),
    isLead: boolean("is_lead").notNull().default(false),
    permissionOverrides: jsonb("permission_overrides").notNull().default([]),
    permissionScopeVersion: integer("permission_scope_version")
      .notNull()
      .default(1),
    assignedByActorId: uuid("assigned_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    absenceStartsAt: timestamp("absence_starts_at", {
      withTimezone: true,
      mode: "date",
    }),
    absenceEndsAt: timestamp("absence_ends_at", {
      withTimezone: true,
      mode: "date",
    }),
    absenceExceptions: jsonb("absence_exceptions").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_organization_staff_status",
      sql`${table.status} IN ('active', 'revoked')`,
    ),
    check(
      "wedding_organization_staff_revocation_consistent",
      sql`(${table.status} = 'revoked') = (${table.revokedAt} IS NOT NULL)`,
    ),
    check(
      "wedding_organization_staff_scope_version_positive",
      sql`${table.permissionScopeVersion} > 0`,
    ),
    check(
      "wedding_organization_staff_absence_consistent",
      sql`(${table.absenceStartsAt} IS NULL AND ${table.absenceEndsAt} IS NULL) OR (${table.absenceStartsAt} IS NOT NULL AND ${table.absenceEndsAt} IS NOT NULL AND ${table.absenceStartsAt} < ${table.absenceEndsAt})`,
    ),
    uniqueIndex("wedding_organization_staff_access_member_unique_idx").on(
      table.accessId,
      table.organizationMembershipId,
    ),
    uniqueIndex("wedding_organization_staff_wedding_member_unique_idx").on(
      table.weddingMembershipId,
    ),
    uniqueIndex("wedding_organization_staff_one_lead_idx")
      .on(table.accessId)
      .where(sql`${table.isLead} = true AND ${table.status} = 'active'`),
    index("wedding_organization_staff_access_status_idx").on(
      table.accessId,
      table.status,
    ),
  ],
);

/** Couple restriction survives staff removal so a blocked employee cannot be
 * silently reassigned until a partner explicitly lifts the restriction. */
export const weddingOrganizationStaffRestrictions = pgTable(
  "wedding_organization_staff_restrictions",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    accessId: uuid("access_id")
      .notNull()
      .references(() => weddingOrganizationAccesses.id, {
        onDelete: "restrict",
      }),
    organizationMembershipId: uuid("organization_membership_id")
      .notNull()
      .references(() => organizationMemberships.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("blocked"),
    changedByActorId: uuid("changed_by_actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    blockedAt: timestamp("blocked_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    liftedAt: timestamp("lifted_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_organization_staff_restrictions_status",
      sql`${table.status} IN ('blocked', 'lifted')`,
    ),
    check(
      "wedding_organization_staff_restrictions_lift_consistent",
      sql`(${table.status} = 'lifted') = (${table.liftedAt} IS NOT NULL)`,
    ),
    uniqueIndex("wedding_organization_staff_restriction_unique_idx").on(
      table.accessId,
      table.organizationMembershipId,
    ),
  ],
);

/** Completed voluntary organization exits. Guided handover is generated from
 * authoritative state and completed atomically; MVP deliberately stores no
 * editable draft. */
export const weddingOrganizationHandovers = pgTable(
  "wedding_organization_handovers",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    accessId: uuid("access_id")
      .notNull()
      .references(() => weddingOrganizationAccesses.id, {
        onDelete: "restrict",
      }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    initiatedByMembershipId: uuid("initiated_by_membership_id")
      .notNull()
      .references(() => organizationMemberships.id, { onDelete: "restrict" }),
    mode: text("mode").notNull(),
    requestId: uuid("request_id").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "wedding_organization_handovers_mode",
      sql`${table.mode} IN ('guided', 'immediate')`,
    ),
    check(
      "wedding_organization_handovers_fingerprint",
      sql`${table.requestFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    uniqueIndex("wedding_organization_handovers_access_unique_idx").on(
      table.accessId,
    ),
    uniqueIndex("wedding_organization_handovers_request_unique_idx").on(
      table.organizationId,
      table.initiatedByMembershipId,
      table.requestId,
    ),
    index("wedding_organization_handovers_wedding_idx").on(table.weddingId),
  ],
);

/** Organization-private business notes never enter the shared wedding
 * workspace. A wedding link is a private historical reference only. */
export const organizationPrivateNotes = pgTable(
  "organization_private_notes",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    weddingId: uuid("wedding_id").references(() => weddings.id, {
      onDelete: "restrict",
    }),
    createdByMembershipId: uuid("created_by_membership_id")
      .notNull()
      .references(() => organizationMemberships.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("active"),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organization_private_notes_status",
      sql`${table.status} IN ('active', 'archived')`,
    ),
    check(
      "organization_private_notes_archive_consistent",
      sql`(${table.status} = 'archived') = (${table.archivedAt} IS NOT NULL)`,
    ),
    check(
      "organization_private_notes_title_length",
      sql`char_length(${table.title}) BETWEEN 1 AND 160`,
    ),
    check(
      "organization_private_notes_body_length",
      sql`char_length(${table.body}) BETWEEN 1 AND 20000`,
    ),
    index("organization_private_notes_org_status_idx").on(
      table.organizationId,
      table.status,
      table.updatedAt,
    ),
    index("organization_private_notes_wedding_idx").on(table.weddingId),
  ],
);

/** Wedding task phases are intentionally separate from milestone topic phases
 * (DEC-596). Their labels are workspace-owned so the later template task can
 * add starter content without coupling core task records to a template. */
export const taskPhases = pgTable(
  "task_phases",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "task_phases_name_length",
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 80`,
    ),
    check("task_phases_position_nonnegative", sql`${table.position} >= 0`),
    check("task_phases_version_positive", sql`${table.version} > 0`),
    uniqueIndex("task_phases_wedding_name_unique_idx").on(
      table.weddingId,
      sql`lower(btrim(${table.name}))`,
    ),
    uniqueIndex("task_phases_wedding_id_unique_idx").on(
      table.weddingId,
      table.id,
    ),
    index("task_phases_wedding_position_idx").on(
      table.weddingId,
      table.position,
    ),
  ],
);

/** Milestone phases have their own vocabulary and lifecycle. Suggested phase
 * seeding belongs to 08-c's starter-template application; 08-a establishes the
 * permission-aware custom phase and grouping contract. */
export const milestonePhases = pgTable(
  "milestone_phases",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("custom"),
    status: text("status").notNull().default("active"),
    trashedAt: timestamp("trashed_at", { withTimezone: true, mode: "date" }),
    position: integer("position").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "milestone_phases_name_length",
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 80`,
    ),
    check(
      "milestone_phases_kind",
      sql`${table.kind} IN ('suggested', 'custom')`,
    ),
    check(
      "milestone_phases_status",
      sql`${table.status} IN ('active', 'hidden', 'trashed')`,
    ),
    check(
      "milestone_phases_kind_status",
      sql`(${table.kind} = 'suggested' AND ${table.status} IN ('active', 'hidden') AND ${table.trashedAt} IS NULL) OR (${table.kind} = 'custom' AND ${table.status} IN ('active', 'trashed') AND ((${table.status} = 'trashed') = (${table.trashedAt} IS NOT NULL)))`,
    ),
    check("milestone_phases_position_nonnegative", sql`${table.position} >= 0`),
    check("milestone_phases_version_positive", sql`${table.version} > 0`),
    uniqueIndex("milestone_phases_wedding_name_unique_idx")
      .on(table.weddingId, sql`lower(btrim(${table.name}))`)
      .where(sql`${table.status} <> 'trashed'`),
    uniqueIndex("milestone_phases_wedding_id_unique_idx").on(
      table.weddingId,
      table.id,
    ),
    index("milestone_phases_wedding_position_idx").on(
      table.weddingId,
      table.position,
    ),
  ],
);

export const planningTasks = pgTable(
  "planning_tasks",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    phaseId: uuid("phase_id").references(() => taskPhases.id, {
      onDelete: "restrict",
    }),
    ownerMembershipId: uuid("owner_membership_id").references(
      () => weddingMemberships.id,
      { onDelete: "restrict" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date", { mode: "string" }),
    status: text("status").notNull().default("not_started"),
    blockedReason: text("blocked_reason"),
    lifecycle: text("lifecycle").notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "planning_tasks_title_length",
      sql`char_length(btrim(${table.title})) BETWEEN 1 AND 200`,
    ),
    check(
      "planning_tasks_description_length",
      sql`${table.description} IS NULL OR char_length(${table.description}) <= 10000`,
    ),
    check(
      "planning_tasks_status",
      sql`${table.status} IN ('not_started', 'in_progress', 'blocked', 'complete')`,
    ),
    check(
      "planning_tasks_blocked_reason_consistent",
      sql`${table.blockedReason} IS NULL OR (${table.status} = 'blocked' AND char_length(btrim(${table.blockedReason})) BETWEEN 1 AND 500)`,
    ),
    check(
      "planning_tasks_lifecycle",
      sql`${table.lifecycle} IN ('active', 'archived')`,
    ),
    check(
      "planning_tasks_archive_consistent",
      sql`(${table.lifecycle} = 'archived') = (${table.archivedAt} IS NOT NULL)`,
    ),
    check(
      "planning_tasks_completion_consistent",
      sql`(${table.status} = 'complete') = (${table.completedAt} IS NOT NULL)`,
    ),
    check("planning_tasks_version_positive", sql`${table.version} > 0`),
    index("planning_tasks_wedding_status_due_idx").on(
      table.weddingId,
      table.lifecycle,
      table.status,
      table.dueDate,
    ),
    index("planning_tasks_owner_idx").on(table.ownerMembershipId),
    foreignKey({
      columns: [table.weddingId, table.phaseId],
      foreignColumns: [taskPhases.weddingId, taskPhases.id],
      name: "planning_tasks_phase_same_wedding_fk",
    }),
    foreignKey({
      columns: [table.weddingId, table.ownerMembershipId],
      foreignColumns: [weddingMemberships.weddingId, weddingMemberships.id],
      name: "planning_tasks_owner_same_wedding_fk",
    }),
  ],
);

export const planningMilestones = pgTable(
  "planning_milestones",
  {
    id: uuid("id").primaryKey().$defaultFn(createUuidV7),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "restrict" }),
    phaseId: uuid("phase_id").references(() => milestonePhases.id, {
      onDelete: "restrict",
    }),
    restorablePhaseId: uuid("restorable_phase_id").references(
      () => milestonePhases.id,
      { onDelete: "set null" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    plannedDate: date("planned_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("not_started"),
    lifecycle: text("lifecycle").notNull().default("active"),
    trashedAt: timestamp("trashed_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "planning_milestones_title_length",
      sql`char_length(btrim(${table.title})) BETWEEN 1 AND 200`,
    ),
    check(
      "planning_milestones_description_length",
      sql`${table.description} IS NULL OR char_length(${table.description}) <= 10000`,
    ),
    check(
      "planning_milestones_status",
      sql`${table.status} IN ('not_started', 'in_progress', 'complete')`,
    ),
    check(
      "planning_milestones_lifecycle",
      sql`${table.lifecycle} IN ('active', 'trashed')`,
    ),
    check(
      "planning_milestones_trash_consistent",
      sql`(${table.lifecycle} = 'trashed') = (${table.trashedAt} IS NOT NULL)`,
    ),
    check("planning_milestones_version_positive", sql`${table.version} > 0`),
    index("planning_milestones_wedding_date_idx").on(
      table.weddingId,
      table.plannedDate,
      table.status,
    ),
    foreignKey({
      columns: [table.weddingId, table.phaseId],
      foreignColumns: [milestonePhases.weddingId, milestonePhases.id],
      name: "planning_milestones_phase_same_wedding_fk",
    }),
    foreignKey({
      columns: [table.weddingId, table.restorablePhaseId],
      foreignColumns: [milestonePhases.weddingId, milestonePhases.id],
      name: "planning_milestones_restorable_phase_same_wedding_fk",
    }),
  ],
);

export type Wedding = typeof weddings.$inferSelect;
export type NewWedding = typeof weddings.$inferInsert;
export type WeddingMembershipRow = typeof weddingMemberships.$inferSelect;
export type NewWeddingMembership = typeof weddingMemberships.$inferInsert;
export type WeddingInvitationRow = typeof weddingInvitations.$inferSelect;
export type NewWeddingInvitation = typeof weddingInvitations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMembershipRow =
  typeof organizationMemberships.$inferSelect;
export type OrganizationInvitationRow =
  typeof organizationInvitations.$inferSelect;
export type WeddingOrganizationInvitationRow =
  typeof weddingOrganizationInvitations.$inferSelect;
export type WeddingOrganizationAccessRow =
  typeof weddingOrganizationAccesses.$inferSelect;
export type WeddingOrganizationStaffAssignmentRow =
  typeof weddingOrganizationStaffAssignments.$inferSelect;
export type WeddingOrganizationStaffRestrictionRow =
  typeof weddingOrganizationStaffRestrictions.$inferSelect;
export type WeddingOrganizationHandoverRow =
  typeof weddingOrganizationHandovers.$inferSelect;
export type OrganizationPrivateNoteRow =
  typeof organizationPrivateNotes.$inferSelect;
export type TaskPhaseRow = typeof taskPhases.$inferSelect;
export type MilestonePhaseRow = typeof milestonePhases.$inferSelect;
export type PlanningTaskRow = typeof planningTasks.$inferSelect;
export type PlanningMilestoneRow = typeof planningMilestones.$inferSelect;
