import { createHash, randomBytes } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  assertAuthorizedOrganizationCreation,
  consumeAuthorizedOrganizationCreation,
  consumeAuthorizedOrganizationInvitationClaim,
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  OrganizationAuthorizationError,
  type AuthorizedOrganizationCreation,
  type AuthorizedOrganizationInvitationClaim,
  type AuthorizedServerOperation,
  type PermissionOverride,
  type ServerAuthorizationState,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
} from "./audit-outbox.js";
import {
  auditEvents,
  organizationInvitations,
  organizationMemberships,
  organizations,
  outboxEvents,
  user,
} from "./schema.js";
import {
  assertAuthorizedRepositoryCall,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
import { createUuidV7 } from "./uuid.js";

type OrganizationSchema = {
  auditEvents: typeof auditEvents;
  organizationInvitations: typeof organizationInvitations;
  organizationMemberships: typeof organizationMemberships;
  organizations: typeof organizations;
  outboxEvents: typeof outboxEvents;
  user: typeof user;
};

export type OrganizationDatabase<
  HKT extends PgQueryResultHKT = PgQueryResultHKT,
> = PgDatabase<HKT, OrganizationSchema>;
export type OrganizationRole = "owner" | "manager" | "employee";

const employeeGrants: readonly PermissionOverride[] = Object.freeze([
  Object.freeze({
    area: "vendors",
    action: "view",
    effect: "allow",
    scope: "workspace",
  }),
]);
const managerGrants: readonly PermissionOverride[] = Object.freeze([
  ...employeeGrants,
  Object.freeze({
    area: "settings",
    action: "view",
    effect: "allow",
    scope: "workspace",
  }),
  Object.freeze({
    area: "settings",
    action: "edit",
    effect: "allow",
    scope: "workspace",
  }),
]);

function grants(role: OrganizationRole): readonly PermissionOverride[] {
  return role === "employee" ? employeeGrants : managerGrants;
}

function digest(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export class OrganizationConflictError extends Error {
  constructor(
    readonly reason: "idempotency" | "member_exists" | "invitation_exists",
  ) {
    super("The organization request conflicts with current state");
    this.name = "OrganizationConflictError";
  }
}

export class OrganizationInvitationUnavailableError extends Error {
  constructor(
    readonly reason:
      | "invalid"
      | "expired"
      | "email_mismatch"
      | "email_unverified"
      | "already_claimed",
  ) {
    super("The staff invitation is unavailable");
    this.name = "OrganizationInvitationUnavailableError";
  }
}

export interface OrganizationView {
  readonly id: string;
  readonly name: string;
}
export interface OrganizationMemberView {
  readonly id: string;
  readonly actorId: string;
  readonly name: string;
  readonly email: string;
  readonly role: OrganizationRole;
  readonly status: "active" | "revoked";
}
export interface OrganizationInvitationView {
  readonly id: string;
  readonly organizationId: string;
  readonly invitedEmail: string;
  readonly role: "manager" | "employee";
  readonly status: "pending" | "accepted" | "revoked" | "replaced";
  readonly expiresAt: string;
  readonly reminderAt: string;
  readonly createdAt: string;
}

export async function createOrganization<HKT extends PgQueryResultHKT>(
  database: OrganizationDatabase<HKT>,
  command: AuthorizedOrganizationCreation,
) {
  assertAuthorizedOrganizationCreation(command);
  const organizationId = createUuidV7();
  const consumed = await consumeAuthorizedOrganizationCreation(
    command,
    organizationId,
  );
  const fingerprint = digest(JSON.stringify({ name: command.name }));
  const now = new Date();
  return database.transaction(async (transaction) => {
    const [identity] = await transaction
      .select({ verified: user.emailVerified })
      .from(user)
      .where(eq(user.id, command.actorId))
      .for("update")
      .limit(1);
    if (!identity?.verified) {
      throw new OrganizationAuthorizationError(["verifiedIdentity"]);
    }
    const inserted = await transaction
      .insert(organizations)
      .values({
        id: organizationId,
        name: command.name,
        creatorActorId: command.actorId,
        creationRequestId: command.creationRequestId,
        creationRequestFingerprint: fingerprint,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [organizations.creatorActorId, organizations.creationRequestId],
      })
      .returning();
    if (inserted.length === 0) {
      const [existing] = await transaction
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.creatorActorId, command.actorId),
            eq(organizations.creationRequestId, command.creationRequestId),
          ),
        )
        .limit(1);
      if (!existing || existing.creationRequestFingerprint !== fingerprint) {
        throw new OrganizationConflictError("idempotency");
      }
      return Object.freeze({
        organization: { id: existing.id, name: existing.name },
        replayed: true,
      });
    }
    await transaction.insert(organizationMemberships).values({
      organizationId,
      actorId: command.actorId,
      role: "owner",
      status: "active",
      permissionOverrides: [...grants("owner")],
      permissionScopeVersion: 1,
      createdAt: now,
      updatedAt: now,
    });
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      consumed.authorization,
      transaction,
      createAuditEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.created",
        schemaVersion: 1,
        occurredAt,
        subjectType: "organization",
        subjectId: organizationId,
        metadata: {},
      }),
    );
    await appendAuthorizedOutboxEvent(
      consumed.authorization,
      transaction,
      createOutboxEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.created",
        schemaVersion: 1,
        occurredAt,
        payload: { organizationId },
      }),
    );
    return Object.freeze({
      organization: { id: organizationId, name: command.name },
      replayed: false,
    });
  });
}

function assertManagement(operation: AuthorizedServerOperation) {
  if (operation.area !== "settings" || operation.action !== "edit") {
    throw new OrganizationInvitationUnavailableError("invalid");
  }
}

export async function issueOrganizationInvitation<HKT extends PgQueryResultHKT>(
  database: OrganizationDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: {
    readonly email: string;
    readonly role: "manager" | "employee";
    readonly locale: "en" | "nl" | "fr" | "de";
    readonly issuanceRequestId: string;
    readonly reissueInvitationId?: string;
    readonly now?: Date;
  },
) {
  assertManagement(operation);
  const invitedEmail = input.email.trim().toLowerCase();
  if (
    invitedEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)
  ) {
    throw new OrganizationInvitationUnavailableError("invalid");
  }
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "organization_private",
    });
    const organizationId = call.authorization.activeOrganizationId!;
    await call.session
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .for("update");
    const requestFingerprint = digest(
      JSON.stringify({
        email: invitedEmail,
        role: input.role,
        locale: input.locale,
        reissueInvitationId: input.reissueInvitationId ?? null,
      }),
    );
    const [replayedInvitation] = await call.session
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, organizationId),
          eq(
            organizationInvitations.issuedByActorId,
            call.authorization.actorId,
          ),
          eq(
            organizationInvitations.issuanceRequestId,
            input.issuanceRequestId,
          ),
        ),
      )
      .limit(1);
    if (replayedInvitation) {
      if (
        replayedInvitation.issuanceRequestFingerprint !== requestFingerprint
      ) {
        throw new OrganizationConflictError("idempotency");
      }
      return Object.freeze({
        invitation: invitationView(replayedInvitation),
        token: undefined,
        replayed: true,
      });
    }
    const [existingMember] = await call.session
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .innerJoin(user, eq(user.id, organizationMemberships.actorId))
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(user.email, invitedEmail),
        ),
      )
      .limit(1);
    if (existingMember) throw new OrganizationConflictError("member_exists");
    const now = input.now ?? new Date();
    const [existingInvite] = await call.session
      .select({ id: organizationInvitations.id })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, organizationId),
          eq(organizationInvitations.invitedEmail, invitedEmail),
          eq(organizationInvitations.status, "pending"),
        ),
      )
      .limit(1);
    if (existingInvite && !input.reissueInvitationId) {
      throw new OrganizationConflictError("invitation_exists");
    }
    if (
      input.reissueInvitationId &&
      (!existingInvite || existingInvite.id !== input.reissueInvitationId)
    ) {
      throw new OrganizationInvitationUnavailableError("invalid");
    }
    if (existingInvite && input.reissueInvitationId) {
      const replaced = await call.session
        .update(organizationInvitations)
        .set({ status: "replaced", updatedAt: now })
        .where(
          and(
            eq(organizationInvitations.id, existingInvite.id),
            eq(organizationInvitations.status, "pending"),
          ),
        )
        .returning({ id: organizationInvitations.id });
      if (replaced.length !== 1)
        throw new OrganizationInvitationUnavailableError("already_claimed");
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const reminderAt = new Date(expiresAt.getTime() - 3 * 24 * 60 * 60 * 1000);
    const insertedRows = await call.session
      .insert(organizationInvitations)
      .values({
        organizationId,
        invitedEmail,
        role: input.role,
        tokenDigest: digest(token),
        status: "pending",
        issuedByActorId: call.authorization.actorId,
        issuanceRequestId: input.issuanceRequestId,
        issuanceRequestFingerprint: requestFingerprint,
        expiresAt,
        reminderAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    const row = insertedRows[0];
    if (!row) {
      const [concurrentReplay] = await call.session
        .select()
        .from(organizationInvitations)
        .where(
          and(
            eq(organizationInvitations.organizationId, organizationId),
            eq(
              organizationInvitations.issuedByActorId,
              call.authorization.actorId,
            ),
            eq(
              organizationInvitations.issuanceRequestId,
              input.issuanceRequestId,
            ),
          ),
        )
        .limit(1);
      if (concurrentReplay?.issuanceRequestFingerprint === requestFingerprint) {
        return Object.freeze({
          invitation: invitationView(concurrentReplay),
          token: undefined,
          replayed: true,
        });
      }
      if (concurrentReplay) throw new OrganizationConflictError("idempotency");
      throw new OrganizationConflictError("invitation_exists");
    }
    if (existingInvite) {
      await call.session
        .update(organizationInvitations)
        .set({ replacedByInvitationId: row.id, updatedAt: now })
        .where(eq(organizationInvitations.id, existingInvite.id));
    }
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_invited",
        schemaVersion: 1,
        occurredAt,
        subjectType: "organization_invitation",
        subjectId: row.id,
        metadata: {
          role: input.role,
          expiresAt: expiresAt.toISOString(),
          ...(existingInvite
            ? { replacedInvitationId: existingInvite.id }
            : {}),
        },
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_invited",
        schemaVersion: 1,
        occurredAt,
        payload: {
          invitationId: row.id,
          organizationId,
          locale: input.locale,
          expiresAt: expiresAt.toISOString(),
          reminderAt: reminderAt.toISOString(),
          acceptancePath: `/organization-invitations/pending/${row.id}?locale=${input.locale}`,
          ...(existingInvite
            ? { replacedInvitationId: existingInvite.id }
            : {}),
        },
      }),
    );
    return Object.freeze({
      invitation: invitationView(row),
      token,
      replayed: false,
    });
  });
}

function invitationView(
  row: typeof organizationInvitations.$inferSelect,
): OrganizationInvitationView {
  return Object.freeze({
    id: row.id,
    organizationId: row.organizationId,
    invitedEmail: row.invitedEmail,
    role: row.role as "manager" | "employee",
    status: row.status as OrganizationInvitationView["status"],
    expiresAt: row.expiresAt.toISOString(),
    reminderAt: row.reminderAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
}

export async function readOrganizationInvitationForActor<
  HKT extends PgQueryResultHKT,
>(
  database: OrganizationDatabase<HKT>,
  input: { readonly actorId: string } & (
    { readonly token: string } | { readonly invitationId: string }
  ),
) {
  if ("token" in input && (input.token.length < 32 || input.token.length > 256))
    return undefined;
  const [row] = await database
    .select({
      invitation: organizationInvitations,
      organizationName: organizations.name,
      expired: sql<boolean>`${organizationInvitations.expiresAt} <= current_timestamp`,
    })
    .from(organizationInvitations)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationInvitations.organizationId),
    )
    .innerJoin(
      user,
      and(
        eq(user.id, input.actorId),
        eq(user.emailVerified, true),
        eq(user.email, organizationInvitations.invitedEmail),
      ),
    )
    .where(
      "token" in input
        ? eq(organizationInvitations.tokenDigest, digest(input.token))
        : eq(organizationInvitations.id, input.invitationId),
    )
    .limit(1);
  return row
    ? Object.freeze({
        ...invitationView(row.invitation),
        organizationName: row.organizationName,
        expired: row.expired,
      })
    : undefined;
}

export async function acceptOrganizationInvitation<
  HKT extends PgQueryResultHKT,
>(
  database: OrganizationDatabase<HKT>,
  command: AuthorizedOrganizationInvitationClaim,
  now = new Date(),
) {
  return database.transaction(async (transaction) => {
    const invitationWhere = command.token
      ? eq(organizationInvitations.tokenDigest, digest(command.token))
      : eq(organizationInvitations.id, command.invitationId!);
    const [candidate] = await transaction
      .select({ organizationId: organizationInvitations.organizationId })
      .from(organizationInvitations)
      .where(invitationWhere)
      .limit(1);
    if (!candidate) throw new OrganizationInvitationUnavailableError("invalid");
    await transaction
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, candidate.organizationId))
      .for("update");
    const [invitation] = await transaction
      .select()
      .from(organizationInvitations)
      .where(invitationWhere)
      .for("update")
      .limit(1);
    if (!invitation)
      throw new OrganizationInvitationUnavailableError("invalid");
    const consumed = await consumeAuthorizedOrganizationInvitationClaim(
      command,
      invitation.organizationId,
    );
    if (
      invitation.status === "accepted" &&
      invitation.acceptedByActorId === command.actorId
    ) {
      return Object.freeze({
        organizationId: invitation.organizationId,
        replayed: true,
      });
    }
    if (invitation.status !== "pending")
      throw new OrganizationInvitationUnavailableError("already_claimed");
    if (invitation.expiresAt.getTime() <= now.getTime())
      throw new OrganizationInvitationUnavailableError("expired");
    const [identity] = await transaction
      .select({ email: user.email, verified: user.emailVerified })
      .from(user)
      .where(eq(user.id, command.actorId))
      .limit(1);
    if (!identity?.verified)
      throw new OrganizationInvitationUnavailableError("email_unverified");
    if (identity.email !== invitation.invitedEmail)
      throw new OrganizationInvitationUnavailableError("email_mismatch");
    const insertedMembership = await transaction
      .insert(organizationMemberships)
      .values({
        organizationId: invitation.organizationId,
        actorId: command.actorId,
        role: invitation.role,
        status: "active",
        permissionOverrides: [...grants(invitation.role as OrganizationRole)],
        permissionScopeVersion: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: organizationMemberships.id });
    if (insertedMembership.length !== 1) {
      const [replayed] = await transaction
        .select({
          status: organizationInvitations.status,
          acceptedByActorId: organizationInvitations.acceptedByActorId,
        })
        .from(organizationInvitations)
        .where(eq(organizationInvitations.id, invitation.id))
        .limit(1);
      if (
        replayed?.status === "accepted" &&
        replayed.acceptedByActorId === command.actorId
      )
        return Object.freeze({
          organizationId: invitation.organizationId,
          replayed: true,
        });
      throw new OrganizationInvitationUnavailableError("already_claimed");
    }
    const updated = await transaction
      .update(organizationInvitations)
      .set({
        status: "accepted",
        acceptedByActorId: command.actorId,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationInvitations.id, invitation.id),
          eq(organizationInvitations.status, "pending"),
        ),
      )
      .returning();
    if (updated.length !== 1) {
      const [replayed] = await transaction
        .select({
          status: organizationInvitations.status,
          acceptedByActorId: organizationInvitations.acceptedByActorId,
        })
        .from(organizationInvitations)
        .where(eq(organizationInvitations.id, invitation.id))
        .limit(1);
      if (
        replayed?.status === "accepted" &&
        replayed.acceptedByActorId === command.actorId
      ) {
        return Object.freeze({
          organizationId: invitation.organizationId,
          replayed: true,
        });
      }
      throw new OrganizationInvitationUnavailableError("already_claimed");
    }
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      consumed.authorization,
      transaction,
      createAuditEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_joined",
        schemaVersion: 1,
        occurredAt,
        subjectType: "organization_membership",
        subjectId: insertedMembership[0]!.id,
        metadata: { role: invitation.role },
      }),
    );
    await appendAuthorizedOutboxEvent(
      consumed.authorization,
      transaction,
      createOutboxEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_joined",
        schemaVersion: 1,
        occurredAt,
        payload: {
          organizationId: invitation.organizationId,
          actorId: command.actorId,
          role: invitation.role,
        },
      }),
    );
    return Object.freeze({
      organizationId: invitation.organizationId,
      replayed: false,
    });
  });
}

export async function listOrganizationInvitations<HKT extends PgQueryResultHKT>(
  database: OrganizationDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "organization_private",
    });
    const rows = await call.session
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(
            organizationInvitations.organizationId,
            call.authorization.activeOrganizationId!,
          ),
          eq(organizationInvitations.status, "pending"),
        ),
      );
    return Object.freeze(rows.map(invitationView));
  });
}

export async function revokeOrganizationInvitation<
  HKT extends PgQueryResultHKT,
>(
  database: OrganizationDatabase<HKT>,
  operation: AuthorizedServerOperation,
  invitationId: string,
  now = new Date(),
): Promise<boolean> {
  assertManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "organization_private",
    });
    const organizationId = call.authorization.activeOrganizationId!;
    const [revoked] = await call.session
      .update(organizationInvitations)
      .set({ status: "revoked", revokedAt: now, updatedAt: now })
      .where(
        and(
          eq(organizationInvitations.id, invitationId),
          eq(organizationInvitations.organizationId, organizationId),
          eq(organizationInvitations.status, "pending"),
        ),
      )
      .returning({ id: organizationInvitations.id });
    if (!revoked) return false;
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_invitation_revoked",
        schemaVersion: 1,
        occurredAt,
        subjectType: "organization_invitation",
        subjectId: invitationId,
        metadata: {},
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_invitation_revoked",
        schemaVersion: 1,
        occurredAt,
        payload: { invitationId, organizationId },
      }),
    );
    return true;
  });
}

export async function listOrganizationStaff<HKT extends PgQueryResultHKT>(
  database: OrganizationDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "organization_private",
    });
    const rows = await call.session
      .select({
        id: organizationMemberships.id,
        actorId: organizationMemberships.actorId,
        name: user.name,
        email: user.email,
        role: organizationMemberships.role,
        status: organizationMemberships.status,
      })
      .from(organizationMemberships)
      .innerJoin(user, eq(user.id, organizationMemberships.actorId))
      .where(
        eq(
          organizationMemberships.organizationId,
          call.authorization.activeOrganizationId!,
        ),
      );
    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          ...row,
          role: row.role as OrganizationRole,
          status: row.status as "active" | "revoked",
        }),
      ),
    );
  });
}

export async function deactivateOrganizationMember<
  HKT extends PgQueryResultHKT,
>(
  database: OrganizationDatabase<HKT>,
  operation: AuthorizedServerOperation,
  membershipId: string,
) {
  assertManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "organization_private",
    });
    const [target] = await call.session
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.id, membershipId),
          eq(
            organizationMemberships.organizationId,
            call.authorization.activeOrganizationId!,
          ),
        ),
      )
      .for("update")
      .limit(1);
    if (
      !target ||
      target.role === "owner" ||
      target.actorId === call.authorization.actorId
    )
      throw new OrganizationInvitationUnavailableError("invalid");
    const now = new Date();
    const [updated] = await call.session
      .update(organizationMemberships)
      .set({
        status: "revoked",
        deactivatedAt: now,
        permissionScopeVersion: target.permissionScopeVersion + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationMemberships.id, target.id),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .returning();
    if (!updated)
      throw new OrganizationInvitationUnavailableError("already_claimed");
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_deactivated",
        schemaVersion: 1,
        occurredAt,
        subjectType: "organization_membership",
        subjectId: target.id,
        metadata: { role: target.role },
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "organization.staff_deactivated",
        schemaVersion: 1,
        occurredAt,
        payload: {
          organizationId: target.organizationId,
          actorId: target.actorId,
        },
      }),
    );
    return Object.freeze({ id: target.id, actorId: target.actorId });
  });
}

export class DatabaseOrganizationAuthorizationState<
  HKT extends PgQueryResultHKT,
> implements ServerAuthorizationState {
  constructor(private readonly database: OrganizationDatabase<HKT>) {}
  private session(value: unknown) {
    return (value ?? this.database) as OrganizationDatabase<HKT>;
  }
  async loadOrganizationMembership(input: {
    readonly actorId: string;
    readonly organizationId: string;
    readonly authorizationSession?: unknown;
  }) {
    const [row] = await this.session(input.authorizationSession)
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.actorId, input.actorId),
          eq(organizationMemberships.organizationId, input.organizationId),
        ),
      )
      .limit(1);
    return row
      ? {
          membership: {
            actorId: row.actorId,
            organizationId: row.organizationId,
            status: row.status,
            permissionOverrides: row.permissionOverrides,
          },
          permissionScopeVersion: String(row.permissionScopeVersion),
        }
      : undefined;
  }
  async loadOrganizationRecord(input: {
    readonly recordId: string;
    readonly authorizationSession?: unknown;
  }) {
    const [row] = await this.session(input.authorizationSession)
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, input.recordId))
      .limit(1);
    return row
      ? {
          organizationId: row.id,
          area: "settings" as const,
          relationship: "workspace" as const,
          visibility: "organization_private" as const,
        }
      : undefined;
  }
  async loadWeddingMembership() {
    return undefined;
  }
  async loadWeddingRecord() {
    return undefined;
  }
  async loadIndependentPlannerIdentity() {
    return undefined;
  }
  async loadIndependentPlannerRecord() {
    return undefined;
  }
}
