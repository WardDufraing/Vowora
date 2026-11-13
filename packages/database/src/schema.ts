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
