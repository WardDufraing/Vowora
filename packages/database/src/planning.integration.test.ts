import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import pg from "pg";
import { describe, expect, it } from "vitest";

import { authorizeWeddingServerOperation } from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { createTestDatabase, withIsolatedTestSchema } from "./migrations.js";
import {
  createPlanningRecord,
  listPlanningWorkspace,
  updatePlanningRecord,
} from "./planning.js";
import * as tables from "./schema.js";
import { createUuidV7 } from "./uuid.js";
import { DatabaseWeddingAuthorizationState } from "./weddings.js";

const config = parseTestMigrationConfig(process.env);
const { Client } = pg;

type TestDatabase = ReturnType<typeof createTestDatabase>;

async function seed(database: TestDatabase) {
  const actor = {
    partner: createUuidV7(),
    helper: createUuidV7(),
    outsider: createUuidV7(),
  };
  await database.insert(tables.user).values(
    Object.entries(actor).map(([name, id]) => ({
      id,
      name,
      email: `${name}@planning.example.test`,
      emailVerified: true,
    })),
  );
  const weddingId = createUuidV7();
  const foreignWeddingId = createUuidV7();
  await database.insert(tables.weddings).values([
    {
      id: weddingId,
      name: "Planning wedding",
      timeZone: "Europe/Brussels",
      creationMode: "couple",
      creatorActorId: actor.partner,
      creationRequestId: randomUUID(),
      creationRequestFingerprint: "a".repeat(64),
    },
    {
      id: foreignWeddingId,
      name: "Foreign wedding",
      timeZone: "Europe/Brussels",
      creationMode: "couple",
      creatorActorId: actor.outsider,
      creationRequestId: randomUUID(),
      creationRequestFingerprint: "b".repeat(64),
    },
  ]);
  const memberships = await database
    .insert(tables.weddingMemberships)
    .values([
      { weddingId, actorId: actor.partner, role: "partner" },
      { weddingId, actorId: actor.helper, role: "helper" },
      { weddingId: foreignWeddingId, actorId: actor.outsider, role: "partner" },
    ])
    .returning();
  return {
    actor,
    foreignWeddingId,
    helperMembershipId: memberships.find((row) => row.actorId === actor.helper)!
      .id,
    weddingId,
  };
}

function createOperation(
  database: TestDatabase,
  actorId: string,
  weddingId: string,
) {
  return authorizeWeddingServerOperation(
    { actorId },
    {
      resource: "new",
      area: "tasks",
      weddingId,
      action: "edit",
      correlationId: randomUUID(),
    },
    new DatabaseWeddingAuthorizationState(database),
  );
}

function updateOperation(
  database: TestDatabase,
  actorId: string,
  weddingId: string,
  recordId: string,
) {
  return authorizeWeddingServerOperation(
    { actorId },
    {
      resource: "existing",
      recordId,
      weddingId,
      action: "edit",
      correlationId: randomUUID(),
    },
    new DatabaseWeddingAuthorizationState(database),
  );
}

describe("task and milestone domain", () => {
  it("creates separate phases, assignments and milestones within one wedding", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-domain-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const taskPhase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "task_phase", name: "Booking", position: 1 },
        );
        const milestonePhase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "milestone_phase", name: "Venue", position: 1 },
        );
        const task = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "task",
            title: "  Confirm venue  ",
            description: "Call the venue",
            dueDate: null,
            phaseId: taskPhase.id,
            ownerMembershipId: state.helperMembershipId,
          },
        );
        if (task.recordType !== "task") throw new Error("Expected task");
        const milestone = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Venue confirmed",
            description: null,
            plannedDate: "2027-03-01",
            phaseId: milestonePhase.id,
          },
        );
        expect(task).toMatchObject({
          title: "Confirm venue",
          status: "not_started",
          owner: { membershipId: state.helperMembershipId },
        });
        expect(milestone).toMatchObject({
          plannedDate: "2027-03-01",
          status: "not_started",
        });
        const partnerView = await listPlanningWorkspace(database, {
          actorId: state.actor.partner,
          weddingId: state.weddingId,
        });
        expect(partnerView).toMatchObject({ canEdit: true });
        expect(partnerView.tasks).toHaveLength(1);
        expect(partnerView.milestones).toHaveLength(1);
        const helperView = await listPlanningWorkspace(database, {
          actorId: state.actor.helper,
          weddingId: state.weddingId,
        });
        expect(helperView.canEdit).toBe(false);
        expect(helperView.tasks).toMatchObject([
          { id: task.id, editable: false },
        ]);
        expect(helperView.milestones).toHaveLength(0);
      },
    );
  });

  it("records completion and reopen as distinct optimistic changes", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-state-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const task = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "task",
            title: "Confirm",
            description: null,
            dueDate: "2027-03-01",
            phaseId: null,
            ownerMembershipId: state.helperMembershipId,
          },
        );
        if (task.recordType !== "task") throw new Error("Expected task");
        const complete = await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            task.id,
          ),
          task.id,
          {
            kind: "task",
            expectedVersion: 1,
            title: task.title,
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: null,
            status: "complete",
            blockedReason: null,
            lifecycle: "active",
          },
          new Date("2026-11-22T10:00:00Z"),
        );
        expect(complete).toMatchObject({
          status: "complete",
          version: 2,
          completedAt: "2026-11-22T10:00:00.000Z",
        });
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.partner,
              state.weddingId,
              task.id,
            ),
            task.id,
            {
              kind: "task",
              expectedVersion: 1,
              title: task.title,
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: null,
              status: "in_progress",
              blockedReason: null,
              lifecycle: "active",
            },
          ),
        ).rejects.toMatchObject({ reason: "conflict" });
        const reopened = await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            task.id,
          ),
          task.id,
          {
            kind: "task",
            expectedVersion: 2,
            title: task.title,
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: null,
            status: "in_progress",
            blockedReason: null,
            lifecycle: "active",
          },
        );
        expect(reopened).toMatchObject({
          status: "in_progress",
          version: 3,
          completedAt: null,
        });
        const events = await database
          .select({ type: tables.auditEvents.eventType })
          .from(tables.auditEvents);
        expect(events.map((event) => event.type)).toEqual(
          expect.arrayContaining([
            "planning.task_completed",
            "planning.task_reopened",
            "planning.task_assignment_changed",
            "planning.task_due_date_changed",
          ]),
        );
      },
    );
  });

  it("allows a blocked task without a reason and rejects a reason on other statuses", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-blocked-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const task = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "task",
            title: "Await confirmation",
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: null,
          },
        );
        if (task.recordType !== "task") throw new Error("Expected task");
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.partner,
              state.weddingId,
              task.id,
            ),
            task.id,
            {
              kind: "task",
              expectedVersion: 1,
              title: task.title,
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: null,
              status: "blocked",
              blockedReason: null,
              lifecycle: "active",
            },
          ),
        ).resolves.toMatchObject({ status: "blocked", blockedReason: null });
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.partner,
              state.weddingId,
              task.id,
            ),
            task.id,
            {
              kind: "task",
              expectedVersion: 2,
              title: task.title,
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: null,
              status: "in_progress",
              blockedReason: "Waiting",
              lifecycle: "active",
            },
          ),
        ).rejects.toMatchObject({ reason: "invalid" });
      },
    );
  });

  it("denies cross-wedding phases, owners, records and outsider collections", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-tenant-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        await expect(
          createPlanningRecord(
            database,
            await createOperation(
              database,
              state.actor.partner,
              state.weddingId,
            ),
            {
              kind: "task",
              title: "Cross tenant",
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: createUuidV7(),
            },
          ),
        ).rejects.toMatchObject({ reason: "invalid" });
        await expect(
          listPlanningWorkspace(database, {
            actorId: state.actor.outsider,
            weddingId: state.weddingId,
          }),
        ).rejects.toMatchObject({ reason: "access_denied" });
        const foreignTask = await createPlanningRecord(
          database,
          await createOperation(
            database,
            state.actor.outsider,
            state.foreignWeddingId,
          ),
          {
            kind: "task",
            title: "Foreign",
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: null,
          },
        );
        await expect(
          updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            foreignTask.id,
          ),
        ).rejects.toThrow();
      },
    );
  });

  it("limits assigned-scope creation to the actor's own task and filters in SQL", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-assigned-scope-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        await database
          .update(tables.weddingMemberships)
          .set({
            role: "coordinator",
            permissionOverrides: [
              {
                area: "tasks",
                action: "view",
                effect: "allow",
                scope: "assigned",
              },
              {
                area: "tasks",
                action: "edit",
                effect: "allow",
                scope: "assigned",
              },
            ],
            permissionScopeVersion: 2,
          })
          .where(eq(tables.weddingMemberships.id, state.helperMembershipId));
        await expect(
          createPlanningRecord(
            database,
            await createOperation(
              database,
              state.actor.helper,
              state.weddingId,
            ),
            {
              kind: "task",
              title: "Unassigned escape",
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: null,
            },
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await expect(
          createPlanningRecord(
            database,
            await createOperation(
              database,
              state.actor.helper,
              state.weddingId,
            ),
            { kind: "milestone_phase", name: "Escape", position: 0 },
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        const assignedPhase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "task_phase", name: "Assigned work", position: 0 },
        );
        const assigned = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "task",
            title: "Existing assigned task",
            description: null,
            dueDate: null,
            phaseId: assignedPhase.id,
            ownerMembershipId: state.helperMembershipId,
          },
        );
        if (assigned.recordType !== "task") throw new Error("Expected task");
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.helper,
              state.weddingId,
              assigned.id,
            ),
            assigned.id,
            {
              kind: "task",
              expectedVersion: 1,
              title: assigned.title,
              description: null,
              dueDate: null,
              phaseId: assignedPhase.id,
              ownerMembershipId: state.helperMembershipId,
              status: "in_progress",
              blockedReason: null,
              lifecycle: "active",
            },
          ),
        ).resolves.toMatchObject({ status: "in_progress", version: 2 });
        const own = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.helper, state.weddingId),
          {
            kind: "task",
            title: "My task",
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: state.helperMembershipId,
          },
        );
        if (own.recordType !== "task") throw new Error("Expected task");
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.helper,
              state.weddingId,
              own.id,
            ),
            own.id,
            {
              kind: "task",
              expectedVersion: 1,
              title: own.title,
              description: null,
              dueDate: null,
              phaseId: null,
              ownerMembershipId: null,
              status: "not_started",
              blockedReason: null,
              lifecycle: "active",
            },
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await createPlanningRecord(
          database,
          await createOperation(database, state.actor.helper, state.weddingId),
          {
            kind: "task",
            title: "My second task",
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: state.helperMembershipId,
          },
        );
        const view = await listPlanningWorkspace(database, {
          actorId: state.actor.helper,
          weddingId: state.weddingId,
          limit: 1,
        });
        expect(view.canEdit).toBe(false);
        expect(view.tasks).toHaveLength(1);
        expect(view.page.nextTaskCursor).not.toBeNull();
        expect(view.milestones).toEqual([]);
      },
    );
  });

  it("trashes and restores custom phases with only still-unassigned milestones", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-phase-lifecycle-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const phase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "milestone_phase", name: "Venue", position: 1 },
        );
        const milestone = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Venue booked",
            description: null,
            plannedDate: "2027-03-01",
            phaseId: phase.id,
          },
        );
        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            phase.id,
          ),
          phase.id,
          {
            kind: "milestone_phase",
            expectedVersion: 1,
            name: "Venue planning",
            position: 2,
            hidden: false,
            lifecycle: "trashed",
          },
        );
        expect(
          await database.query.planningMilestones.findFirst({
            where: eq(tables.planningMilestones.id, milestone.id),
          }),
        ).toMatchObject({
          phaseId: null,
          restorablePhaseId: phase.id,
          version: 2,
        });
        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            phase.id,
          ),
          phase.id,
          {
            kind: "milestone_phase",
            expectedVersion: 2,
            name: "Venue planning",
            position: 2,
            hidden: false,
            lifecycle: "active",
          },
        );
        expect(
          await database.query.planningMilestones.findFirst({
            where: eq(tables.planningMilestones.id, milestone.id),
          }),
        ).toMatchObject({
          phaseId: phase.id,
          restorablePhaseId: null,
          version: 3,
        });
        const events = await database
          .select({ type: tables.auditEvents.eventType })
          .from(tables.auditEvents);
        expect(events.map((event) => event.type)).toEqual(
          expect.arrayContaining([
            "planning.milestone_phase_renamed",
            "planning.milestone_phase_reordered",
            "planning.milestone_phase_trashed",
            "planning.milestone_phase_restored",
          ]),
        );
      },
    );
  });

  it("coordinates phase trash and restore with milestones trashed in either order", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-phase-trashed-milestones-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const phase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "milestone_phase", name: "Venue", position: 1 },
        );
        const beforePhaseTrash = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Trashed before phase",
            description: null,
            plannedDate: "2027-03-01",
            phaseId: phase.id,
          },
        );
        const afterPhaseTrash = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Trashed after phase",
            description: null,
            plannedDate: "2027-03-02",
            phaseId: phase.id,
          },
        );
        if (
          beforePhaseTrash.recordType !== "milestone" ||
          afterPhaseTrash.recordType !== "milestone"
        )
          throw new Error("Expected milestones");

        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            beforePhaseTrash.id,
          ),
          beforePhaseTrash.id,
          {
            kind: "milestone",
            expectedVersion: 1,
            title: beforePhaseTrash.title,
            description: beforePhaseTrash.description,
            plannedDate: beforePhaseTrash.plannedDate,
            phaseId: phase.id,
            status: "not_started",
            lifecycle: "trashed",
          },
        );
        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            phase.id,
          ),
          phase.id,
          {
            kind: "milestone_phase",
            expectedVersion: 1,
            name: "Venue",
            position: 1,
            hidden: false,
            lifecycle: "trashed",
          },
        );
        expect(
          await database.query.planningMilestones.findFirst({
            where: eq(tables.planningMilestones.id, beforePhaseTrash.id),
          }),
        ).toMatchObject({
          lifecycle: "trashed",
          phaseId: null,
          restorablePhaseId: phase.id,
          version: 3,
        });

        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            afterPhaseTrash.id,
          ),
          afterPhaseTrash.id,
          {
            kind: "milestone",
            expectedVersion: 2,
            title: afterPhaseTrash.title,
            description: afterPhaseTrash.description,
            plannedDate: afterPhaseTrash.plannedDate,
            phaseId: null,
            status: "not_started",
            lifecycle: "trashed",
          },
        );
        await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            phase.id,
          ),
          phase.id,
          {
            kind: "milestone_phase",
            expectedVersion: 2,
            name: "Venue",
            position: 1,
            hidden: false,
            lifecycle: "active",
          },
        );
        for (const milestoneId of [beforePhaseTrash.id, afterPhaseTrash.id]) {
          expect(
            await database.query.planningMilestones.findFirst({
              where: eq(tables.planningMilestones.id, milestoneId),
            }),
          ).toMatchObject({
            lifecycle: "trashed",
            phaseId: phase.id,
            restorablePhaseId: null,
            version: 4,
          });
        }
      },
    );
  });

  it("keeps trashed milestone contents immutable and restores the prior state", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-milestone-trash-${randomUUID()}`,
      async ({ client }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const milestone = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Venue confirmed",
            description: "Keep this state",
            plannedDate: "2027-03-01",
            phaseId: null,
          },
        );
        if (milestone.recordType !== "milestone")
          throw new Error("Expected milestone");
        const inProgress = await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            milestone.id,
          ),
          milestone.id,
          {
            kind: "milestone",
            expectedVersion: 1,
            title: milestone.title,
            description: milestone.description,
            plannedDate: milestone.plannedDate,
            phaseId: null,
            status: "in_progress",
            lifecycle: "active",
          },
        );
        if (inProgress.recordType !== "milestone")
          throw new Error("Expected milestone");
        const trashed = await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            milestone.id,
          ),
          milestone.id,
          {
            kind: "milestone",
            expectedVersion: 2,
            title: inProgress.title,
            description: inProgress.description,
            plannedDate: inProgress.plannedDate,
            phaseId: null,
            status: "in_progress",
            lifecycle: "trashed",
          },
        );
        expect(trashed).toMatchObject({
          lifecycle: "trashed",
          status: "in_progress",
          version: 3,
        });
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.partner,
              state.weddingId,
              milestone.id,
            ),
            milestone.id,
            {
              kind: "milestone",
              expectedVersion: 3,
              title: "Changed in trash",
              description: inProgress.description,
              plannedDate: inProgress.plannedDate,
              phaseId: null,
              status: "complete",
              lifecycle: "trashed",
            },
          ),
        ).rejects.toMatchObject({ reason: "invalid" });
        const restored = await updatePlanningRecord(
          database,
          await updateOperation(
            database,
            state.actor.partner,
            state.weddingId,
            milestone.id,
          ),
          milestone.id,
          {
            kind: "milestone",
            expectedVersion: 3,
            title: inProgress.title,
            description: inProgress.description,
            plannedDate: inProgress.plannedDate,
            phaseId: null,
            status: "in_progress",
            lifecycle: "active",
          },
        );
        expect(restored).toMatchObject({
          title: "Venue confirmed",
          description: "Keep this state",
          status: "in_progress",
          lifecycle: "active",
          version: 4,
        });
        await expect(
          updatePlanningRecord(
            database,
            await updateOperation(
              database,
              state.actor.partner,
              state.weddingId,
              milestone.id,
            ),
            milestone.id,
            {
              kind: "milestone",
              expectedVersion: 3,
              title: inProgress.title,
              description: inProgress.description,
              plannedDate: inProgress.plannedDate,
              phaseId: null,
              status: "in_progress",
              lifecycle: "active",
            },
          ),
        ).rejects.toMatchObject({ reason: "conflict" });
      },
    );
  });

  it("serializes phase trash against a stale concurrent milestone edit", async () => {
    await withIsolatedTestSchema(
      config,
      `planning-phase-race-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const database = createTestDatabase(client);
        const state = await seed(database);
        const phase = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          { kind: "milestone_phase", name: "Venue", position: 1 },
        );
        const milestone = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "milestone",
            title: "Venue confirmed",
            description: null,
            plannedDate: "2027-03-01",
            phaseId: phase.id,
          },
        );
        const connection = {
          connectionString: config.connectionString,
          options: `-c search_path=${schemaName},public`,
        };
        const phaseWriter = new Client(connection);
        const staleWriter = new Client(connection);
        await phaseWriter.connect();
        await staleWriter.connect();
        try {
          await phaseWriter.query("BEGIN");
          await staleWriter.query("BEGIN");
          await phaseWriter.query(
            `UPDATE milestone_phases
                SET status = 'trashed', trashed_at = now(), version = 2,
                    updated_at = now()
              WHERE id = $1 AND version = 1`,
            [phase.id],
          );
          const staleEdit = staleWriter.query(
            `UPDATE planning_milestones
                SET title = 'Stale edit', version = 2, updated_at = now()
              WHERE id = $1 AND version = 1`,
            [milestone.id],
          );
          await phaseWriter.query("COMMIT");
          expect((await staleEdit).rowCount).toBe(0);
          await staleWriter.query("COMMIT");
        } finally {
          await phaseWriter.query("ROLLBACK").catch(() => undefined);
          await staleWriter.query("ROLLBACK").catch(() => undefined);
          await phaseWriter.end();
          await staleWriter.end();
        }
        expect(
          await database.query.planningMilestones.findFirst({
            where: eq(tables.planningMilestones.id, milestone.id),
          }),
        ).toMatchObject({
          title: "Venue confirmed",
          phaseId: null,
          restorablePhaseId: phase.id,
          version: 2,
        });
      },
    );
  });
});
