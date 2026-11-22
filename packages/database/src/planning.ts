import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  evaluateWeddingRecordPermission,
  parseWeddingMembership,
  type AuthorizedServerOperation,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
} from "./audit-outbox.js";
import {
  milestonePhases,
  planningMilestones,
  planningTasks,
  taskPhases,
  user,
  weddingMemberships,
} from "./schema.js";
import {
  assertAuthorizedRepositoryCall,
  type AuthorizedTenantTransaction,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
import { createUuidV7 } from "./uuid.js";
import {
  DatabaseWeddingAuthorizationState,
  type WeddingDatabase,
} from "./weddings.js";

export type PlanningDatabase<HKT extends PgQueryResultHKT = PgQueryResultHKT> =
  WeddingDatabase<HKT>;

export type PlanningTaskStatus =
  "not_started" | "in_progress" | "blocked" | "complete";
export type PlanningMilestoneStatus =
  "not_started" | "in_progress" | "complete";

export class PlanningUnavailableError extends Error {
  constructor(readonly reason: "access_denied" | "conflict" | "invalid") {
    super("The planning operation is unavailable");
    this.name = "PlanningUnavailableError";
  }
}

function clean(value: string | null, maximum: number) {
  if (value === null) return null;
  const result = value.trim();
  if (result.length > maximum) throw new PlanningUnavailableError("invalid");
  return result || null;
}

function title(value: string, maximum: number) {
  const result = value.trim();
  if (!result || result.length > maximum)
    throw new PlanningUnavailableError("invalid");
  return result;
}

async function emit<HKT extends PgQueryResultHKT>(
  call: AuthorizedTenantTransaction<PlanningDatabase<HKT>>,
  eventType: string,
  subjectType: string,
  subjectId: string,
  metadata: Record<string, unknown>,
  now: Date,
) {
  const occurredAt = now.toISOString();
  await appendAuthorizedAuditEvent(
    call.authorization,
    call.session,
    createAuditEventEnvelope(call.authorization, {
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
    call.authorization,
    call.session,
    createOutboxEventEnvelope(call.authorization, {
      eventId: createUuidV7(),
      eventType,
      schemaVersion: 1,
      occurredAt,
      payload: { subjectId, ...metadata },
    }),
  );
}

function taskView(
  row: typeof planningTasks.$inferSelect,
  owner: { id: string; name: string } | null,
  editable: boolean,
) {
  return Object.freeze({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate,
    phaseId: row.phaseId,
    owner: owner ? { membershipId: owner.id, name: owner.name } : null,
    status: row.status as PlanningTaskStatus,
    blockedReason: row.blockedReason,
    lifecycle: row.lifecycle as "active" | "archived",
    completedAt: row.completedAt?.toISOString() ?? null,
    version: row.version,
    editable,
  });
}

function milestoneView(
  row: typeof planningMilestones.$inferSelect,
  editable: boolean,
) {
  return Object.freeze({
    id: row.id,
    title: row.title,
    description: row.description,
    plannedDate: row.plannedDate,
    phaseId: row.phaseId,
    status: row.status as PlanningMilestoneStatus,
    lifecycle: row.lifecycle as "active" | "trashed",
    version: row.version,
    editable,
  });
}

async function ownerFor<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  ownerMembershipId: string | null,
) {
  if (!ownerMembershipId) return null;
  const [row] = await database
    .select({ id: weddingMemberships.id, name: user.name })
    .from(weddingMemberships)
    .innerJoin(user, eq(user.id, weddingMemberships.actorId))
    .where(eq(weddingMemberships.id, ownerMembershipId))
    .limit(1);
  return row ?? null;
}

function permission(
  membership: ReturnType<typeof parseWeddingMembership>,
  actorId: string,
  weddingId: string,
  action: "view" | "edit",
  relationship: "workspace" | "assigned" | "new_record",
) {
  return evaluateWeddingRecordPermission(membership, {
    actorId,
    weddingId,
    area: "tasks",
    action,
    relationship,
    visibility: "wedding_shared",
  }).allowed;
}

/** Collection reads are filtered per record because scoped helpers may view
 * assigned tasks without receiving workspace-wide task visibility. */
export async function listPlanningWorkspace<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  input: {
    actorId: string;
    weddingId: string;
    taskCursor?: string;
    milestoneCursor?: string;
    limit?: number;
  },
) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const state = new DatabaseWeddingAuthorizationState(database);
  const loaded = await state.loadWeddingMembership(input);
  if (!loaded) throw new PlanningUnavailableError("access_denied");
  let membership;
  try {
    membership = parseWeddingMembership(loaded.membership);
  } catch {
    throw new PlanningUnavailableError("access_denied");
  }
  const canViewWorkspace = permission(
    membership,
    input.actorId,
    input.weddingId,
    "view",
    "workspace",
  );
  const canEditWorkspace = permission(
    membership,
    input.actorId,
    input.weddingId,
    "edit",
    "workspace",
  );
  const [{ id: membershipIdForActor } = { id: "" }] = await database
    .select({ id: weddingMemberships.id })
    .from(weddingMemberships)
    .where(
      and(
        eq(weddingMemberships.weddingId, input.weddingId),
        eq(weddingMemberships.actorId, input.actorId),
      ),
    )
    .limit(1);
  const taskScope = canViewWorkspace
    ? eq(planningTasks.weddingId, input.weddingId)
    : and(
        eq(planningTasks.weddingId, input.weddingId),
        eq(planningTasks.ownerMembershipId, membershipIdForActor),
      );
  const rows = await database
    .select({
      task: planningTasks,
      ownerId: weddingMemberships.id,
      ownerName: user.name,
    })
    .from(planningTasks)
    .leftJoin(
      weddingMemberships,
      eq(weddingMemberships.id, planningTasks.ownerMembershipId),
    )
    .leftJoin(user, eq(user.id, weddingMemberships.actorId))
    .where(
      input.taskCursor
        ? and(taskScope, gt(planningTasks.id, input.taskCursor))
        : taskScope,
    )
    .orderBy(asc(planningTasks.id))
    .limit(limit + 1);
  const tasks = rows.slice(0, limit).flatMap(({ task, ownerId, ownerName }) => {
    const assigned = ownerId !== null && ownerId === membershipIdForActor;
    const relationship = assigned ? "assigned" : "workspace";
    if (
      !permission(
        membership,
        input.actorId,
        input.weddingId,
        "view",
        relationship,
      )
    )
      return [];
    return [
      taskView(
        task,
        ownerId && ownerName ? { id: ownerId, name: ownerName } : null,
        permission(
          membership,
          input.actorId,
          input.weddingId,
          "edit",
          relationship,
        ),
      ),
    ];
  });

  const milestoneRows = canViewWorkspace
    ? await database
        .select()
        .from(planningMilestones)
        .where(
          input.milestoneCursor
            ? and(
                eq(planningMilestones.weddingId, input.weddingId),
                gt(planningMilestones.id, input.milestoneCursor),
              )
            : eq(planningMilestones.weddingId, input.weddingId),
        )
        .orderBy(asc(planningMilestones.id))
        .limit(limit + 1)
    : [];
  const taskPhaseRows = canViewWorkspace
    ? await database
        .select()
        .from(taskPhases)
        .where(eq(taskPhases.weddingId, input.weddingId))
        .orderBy(asc(taskPhases.position), asc(taskPhases.name))
        .limit(200)
    : [];
  const milestonePhaseRows = canViewWorkspace
    ? await database
        .select()
        .from(milestonePhases)
        .where(eq(milestonePhases.weddingId, input.weddingId))
        .orderBy(asc(milestonePhases.position), asc(milestonePhases.name))
        .limit(200)
    : [];
  const memberRows = canViewWorkspace
    ? await database
        .select({ membershipId: weddingMemberships.id, name: user.name })
        .from(weddingMemberships)
        .innerJoin(user, eq(user.id, weddingMemberships.actorId))
        .where(
          and(
            eq(weddingMemberships.weddingId, input.weddingId),
            eq(weddingMemberships.status, "active"),
          ),
        )
        .orderBy(asc(user.name))
        .limit(200)
    : [];
  return Object.freeze({
    taskPhases: taskPhaseRows.map((phase) => ({
      id: phase.id,
      name: phase.name,
      position: phase.position,
      version: phase.version,
    })),
    milestonePhases: milestonePhaseRows.map((phase) => ({
      id: phase.id,
      name: phase.name,
      kind: phase.kind as "suggested" | "custom",
      hidden: phase.status === "hidden",
      lifecycle: phase.status === "trashed" ? "trashed" : "active",
      position: phase.position,
      version: phase.version,
    })),
    tasks,
    milestones: milestoneRows
      .slice(0, limit)
      .map((row) => milestoneView(row, canEditWorkspace)),
    assignableMembers: memberRows,
    canEdit: canEditWorkspace,
    page: {
      nextTaskCursor: rows.length > limit ? rows[limit - 1]!.task.id : null,
      nextMilestoneCursor:
        milestoneRows.length > limit ? milestoneRows[limit - 1]!.id : null,
    },
  });
}

export type CreatePlanningInput =
  | { kind: "task_phase"; name: string; position: number }
  | { kind: "milestone_phase"; name: string; position: number }
  | {
      kind: "task";
      title: string;
      description: string | null;
      dueDate: string | null;
      phaseId: string | null;
      ownerMembershipId: string | null;
    }
  | {
      kind: "milestone";
      title: string;
      description: string | null;
      plannedDate: string;
      phaseId: string | null;
    };

async function assertCreateScope<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  actorId: string,
  weddingId: string,
  input: CreatePlanningInput,
) {
  const loaded = await new DatabaseWeddingAuthorizationState(
    database,
  ).loadWeddingMembership({ actorId, weddingId });
  if (!loaded) throw new PlanningUnavailableError("access_denied");
  const membership = parseWeddingMembership(loaded.membership);
  if (permission(membership, actorId, weddingId, "edit", "workspace")) return;
  if (input.kind !== "task" || !input.ownerMembershipId || input.phaseId)
    throw new PlanningUnavailableError("access_denied");
  const [ownMembership] = await database
    .select({ id: weddingMemberships.id })
    .from(weddingMemberships)
    .where(
      and(
        eq(weddingMemberships.id, input.ownerMembershipId),
        eq(weddingMemberships.weddingId, weddingId),
        eq(weddingMemberships.actorId, actorId),
        eq(weddingMemberships.status, "active"),
      ),
    )
    .limit(1);
  if (!ownMembership) throw new PlanningUnavailableError("access_denied");
}

async function assertTaskUpdateScope<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  actorId: string,
  weddingId: string,
  previous: typeof planningTasks.$inferSelect,
  input: Extract<UpdatePlanningInput, { kind: "task" }>,
) {
  const loaded = await new DatabaseWeddingAuthorizationState(
    database,
  ).loadWeddingMembership({ actorId, weddingId });
  if (!loaded) throw new PlanningUnavailableError("access_denied");
  const membership = parseWeddingMembership(loaded.membership);
  if (permission(membership, actorId, weddingId, "edit", "workspace")) return;
  const [ownMembership] = await database
    .select({ id: weddingMemberships.id })
    .from(weddingMemberships)
    .where(
      and(
        eq(weddingMemberships.weddingId, weddingId),
        eq(weddingMemberships.actorId, actorId),
        eq(weddingMemberships.status, "active"),
      ),
    )
    .limit(1);
  if (
    !ownMembership ||
    previous.ownerMembershipId !== ownMembership.id ||
    input.ownerMembershipId !== ownMembership.id ||
    input.phaseId !== previous.phaseId
  )
    throw new PlanningUnavailableError("access_denied");
}

async function assertPhase<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  weddingId: string,
  phaseId: string | null,
  kind: "task" | "milestone",
  currentPhaseId: string | null = null,
) {
  if (!phaseId) return;
  if (kind === "task") {
    const [phase] = await database
      .select({ id: taskPhases.id })
      .from(taskPhases)
      .where(
        and(eq(taskPhases.id, phaseId), eq(taskPhases.weddingId, weddingId)),
      )
      .limit(1);
    if (!phase) throw new PlanningUnavailableError("invalid");
    return;
  }
  const [phase] = await database
    .select({ id: milestonePhases.id, status: milestonePhases.status })
    .from(milestonePhases)
    .where(
      and(
        eq(milestonePhases.id, phaseId),
        eq(milestonePhases.weddingId, weddingId),
      ),
    )
    .limit(1);
  if (!phase || (phase.status !== "active" && phaseId !== currentPhaseId))
    throw new PlanningUnavailableError("invalid");
}

async function assertOwner<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  weddingId: string,
  membershipId: string | null,
) {
  if (!membershipId) return;
  const [owner] = await database
    .select({ id: weddingMemberships.id })
    .from(weddingMemberships)
    .where(
      and(
        eq(weddingMemberships.id, membershipId),
        eq(weddingMemberships.weddingId, weddingId),
        eq(weddingMemberships.status, "active"),
      ),
    )
    .limit(1);
  if (!owner) throw new PlanningUnavailableError("invalid");
}

export async function createPlanningRecord<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: CreatePlanningInput,
  now = new Date(),
) {
  const weddingId = operation.authorization.activeWeddingId;
  if (!weddingId) throw new PlanningUnavailableError("access_denied");
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "tasks",
      action: "edit",
      resource: { kind: "new" },
      visibility: "wedding_shared",
    });
    await assertCreateScope(
      call.session,
      operation.authorization.actorId,
      weddingId,
      input,
    );
    if (input.kind === "task_phase") {
      const [row] = await call.session
        .insert(taskPhases)
        .values({
          weddingId,
          name: title(input.name, 80),
          position: input.position,
        })
        .returning();
      await emit(
        call,
        "planning.task_phase_created",
        "task_phase",
        row!.id,
        { position: row!.position },
        now,
      );
      return {
        recordType: "task_phase" as const,
        id: row!.id,
        name: row!.name,
        position: row!.position,
        version: row!.version,
      };
    }
    if (input.kind === "milestone_phase") {
      const [row] = await call.session
        .insert(milestonePhases)
        .values({
          weddingId,
          name: title(input.name, 80),
          position: input.position,
          kind: "custom",
        })
        .returning();
      await emit(
        call,
        "planning.milestone_phase_created",
        "milestone_phase",
        row!.id,
        { position: row!.position },
        now,
      );
      return {
        recordType: "milestone_phase" as const,
        id: row!.id,
        name: row!.name,
        kind: "custom" as const,
        hidden: false,
        lifecycle: "active" as const,
        position: row!.position,
        version: row!.version,
      };
    }
    if (input.kind === "task") {
      await assertPhase(call.session, weddingId, input.phaseId, "task");
      await assertOwner(call.session, weddingId, input.ownerMembershipId);
      const [row] = await call.session
        .insert(planningTasks)
        .values({
          weddingId,
          title: title(input.title, 200),
          description: clean(input.description, 10_000),
          dueDate: input.dueDate,
          phaseId: input.phaseId,
          ownerMembershipId: input.ownerMembershipId,
        })
        .returning();
      await emit(
        call,
        "planning.task_created",
        "planning_task",
        row!.id,
        {
          ownerMembershipId: row!.ownerMembershipId,
          dueDate: row!.dueDate,
          version: row!.version,
        },
        now,
      );
      return {
        ...taskView(
          row!,
          await ownerFor(call.session, row!.ownerMembershipId),
          true,
        ),
        recordType: "task" as const,
      };
    }
    await assertPhase(call.session, weddingId, input.phaseId, "milestone");
    const [row] = await call.session
      .insert(planningMilestones)
      .values({
        weddingId,
        title: title(input.title, 200),
        description: clean(input.description, 10_000),
        plannedDate: input.plannedDate,
        phaseId: input.phaseId,
      })
      .returning();
    await emit(
      call,
      "planning.milestone_created",
      "planning_milestone",
      row!.id,
      { plannedDate: row!.plannedDate, version: row!.version },
      now,
    );
    return { ...milestoneView(row!, true), recordType: "milestone" as const };
  }).catch((error: unknown) => {
    if (error instanceof PlanningUnavailableError) throw error;
    if ((error as { code?: string }).code === "23505")
      throw new PlanningUnavailableError("conflict");
    throw error;
  });
}

export type UpdatePlanningInput =
  | {
      kind: "task_phase";
      expectedVersion: number;
      name: string;
      position: number;
    }
  | {
      kind: "milestone_phase";
      expectedVersion: number;
      name: string;
      position: number;
      hidden: boolean;
      lifecycle: "active" | "trashed";
    }
  | {
      kind: "task";
      expectedVersion: number;
      title: string;
      description: string | null;
      dueDate: string | null;
      phaseId: string | null;
      ownerMembershipId: string | null;
      status: PlanningTaskStatus;
      blockedReason: string | null;
      lifecycle: "active" | "archived";
    }
  | {
      kind: "milestone";
      expectedVersion: number;
      title: string;
      description: string | null;
      plannedDate: string;
      phaseId: string | null;
      status: PlanningMilestoneStatus;
      lifecycle: "active" | "trashed";
    };

export async function updatePlanningRecord<HKT extends PgQueryResultHKT>(
  database: PlanningDatabase<HKT>,
  operation: AuthorizedServerOperation,
  recordId: string,
  input: UpdatePlanningInput,
  now = new Date(),
) {
  const weddingId = operation.authorization.activeWeddingId;
  if (!weddingId || operation.resourceId !== recordId)
    throw new PlanningUnavailableError("access_denied");
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "tasks",
      action: "edit",
      resource: { kind: "existing", id: recordId },
      visibility: "wedding_shared",
    });
    if (input.kind === "task_phase") {
      const [row] = await call.session
        .update(taskPhases)
        .set({
          name: title(input.name, 80),
          position: input.position,
          version: input.expectedVersion + 1,
          updatedAt: now,
        })
        .where(
          and(
            eq(taskPhases.id, recordId),
            eq(taskPhases.weddingId, weddingId),
            eq(taskPhases.version, input.expectedVersion),
          ),
        )
        .returning();
      if (!row) throw new PlanningUnavailableError("conflict");
      await emit(
        call,
        "planning.task_phase_updated",
        "task_phase",
        row.id,
        { version: row.version },
        now,
      );
      return {
        recordType: "task_phase" as const,
        id: row.id,
        name: row.name,
        position: row.position,
        version: row.version,
      };
    }
    if (input.kind === "milestone_phase") {
      const [previous] = await call.session
        .select()
        .from(milestonePhases)
        .where(
          and(
            eq(milestonePhases.id, recordId),
            eq(milestonePhases.weddingId, weddingId),
          ),
        )
        .for("update")
        .limit(1);
      if (!previous || previous.version !== input.expectedVersion)
        throw new PlanningUnavailableError("conflict");
      if (
        (previous.kind === "suggested" && input.lifecycle !== "active") ||
        (previous.kind === "custom" && input.hidden)
      )
        throw new PlanningUnavailableError("invalid");
      const nextStatus =
        previous.kind === "suggested"
          ? input.hidden
            ? "hidden"
            : "active"
          : input.lifecycle;
      const [row] = await call.session
        .update(milestonePhases)
        .set({
          name: title(input.name, 80),
          position: input.position,
          status: nextStatus,
          trashedAt:
            nextStatus === "trashed" ? (previous.trashedAt ?? now) : null,
          version: input.expectedVersion + 1,
          updatedAt: now,
        })
        .where(
          and(
            eq(milestonePhases.id, recordId),
            eq(milestonePhases.weddingId, weddingId),
            eq(milestonePhases.version, input.expectedVersion),
          ),
        )
        .returning();
      if (!row) throw new PlanningUnavailableError("conflict");
      let affectedMilestones = 0;
      if (previous.kind === "custom" && previous.status !== row.status) {
        if (row.status === "trashed") {
          const unassigned = await call.session
            .update(planningMilestones)
            .set({
              phaseId: null,
              restorablePhaseId: row.id,
              version: sql`${planningMilestones.version} + 1`,
              updatedAt: now,
            })
            .where(
              and(
                eq(planningMilestones.weddingId, weddingId),
                eq(planningMilestones.phaseId, row.id),
              ),
            )
            .returning({ id: planningMilestones.id });
          affectedMilestones = unassigned.length;
        } else {
          const restored = await call.session
            .update(planningMilestones)
            .set({
              phaseId: row.id,
              restorablePhaseId: null,
              version: sql`${planningMilestones.version} + 1`,
              updatedAt: now,
            })
            .where(
              and(
                eq(planningMilestones.weddingId, weddingId),
                eq(planningMilestones.restorablePhaseId, row.id),
                isNull(planningMilestones.phaseId),
              ),
            )
            .returning({ id: planningMilestones.id });
          affectedMilestones = restored.length;
          await call.session
            .update(planningMilestones)
            .set({ restorablePhaseId: null, updatedAt: now })
            .where(
              and(
                eq(planningMilestones.weddingId, weddingId),
                eq(planningMilestones.restorablePhaseId, row.id),
              ),
            );
        }
      }
      await emit(
        call,
        previous.status !== row.status && previous.kind === "custom"
          ? `planning.milestone_phase_${row.status === "trashed" ? "trashed" : "restored"}`
          : "planning.milestone_phase_updated",
        "milestone_phase",
        row.id,
        {
          hidden: row.status === "hidden",
          lifecycle: row.status === "trashed" ? "trashed" : "active",
          affectedMilestones,
          version: row.version,
        },
        now,
      );
      return {
        recordType: "milestone_phase" as const,
        id: row.id,
        name: row.name,
        kind: row.kind as "suggested" | "custom",
        hidden: row.status === "hidden",
        lifecycle: row.status === "trashed" ? "trashed" : "active",
        position: row.position,
        version: row.version,
      };
    }
    if (input.kind === "task") {
      if (input.status !== "blocked" && input.blockedReason !== null)
        throw new PlanningUnavailableError("invalid");
      await assertPhase(call.session, weddingId, input.phaseId, "task");
      await assertOwner(call.session, weddingId, input.ownerMembershipId);
      const [previous] = await call.session
        .select()
        .from(planningTasks)
        .where(
          and(
            eq(planningTasks.id, recordId),
            eq(planningTasks.weddingId, weddingId),
          ),
        )
        .for("update")
        .limit(1);
      if (!previous || previous.version !== input.expectedVersion)
        throw new PlanningUnavailableError("conflict");
      await assertTaskUpdateScope(
        call.session,
        operation.authorization.actorId,
        weddingId,
        previous,
        input,
      );
      const [row] = await call.session
        .update(planningTasks)
        .set({
          title: title(input.title, 200),
          description: clean(input.description, 10_000),
          dueDate: input.dueDate,
          phaseId: input.phaseId,
          ownerMembershipId: input.ownerMembershipId,
          status: input.status,
          blockedReason: input.blockedReason,
          lifecycle: input.lifecycle,
          archivedAt:
            input.lifecycle === "archived"
              ? (previous.archivedAt ?? now)
              : null,
          completedAt:
            input.status === "complete" ? (previous.completedAt ?? now) : null,
          version: input.expectedVersion + 1,
          updatedAt: now,
        })
        .where(
          and(
            eq(planningTasks.id, recordId),
            eq(planningTasks.version, input.expectedVersion),
          ),
        )
        .returning();
      if (!row) throw new PlanningUnavailableError("conflict");
      const events: Array<[string, Record<string, unknown>]> = [];
      if (previous.status !== "complete" && row.status === "complete")
        events.push(["planning.task_completed", { notify: false }]);
      if (previous.status === "complete" && row.status !== "complete")
        events.push(["planning.task_reopened", { notify: false }]);
      if (previous.lifecycle !== row.lifecycle)
        events.push([
          `planning.task_${row.lifecycle === "archived" ? "archived" : "restored"}`,
          { previousLifecycle: previous.lifecycle, lifecycle: row.lifecycle },
        ]);
      if (previous.ownerMembershipId !== row.ownerMembershipId)
        events.push([
          "planning.task_assignment_changed",
          {
            previousOwnerMembershipId: previous.ownerMembershipId,
            ownerMembershipId: row.ownerMembershipId,
            notifyOwnerMembershipId: row.ownerMembershipId,
          },
        ]);
      if (previous.dueDate !== row.dueDate)
        events.push([
          "planning.task_due_date_changed",
          {
            previousDueDate: previous.dueDate,
            dueDate: row.dueDate,
            notifyOwnerMembershipId: row.ownerMembershipId,
          },
        ]);
      if (events.length === 0)
        events.push([
          "planning.task_updated",
          { previousStatus: previous.status, status: row.status },
        ]);
      for (const [eventType, metadata] of events)
        await emit(
          call,
          eventType,
          "planning_task",
          row.id,
          { ...metadata, version: row.version },
          now,
        );
      return {
        ...taskView(
          row,
          await ownerFor(call.session, row.ownerMembershipId),
          true,
        ),
        recordType: "task" as const,
      };
    }
    const [previous] = await call.session
      .select()
      .from(planningMilestones)
      .where(
        and(
          eq(planningMilestones.id, recordId),
          eq(planningMilestones.weddingId, weddingId),
        ),
      )
      .for("update")
      .limit(1);
    if (!previous || previous.version !== input.expectedVersion)
      throw new PlanningUnavailableError("conflict");
    await assertPhase(
      call.session,
      weddingId,
      input.phaseId,
      "milestone",
      previous.phaseId,
    );
    const [row] = await call.session
      .update(planningMilestones)
      .set({
        title: title(input.title, 200),
        description: clean(input.description, 10_000),
        plannedDate: input.plannedDate,
        phaseId: input.phaseId,
        status: input.status,
        lifecycle: input.lifecycle,
        trashedAt:
          input.lifecycle === "trashed" ? (previous.trashedAt ?? now) : null,
        version: input.expectedVersion + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(planningMilestones.id, recordId),
          eq(planningMilestones.weddingId, weddingId),
          eq(planningMilestones.version, input.expectedVersion),
        ),
      )
      .returning();
    if (!row) throw new PlanningUnavailableError("conflict");
    const events: Array<[string, Record<string, unknown>]> = [];
    if (previous.plannedDate !== row.plannedDate)
      events.push([
        "planning.milestone_date_changed",
        {
          previousPlannedDate: previous.plannedDate,
          plannedDate: row.plannedDate,
          notifyPartnersAndLeadPlanner: true,
        },
      ]);
    if (previous.status !== row.status)
      events.push([
        "planning.milestone_status_changed",
        { previousStatus: previous.status, status: row.status, notify: false },
      ]);
    if (previous.lifecycle !== row.lifecycle)
      events.push([
        `planning.milestone_${row.lifecycle === "trashed" ? "trashed" : "restored"}`,
        { previousLifecycle: previous.lifecycle, lifecycle: row.lifecycle },
      ]);
    if (events.length === 0) events.push(["planning.milestone_updated", {}]);
    for (const [eventType, metadata] of events)
      await emit(
        call,
        eventType,
        "planning_milestone",
        row.id,
        { ...metadata, version: row.version },
        now,
      );
    return { ...milestoneView(row, true), recordType: "milestone" as const };
  }).catch((error: unknown) => {
    if (error instanceof PlanningUnavailableError) throw error;
    if ((error as { code?: string }).code === "23505")
      throw new PlanningUnavailableError("conflict");
    throw error;
  });
}
