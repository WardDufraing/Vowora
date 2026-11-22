import { randomUUID } from "node:crypto";

import { drizzle } from "drizzle-orm/node-postgres";
import { describe, expect, it } from "vitest";

import { authorizeWeddingServerOperation } from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  createPlanningRecord,
  listPlanningWorkspace,
  updatePlanningRecord,
} from "./planning.js";
import * as tables from "./schema.js";
import { createUuidV7 } from "./uuid.js";
import { DatabaseWeddingAuthorizationState } from "./weddings.js";

const config = parseTestMigrationConfig(process.env);

async function seed(database: ReturnType<typeof drizzle>) {
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
  database: ReturnType<typeof drizzle>,
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
  database: ReturnType<typeof drizzle>,
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
        const database = drizzle(client, {
          casing: "snake_case",
          schema: tables,
        });
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
        const database = drizzle(client, {
          casing: "snake_case",
          schema: tables,
        });
        const state = await seed(database);
        const task = await createPlanningRecord(
          database,
          await createOperation(database, state.actor.partner, state.weddingId),
          {
            kind: "task",
            title: "Confirm",
            description: null,
            dueDate: null,
            phaseId: null,
            ownerMembershipId: null,
          },
        );
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
        const database = drizzle(client, {
          casing: "snake_case",
          schema: tables,
        });
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
        const database = drizzle(client, {
          casing: "snake_case",
          schema: tables,
        });
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
});
