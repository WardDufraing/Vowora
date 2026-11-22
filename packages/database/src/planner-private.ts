import { createHash } from "node:crypto";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  consumeAuthorizedOrganizationHandover,
  consumeAuthorizedOrganizationPrivateNote,
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuthorizedOrganizationHandover,
  type AuthorizedOrganizationPrivateNote,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
} from "./audit-outbox.js";
import {
  auditEvents,
  organizationMemberships,
  organizationPrivateNotes,
  outboxEvents,
  planningTasks,
  weddingOrganizationAccesses,
  weddingOrganizationHandovers,
  weddingOrganizationInvitations,
  weddingOrganizationStaffAssignments,
} from "./schema.js";
import { createUuidV7 } from "./uuid.js";

type Schema = {
  auditEvents: typeof auditEvents;
  organizationMemberships: typeof organizationMemberships;
  organizationPrivateNotes: typeof organizationPrivateNotes;
  outboxEvents: typeof outboxEvents;
  planningTasks: typeof planningTasks;
  weddingOrganizationAccesses: typeof weddingOrganizationAccesses;
  weddingOrganizationHandovers: typeof weddingOrganizationHandovers;
  weddingOrganizationInvitations: typeof weddingOrganizationInvitations;
  weddingOrganizationStaffAssignments: typeof weddingOrganizationStaffAssignments;
};
export type PlannerPrivateDatabase<
  HKT extends PgQueryResultHKT = PgQueryResultHKT,
> = PgDatabase<HKT, Schema>;

export class PlannerPrivateUnavailableError extends Error {
  constructor(
    readonly reason: "invalid" | "access_denied" | "conflict" | "stale",
  ) {
    super("The planner-private operation is unavailable");
    this.name = "PlannerPrivateUnavailableError";
  }
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function text(value: string, max: number) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max)
    throw new PlannerPrivateUnavailableError("invalid");
  return trimmed;
}
function noteView(
  row: typeof organizationPrivateNotes.$inferSelect,
  member: typeof organizationMemberships.$inferSelect,
) {
  return Object.freeze({
    id: row.id,
    weddingId: row.weddingId,
    title: row.title,
    body: row.body,
    status: row.status as "active" | "archived",
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    editable:
      row.status === "active" &&
      (member.role === "owner" ||
        member.role === "manager" ||
        row.createdByMembershipId === member.id),
  });
}

async function unresolvedAssignedTasks<HKT extends PgQueryResultHKT>(
  database: PlannerPrivateDatabase<HKT>,
  weddingId: string,
  membershipIds: readonly string[],
) {
  if (membershipIds.length === 0) return 0;
  const [row] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(planningTasks)
    .where(
      and(
        eq(planningTasks.weddingId, weddingId),
        inArray(planningTasks.ownerMembershipId, membershipIds),
        eq(planningTasks.lifecycle, "active"),
        ne(planningTasks.status, "complete"),
      ),
    );
  return row?.count ?? 0;
}

async function lockedMembership<HKT extends PgQueryResultHKT>(
  database: PlannerPrivateDatabase<HKT>,
  actorId: string,
  organizationId: string,
) {
  const [row] = await database
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.actorId, actorId),
      ),
    )
    .for("update")
    .limit(1);
  if (!row || row.status !== "active")
    throw new PlannerPrivateUnavailableError("access_denied");
  return row;
}

async function facts(
  authorization: Parameters<typeof appendAuthorizedAuditEvent>[0],
  session: Parameters<typeof appendAuthorizedAuditEvent>[1],
  eventType: string,
  subjectType: string,
  subjectId: string,
  metadata: Record<string, unknown>,
  now: Date,
) {
  const occurredAt = now.toISOString();
  await appendAuthorizedAuditEvent(
    authorization,
    session,
    createAuditEventEnvelope(authorization, {
      eventId: createUuidV7(),
      eventType,
      schemaVersion: 1,
      occurredAt,
      subjectType,
      subjectId,
      metadata,
    }),
  );
  await appendAuthorizedOutboxEvent(
    authorization,
    session,
    createOutboxEventEnvelope(authorization, {
      eventId: createUuidV7(),
      eventType,
      schemaVersion: 1,
      occurredAt,
      payload: { subjectId, ...metadata },
    }),
  );
}

export async function listOrganizationPrivateNotes<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerPrivateDatabase<HKT>,
  command: AuthorizedOrganizationPrivateNote,
) {
  if (command.action !== "list") {
    throw new PlannerPrivateUnavailableError("invalid");
  }
  return database.transaction(async (transaction) => {
    const member = await lockedMembership(
      transaction,
      command.actorId,
      command.organizationId,
    );
    await consumeAuthorizedOrganizationPrivateNote(
      command,
      member.permissionScopeVersion,
    );
    const rows = await transaction
      .select()
      .from(organizationPrivateNotes)
      .where(
        eq(organizationPrivateNotes.organizationId, command.organizationId),
      )
      .orderBy(sql`${organizationPrivateNotes.updatedAt} DESC`);
    return rows.map((row) => noteView(row, member));
  });
}

export async function createOrganizationPrivateNote<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerPrivateDatabase<HKT>,
  command: AuthorizedOrganizationPrivateNote,
  input: { title: string; body: string; weddingId?: string },
  now = new Date(),
) {
  if (command.action !== "create") {
    throw new PlannerPrivateUnavailableError("invalid");
  }
  return database.transaction(async (transaction) => {
    const member = await lockedMembership(
      transaction,
      command.actorId,
      command.organizationId,
    );
    const consumed = await consumeAuthorizedOrganizationPrivateNote(
      command,
      member.permissionScopeVersion,
    );
    if (input.weddingId) {
      const [access] = await transaction
        .select({ id: weddingOrganizationAccesses.id })
        .from(weddingOrganizationAccesses)
        .where(
          and(
            eq(
              weddingOrganizationAccesses.organizationId,
              command.organizationId,
            ),
            eq(weddingOrganizationAccesses.weddingId, input.weddingId),
            eq(weddingOrganizationAccesses.status, "active"),
          ),
        )
        .limit(1);
      if (!access) throw new PlannerPrivateUnavailableError("access_denied");
    }
    const [row] = await transaction
      .insert(organizationPrivateNotes)
      .values({
        organizationId: command.organizationId,
        weddingId: input.weddingId,
        createdByMembershipId: member.id,
        title: text(input.title, 160),
        body: text(input.body, 20_000),
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await facts(
      consumed.authorization,
      transaction,
      "organization.private_note_created",
      "organization_private_note",
      row!.id,
      { weddingLinked: Boolean(input.weddingId) },
      now,
    );
    return noteView(row!, member);
  });
}

export async function updateOrganizationPrivateNote<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerPrivateDatabase<HKT>,
  command: AuthorizedOrganizationPrivateNote,
  input: { noteId: string; title?: string; body?: string; archive?: boolean },
  now = new Date(),
) {
  if (command.noteId !== input.noteId) {
    throw new PlannerPrivateUnavailableError("access_denied");
  }
  if ((command.action === "archive") !== Boolean(input.archive)) {
    throw new PlannerPrivateUnavailableError("invalid");
  }
  return database.transaction(async (transaction) => {
    const member = await lockedMembership(
      transaction,
      command.actorId,
      command.organizationId,
    );
    const consumed = await consumeAuthorizedOrganizationPrivateNote(
      command,
      member.permissionScopeVersion,
    );
    const [note] = await transaction
      .select()
      .from(organizationPrivateNotes)
      .where(
        and(
          eq(organizationPrivateNotes.id, input.noteId),
          eq(organizationPrivateNotes.organizationId, command.organizationId),
        ),
      )
      .for("update")
      .limit(1);
    if (!note) throw new PlannerPrivateUnavailableError("access_denied");
    const manager = member.role === "owner" || member.role === "manager";
    if (!manager && note.createdByMembershipId !== member.id)
      throw new PlannerPrivateUnavailableError("access_denied");
    if (note.status === "archived")
      throw new PlannerPrivateUnavailableError("stale");
    const [row] = await transaction
      .update(organizationPrivateNotes)
      .set({
        ...(input.title === undefined ? {} : { title: text(input.title, 160) }),
        ...(input.body === undefined ? {} : { body: text(input.body, 20_000) }),
        ...(input.archive ? { status: "archived", archivedAt: now } : {}),
        updatedAt: now,
      })
      .where(eq(organizationPrivateNotes.id, note.id))
      .returning();
    await facts(
      consumed.authorization,
      transaction,
      input.archive
        ? "organization.private_note_archived"
        : "organization.private_note_updated",
      "organization_private_note",
      note.id,
      { archived: Boolean(input.archive) },
      now,
    );
    return noteView(row!, member);
  });
}

export async function completeOrganizationWeddingExit<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerPrivateDatabase<HKT>,
  command: AuthorizedOrganizationHandover,
  now = new Date(),
) {
  return database.transaction(async (transaction) => {
    const [access] = await transaction
      .select()
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.id, command.accessId),
          eq(
            weddingOrganizationAccesses.organizationId,
            command.organizationId,
          ),
        ),
      )
      .for("update")
      .limit(1);
    if (!access) throw new PlannerPrivateUnavailableError("access_denied");
    const member = await lockedMembership(
      transaction,
      command.actorId,
      command.organizationId,
    );
    if (member.role !== "owner" && member.role !== "manager")
      throw new PlannerPrivateUnavailableError("access_denied");
    const consumed = await consumeAuthorizedOrganizationHandover(
      command,
      member.permissionScopeVersion,
      access.weddingId,
    );
    const requestFingerprint = fingerprint({
      accessId: command.accessId,
      mode: command.mode,
    });
    const [replay] = await transaction
      .select()
      .from(weddingOrganizationHandovers)
      .where(
        and(
          eq(
            weddingOrganizationHandovers.organizationId,
            command.organizationId,
          ),
          eq(weddingOrganizationHandovers.initiatedByMembershipId, member.id),
          eq(weddingOrganizationHandovers.requestId, command.requestId),
        ),
      )
      .limit(1);
    if (replay) {
      if (replay.requestFingerprint !== requestFingerprint)
        throw new PlannerPrivateUnavailableError("conflict");
      return Object.freeze({
        id: replay.id,
        replayed: true,
        snapshot: replay.snapshot,
      });
    }
    if (access.status !== "active")
      throw new PlannerPrivateUnavailableError("stale");
    const assignments = await transaction
      .select({
        id: weddingOrganizationStaffAssignments.id,
        isLead: weddingOrganizationStaffAssignments.isLead,
        weddingMembershipId:
          weddingOrganizationStaffAssignments.weddingMembershipId,
      })
      .from(weddingOrganizationStaffAssignments)
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      );
    const [pending] = await transaction
      .select({ count: sql<number>`count(*)::int` })
      .from(weddingOrganizationInvitations)
      .where(
        and(
          eq(weddingOrganizationInvitations.weddingId, access.weddingId),
          eq(
            weddingOrganizationInvitations.organizationId,
            access.organizationId,
          ),
          eq(weddingOrganizationInvitations.status, "pending"),
        ),
      );
    const snapshot = {
      accessId: access.id,
      weddingId: access.weddingId,
      activeAssignmentCount: assignments.length,
      leadAssigned: assignments.some((item) => item.isLead),
      pendingInvitationCount: pending?.count ?? 0,
      unresolvedResponsibilityCount: await unresolvedAssignedTasks(
        transaction,
        access.weddingId,
        assignments.map((item) => item.weddingMembershipId),
      ),
      sharedDataRetained: true,
      privateNotesRetainedByOrganization: true,
    };
    const [handover] = await transaction
      .insert(weddingOrganizationHandovers)
      .values({
        accessId: access.id,
        organizationId: access.organizationId,
        weddingId: access.weddingId,
        initiatedByMembershipId: member.id,
        mode: command.mode,
        requestId: command.requestId,
        requestFingerprint,
        snapshot,
        completedAt: now,
        createdAt: now,
      })
      .returning();
    await transaction
      .update(weddingOrganizationAccesses)
      .set({
        status: "revoked",
        revokedByActorId: command.actorId,
        revokedAt: now,
        permissionScopeVersion: sql`${weddingOrganizationAccesses.permissionScopeVersion} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingOrganizationAccesses.id, access.id),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      );
    await transaction
      .update(weddingOrganizationStaffAssignments)
      .set({
        status: "revoked",
        isLead: false,
        revokedAt: now,
        permissionScopeVersion: sql`${weddingOrganizationStaffAssignments.permissionScopeVersion} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      );
    await facts(
      consumed.authorization,
      transaction,
      "wedding.organization_handover_completed",
      "wedding_organization_handover",
      handover!.id,
      {
        weddingId: access.weddingId,
        accessId: access.id,
        mode: command.mode,
        affectedStaff: assignments.length,
        notifyPartners: true,
      },
      now,
    );
    return Object.freeze({ id: handover!.id, replayed: false, snapshot });
  });
}

export async function previewOrganizationWeddingExit<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerPrivateDatabase<HKT>,
  command: AuthorizedOrganizationHandover,
) {
  return database.transaction(async (transaction) => {
    const [access] = await transaction
      .select()
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.id, command.accessId),
          eq(
            weddingOrganizationAccesses.organizationId,
            command.organizationId,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .limit(1);
    const member = await lockedMembership(
      transaction,
      command.actorId,
      command.organizationId,
    );
    if (!access || (member.role !== "owner" && member.role !== "manager"))
      throw new PlannerPrivateUnavailableError("access_denied");
    await consumeAuthorizedOrganizationHandover(
      command,
      member.permissionScopeVersion,
      access.weddingId,
    );
    const assignments = await transaction
      .select({
        isLead: weddingOrganizationStaffAssignments.isLead,
        weddingMembershipId:
          weddingOrganizationStaffAssignments.weddingMembershipId,
      })
      .from(weddingOrganizationStaffAssignments)
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      );
    const [pending] = await transaction
      .select({ count: sql<number>`count(*)::int` })
      .from(weddingOrganizationInvitations)
      .where(
        and(
          eq(weddingOrganizationInvitations.weddingId, access.weddingId),
          eq(
            weddingOrganizationInvitations.organizationId,
            access.organizationId,
          ),
          eq(weddingOrganizationInvitations.status, "pending"),
        ),
      );
    return Object.freeze({
      accessId: access.id,
      weddingId: access.weddingId,
      activeAssignmentCount: assignments.length,
      leadAssigned: assignments.some((item) => item.isLead),
      pendingInvitationCount: pending?.count ?? 0,
      unresolvedResponsibilityCount: await unresolvedAssignedTasks(
        transaction,
        access.weddingId,
        assignments.map((item) => item.weddingMembershipId),
      ),
      sharedDataRetained: true,
      privateNotesRetainedByOrganization: true,
    });
  });
}
