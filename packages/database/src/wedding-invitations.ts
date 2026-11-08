import { createHash, randomBytes } from "node:crypto";

import { and, count, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  authorizeWeddingInvitationClaim,
  consumeAuthorizedWeddingInvitationClaim,
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuthorizedServerOperation,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
} from "./audit-outbox.js";
import {
  auditEvents,
  outboxEvents,
  user,
  weddingInvitations,
  weddingMemberships,
  weddings,
} from "./schema.js";
import {
  assertAuthorizedRepositoryCall,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
import { createUuidV7 } from "./uuid.js";

type InvitationSchema = {
  auditEvents: typeof auditEvents;
  outboxEvents: typeof outboxEvents;
  user: typeof user;
  weddingInvitations: typeof weddingInvitations;
  weddingMemberships: typeof weddingMemberships;
  weddings: typeof weddings;
};

export type InvitationDatabase<
  HKT extends PgQueryResultHKT = PgQueryResultHKT,
> = PgDatabase<HKT, InvitationSchema>;

export class WeddingInvitationConflictError extends Error {
  constructor(readonly reason: "partner_exists" | "pending_exists") {
    super("A second partner or pending partner invitation already exists");
    this.name = "WeddingInvitationConflictError";
  }
}

export class WeddingInvitationUnavailableError extends Error {
  constructor(
    readonly reason:
      | "invalid"
      | "expired"
      | "email_mismatch"
      | "email_unverified"
      | "already_claimed",
  ) {
    super("The wedding invitation is unavailable");
    this.name = "WeddingInvitationUnavailableError";
  }
}

export interface WeddingInvitationView {
  readonly id: string;
  readonly weddingId: string;
  readonly invitedEmail: string;
  readonly role: "partner";
  readonly status: "pending" | "accepted" | "revoked" | "replaced";
  readonly expiresAt: string;
  readonly reminderAt: string;
  readonly createdAt: string;
}

export async function listPartnerInvitations<HKT extends PgQueryResultHKT>(
  database: InvitationDatabase<HKT>,
  operation: AuthorizedServerOperation,
): Promise<readonly WeddingInvitationView[]> {
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const rows = await call.session
      .select()
      .from(weddingInvitations)
      .where(
        and(
          eq(weddingInvitations.weddingId, call.authorization.activeWeddingId!),
          eq(weddingInvitations.role, "partner"),
          eq(weddingInvitations.status, "pending"),
        ),
      );
    return Object.freeze(rows.map(invitationView));
  });
}

function digest(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function invitationView(
  row: typeof weddingInvitations.$inferSelect,
): WeddingInvitationView {
  return Object.freeze({
    id: row.id,
    weddingId: row.weddingId,
    invitedEmail: row.invitedEmail,
    role: "partner",
    status: row.status as WeddingInvitationView["status"],
    expiresAt: row.expiresAt.toISOString(),
    reminderAt: row.reminderAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
}

export async function readPartnerInvitationForActor<
  HKT extends PgQueryResultHKT,
>(
  database: InvitationDatabase<HKT>,
  input: { readonly actorId: string } & (
    { readonly token: string } | { readonly invitationId: string }
  ),
): Promise<WeddingInvitationView | undefined> {
  if (
    "token" in input &&
    (input.token.length < 32 || input.token.length > 256)
  ) {
    return undefined;
  }
  const [row] = await database
    .select({ invitation: weddingInvitations })
    .from(weddingInvitations)
    .innerJoin(
      user,
      and(
        eq(user.id, input.actorId),
        eq(user.emailVerified, true),
        eq(user.email, weddingInvitations.invitedEmail),
      ),
    )
    .where(
      "token" in input
        ? eq(weddingInvitations.tokenDigest, digest(input.token))
        : eq(weddingInvitations.id, input.invitationId),
    )
    .limit(1);
  return row ? invitationView(row.invitation) : undefined;
}

export async function issuePartnerInvitation<HKT extends PgQueryResultHKT>(
  database: InvitationDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: {
    readonly email: string;
    readonly locale?: "en" | "nl" | "fr" | "de";
    readonly now?: Date;
  },
): Promise<{
  readonly invitation: WeddingInvitationView;
  readonly token: string;
}> {
  const invitedEmail = input.email.trim().toLowerCase();
  if (
    invitedEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)
  ) {
    throw new WeddingInvitationUnavailableError("invalid");
  }
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const weddingId = call.authorization.activeWeddingId!;
    const now = input.now ?? new Date();
    await call.session
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, weddingId))
      .for("update");
    const [partners] = await call.session
      .select({ value: count() })
      .from(weddingMemberships)
      .where(
        and(
          eq(weddingMemberships.weddingId, weddingId),
          eq(weddingMemberships.role, "partner"),
          eq(weddingMemberships.status, "active"),
        ),
      );
    if ((partners?.value ?? 0) >= 2) {
      throw new WeddingInvitationConflictError("partner_exists");
    }
    const [alreadyMember] = await call.session
      .select({ id: weddingMemberships.id })
      .from(weddingMemberships)
      .innerJoin(user, eq(user.id, weddingMemberships.actorId))
      .where(
        and(
          eq(weddingMemberships.weddingId, weddingId),
          eq(weddingMemberships.status, "active"),
          eq(user.email, invitedEmail),
        ),
      )
      .limit(1);
    if (alreadyMember) {
      throw new WeddingInvitationConflictError("partner_exists");
    }
    const [pending] = await call.session
      .select({
        id: weddingInvitations.id,
        invitedEmail: weddingInvitations.invitedEmail,
        expiresAt: weddingInvitations.expiresAt,
      })
      .from(weddingInvitations)
      .where(
        and(
          eq(weddingInvitations.weddingId, weddingId),
          eq(weddingInvitations.role, "partner"),
          eq(weddingInvitations.status, "pending"),
        ),
      )
      .limit(1);
    if (pending) {
      if (
        pending.expiresAt.getTime() > now.getTime() ||
        pending.invitedEmail !== invitedEmail
      ) {
        throw new WeddingInvitationConflictError("pending_exists");
      }
      await call.session
        .update(weddingInvitations)
        .set({ status: "replaced", updatedAt: now })
        .where(
          and(
            eq(weddingInvitations.id, pending.id),
            eq(weddingInvitations.status, "pending"),
          ),
        );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const reminderAt = new Date(expiresAt.getTime() - 3 * 24 * 60 * 60 * 1000);
    const [inserted] = await call.session
      .insert(weddingInvitations)
      .values({
        weddingId,
        invitedEmail,
        role: "partner",
        tokenDigest: digest(token),
        status: "pending",
        issuedByActorId: call.authorization.actorId,
        expiresAt,
        reminderAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (pending) {
      await call.session
        .update(weddingInvitations)
        .set({ replacedByInvitationId: inserted!.id, updatedAt: now })
        .where(eq(weddingInvitations.id, pending.id));
    }
    const occurredAt = now.toISOString();
    const deliveryPath = `/invitations/pending/${inserted!.id}?locale=${input.locale ?? "en"}`;
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_issued",
        schemaVersion: 1,
        occurredAt,
        subjectType: "wedding_invitation",
        subjectId: inserted!.id,
        metadata: {
          role: "partner",
          expiresAt: expiresAt.toISOString(),
          ...(pending ? { replacedInvitationId: pending.id } : {}),
        },
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_issued",
        schemaVersion: 1,
        occurredAt,
        payload: {
          invitationId: inserted!.id,
          weddingId,
          expiresAt: expiresAt.toISOString(),
          reminderAt: reminderAt.toISOString(),
          acceptancePath: deliveryPath,
          ...(pending ? { replacedInvitationId: pending.id } : {}),
        },
      }),
    );
    return Object.freeze({ invitation: invitationView(inserted!), token });
  });
}

export async function acceptPartnerInvitation<HKT extends PgQueryResultHKT>(
  database: InvitationDatabase<HKT>,
  input: {
    readonly actorId: string;
    readonly correlationId: string;
    readonly now?: Date;
  } & ({ readonly token: string } | { readonly invitationId: string }),
): Promise<{ readonly weddingId: string; readonly replayed: boolean }> {
  if (
    "token" in input &&
    (input.token.length < 32 || input.token.length > 256)
  ) {
    throw new WeddingInvitationUnavailableError("invalid");
  }
  return database.transaction(async (transaction) => {
    const now = input.now ?? new Date();
    const [invitation] = await transaction
      .select()
      .from(weddingInvitations)
      .where(
        "token" in input
          ? eq(weddingInvitations.tokenDigest, digest(input.token))
          : eq(weddingInvitations.id, input.invitationId),
      )
      .limit(1)
      .for("update");
    if (!invitation) throw new WeddingInvitationUnavailableError("invalid");
    if (
      invitation.status === "accepted" &&
      invitation.acceptedByActorId === input.actorId
    ) {
      return Object.freeze({ weddingId: invitation.weddingId, replayed: true });
    }
    if (invitation.status !== "pending") {
      throw new WeddingInvitationUnavailableError("already_claimed");
    }
    if (invitation.expiresAt.getTime() <= now.getTime()) {
      throw new WeddingInvitationUnavailableError("expired");
    }
    const [account] = await transaction
      .select({ email: user.email, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, input.actorId))
      .limit(1);
    if (!account?.emailVerified) {
      throw new WeddingInvitationUnavailableError("email_unverified");
    }
    if (account.email.trim().toLowerCase() !== invitation.invitedEmail) {
      throw new WeddingInvitationUnavailableError("email_mismatch");
    }
    await transaction
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, invitation.weddingId))
      .for("update");
    const [partners] = await transaction
      .select({ value: count() })
      .from(weddingMemberships)
      .where(
        and(
          eq(weddingMemberships.weddingId, invitation.weddingId),
          eq(weddingMemberships.role, "partner"),
          eq(weddingMemberships.status, "active"),
        ),
      );
    if ((partners?.value ?? 0) >= 2) {
      throw new WeddingInvitationConflictError("partner_exists");
    }
    const [existingMembership] = await transaction
      .select({ id: weddingMemberships.id })
      .from(weddingMemberships)
      .where(
        and(
          eq(weddingMemberships.weddingId, invitation.weddingId),
          eq(weddingMemberships.actorId, input.actorId),
        ),
      )
      .limit(1);
    if (existingMembership) {
      throw new WeddingInvitationUnavailableError("already_claimed");
    }
    const [membership] = await transaction
      .insert(weddingMemberships)
      .values({
        weddingId: invitation.weddingId,
        actorId: input.actorId,
        role: "partner",
        status: "active",
        accessExpiresAt: null,
        permissionOverrides: [],
        permissionScopeVersion: 1,
        lastOpenedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: weddingMemberships.id });
    if (!membership) {
      throw new WeddingInvitationUnavailableError("already_claimed");
    }
    const [accepted] = await transaction
      .update(weddingInvitations)
      .set({
        status: "accepted",
        acceptedByActorId: input.actorId,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingInvitations.id, invitation.id),
          eq(weddingInvitations.status, "pending"),
        ),
      )
      .returning({ id: weddingInvitations.id });
    if (!accepted)
      throw new WeddingInvitationUnavailableError("already_claimed");

    const claim = authorizeWeddingInvitationClaim({
      actorId: input.actorId,
      correlationId: input.correlationId,
      invitationId: invitation.id,
      weddingId: invitation.weddingId,
    });
    const authorization = await consumeAuthorizedWeddingInvitationClaim(claim);
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      authorization,
      transaction,
      createAuditEventEnvelope(authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_accepted",
        schemaVersion: 1,
        occurredAt,
        subjectType: "wedding_invitation",
        subjectId: invitation.id,
        metadata: { role: "partner" },
      }),
    );
    await appendAuthorizedOutboxEvent(
      authorization,
      transaction,
      createOutboxEventEnvelope(authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_accepted",
        schemaVersion: 1,
        occurredAt,
        payload: {
          invitationId: invitation.id,
          weddingId: invitation.weddingId,
        },
      }),
    );
    return Object.freeze({ weddingId: invitation.weddingId, replayed: false });
  });
}

export async function revokePartnerInvitation<HKT extends PgQueryResultHKT>(
  database: InvitationDatabase<HKT>,
  operation: AuthorizedServerOperation,
  invitationId: string,
  now = new Date(),
): Promise<boolean> {
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const weddingId = call.authorization.activeWeddingId!;
    const [revoked] = await call.session
      .update(weddingInvitations)
      .set({ status: "revoked", revokedAt: now, updatedAt: now })
      .where(
        and(
          eq(weddingInvitations.id, invitationId),
          eq(weddingInvitations.weddingId, weddingId),
          eq(weddingInvitations.status, "pending"),
        ),
      )
      .returning({ id: weddingInvitations.id });
    if (!revoked) return false;
    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_revoked",
        schemaVersion: 1,
        occurredAt,
        subjectType: "wedding_invitation",
        subjectId: invitationId,
        metadata: { role: "partner" },
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.partner_invitation_revoked",
        schemaVersion: 1,
        occurredAt,
        payload: { invitationId, weddingId },
      }),
    );
    return true;
  });
}
