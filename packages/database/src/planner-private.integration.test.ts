import { randomUUID } from "node:crypto";

import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  authorizeOrganizationHandover,
  authorizeOrganizationPrivateNote,
} from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  completeOrganizationWeddingExit,
  createOrganizationPrivateNote,
  listOrganizationPrivateNotes,
  type PlannerPrivateDatabase,
  PlannerPrivateUnavailableError,
  previewOrganizationWeddingExit,
  updateOrganizationPrivateNote,
} from "./planner-private.js";
import * as tables from "./schema.js";
import { createUuidV7 } from "./uuid.js";

const config = parseTestMigrationConfig(process.env);
const schema = {
  auditEvents: tables.auditEvents,
  outboxEvents: tables.outboxEvents,
  user: tables.user,
  weddings: tables.weddings,
  weddingMemberships: tables.weddingMemberships,
  organizations: tables.organizations,
  organizationMemberships: tables.organizationMemberships,
  organizationPrivateNotes: tables.organizationPrivateNotes,
  weddingOrganizationInvitations: tables.weddingOrganizationInvitations,
  weddingOrganizationAccesses: tables.weddingOrganizationAccesses,
  weddingOrganizationHandovers: tables.weddingOrganizationHandovers,
  weddingOrganizationStaffAssignments:
    tables.weddingOrganizationStaffAssignments,
};

type Seed = Awaited<ReturnType<typeof seed>>;

async function seed(database: PlannerPrivateDatabase) {
  const actor = {
    partner: createUuidV7(),
    owner: createUuidV7(),
    manager: createUuidV7(),
    employee: createUuidV7(),
    outsider: createUuidV7(),
  };
  await database.insert(tables.user).values(
    Object.entries(actor).map(([name, id]) => ({
      id,
      name,
      email: `${name}@example.test`,
      emailVerified: true,
    })),
  );
  const weddingId = createUuidV7();
  await database.insert(tables.weddings).values({
    id: weddingId,
    name: "Shared wedding",
    timeZone: "Europe/Brussels",
    creationMode: "couple",
    creatorActorId: actor.partner,
    creationRequestId: randomUUID(),
    creationRequestFingerprint: "a".repeat(64),
  });
  const organizationId = createUuidV7();
  const foreignOrganizationId = createUuidV7();
  await database.insert(tables.organizations).values([
    {
      id: organizationId,
      name: "North Star",
      creatorActorId: actor.owner,
      creationRequestId: randomUUID(),
      creationRequestFingerprint: "b".repeat(64),
    },
    {
      id: foreignOrganizationId,
      name: "Other planner",
      creatorActorId: actor.outsider,
      creationRequestId: randomUUID(),
      creationRequestFingerprint: "c".repeat(64),
    },
  ]);
  const memberships = await database
    .insert(tables.organizationMemberships)
    .values([
      { organizationId, actorId: actor.owner, role: "owner" },
      { organizationId, actorId: actor.manager, role: "manager" },
      { organizationId, actorId: actor.employee, role: "employee" },
      {
        organizationId: foreignOrganizationId,
        actorId: actor.outsider,
        role: "owner",
      },
    ])
    .returning();
  const membership = Object.fromEntries(
    memberships.map((item) => [item.actorId, item]),
  );
  const invitationId = createUuidV7();
  await database.insert(tables.weddingOrganizationInvitations).values({
    id: invitationId,
    weddingId,
    organizationId,
    status: "accepted",
    permissionCeiling: [],
    issuedByActorId: actor.partner,
    issuanceRequestId: randomUUID(),
    issuanceRequestFingerprint: "d".repeat(64),
    acceptedByActorId: actor.owner,
    acceptedAt: new Date("2026-01-01T00:00:00Z"),
    expiresAt: new Date("2026-02-01T00:00:00Z"),
  });
  const [access] = await database
    .insert(tables.weddingOrganizationAccesses)
    .values({
      weddingId,
      organizationId,
      invitationId,
      permissionCeiling: [],
      grantedByActorId: actor.partner,
    })
    .returning();
  const weddingMembershipId = createUuidV7();
  await database.insert(tables.weddingMemberships).values({
    id: weddingMembershipId,
    weddingId,
    actorId: actor.employee,
    role: "planner",
  });
  const [assignment] = await database
    .insert(tables.weddingOrganizationStaffAssignments)
    .values({
      accessId: access!.id,
      organizationMembershipId: membership[actor.employee]!.id,
      weddingMembershipId,
      assignedByActorId: actor.owner,
      isLead: true,
    })
    .returning();
  return {
    access: access!,
    actor,
    assignment: assignment!,
    foreignOrganizationId,
    membership,
    organizationId,
    weddingId,
  };
}

function noteCommand(
  state: Seed,
  actorId: string,
  action: "list" | "create" | "update" | "archive",
  noteId?: string,
) {
  return authorizeOrganizationPrivateNote({
    actorId,
    correlationId: randomUUID(),
    organizationId: state.organizationId,
    action,
    ...(noteId ? { noteId } : {}),
  });
}

function handoverCommand(
  state: Seed,
  actorId: string,
  mode: "guided" | "immediate",
  requestId = randomUUID(),
) {
  return authorizeOrganizationHandover({
    actorId,
    correlationId: randomUUID(),
    organizationId: state.organizationId,
    accessId: state.access.id,
    mode,
    requestId,
  });
}

async function withTwoConnections<T>(
  schemaName: string,
  callback: (
    first: PlannerPrivateDatabase,
    second: PlannerPrivateDatabase,
  ) => Promise<T>,
) {
  const connection = {
    connectionString: config.connectionString,
    options: `-c search_path=${schemaName},public`,
  };
  const firstClient = new pg.Client(connection);
  const secondClient = new pg.Client(connection);
  await Promise.all([firstClient.connect(), secondClient.connect()]);
  try {
    return await callback(
      drizzle(firstClient, { casing: "snake_case", schema }),
      drizzle(secondClient, { casing: "snake_case", schema }),
    );
  } finally {
    await Promise.all([firstClient.end(), secondClient.end()]);
  }
}

describe("planner handover and private notes", () => {
  it("keeps notes organization-private and enforces creator or manager mutation", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-private-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const state = await seed(database);
        const ownerNote = await createOrganizationPrivateNote(
          database,
          noteCommand(state, state.actor.owner, "create"),
          {
            title: "  Contract context  ",
            body: "Private detail",
            weddingId: state.weddingId,
          },
        );
        expect(ownerNote).toMatchObject({
          title: "Contract context",
          weddingId: state.weddingId,
          editable: true,
        });
        expect(ownerNote).not.toHaveProperty("organizationId");
        expect(ownerNote).not.toHaveProperty("createdByMembershipId");

        const employeeList = await listOrganizationPrivateNotes(
          database,
          noteCommand(state, state.actor.employee, "list"),
        );
        expect(employeeList).toMatchObject([
          { id: ownerNote.id, editable: false },
        ]);
        await expect(
          updateOrganizationPrivateNote(
            database,
            noteCommand(state, state.actor.employee, "update", ownerNote.id),
            { noteId: ownerNote.id, body: "Not allowed" },
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });

        const employeeNote = await createOrganizationPrivateNote(
          database,
          noteCommand(state, state.actor.employee, "create"),
          { title: "Call", body: "Internal follow-up" },
        );
        await expect(
          updateOrganizationPrivateNote(
            database,
            noteCommand(
              state,
              state.actor.employee,
              "archive",
              employeeNote.id,
            ),
            { noteId: employeeNote.id, archive: true },
          ),
        ).resolves.toMatchObject({ status: "archived", editable: false });
        await expect(
          updateOrganizationPrivateNote(
            database,
            noteCommand(state, state.actor.employee, "update", employeeNote.id),
            { noteId: employeeNote.id, body: "Changed after archive" },
          ),
        ).rejects.toMatchObject({ reason: "stale" });
        await expect(
          updateOrganizationPrivateNote(
            database,
            noteCommand(state, state.actor.manager, "update", ownerNote.id),
            { noteId: ownerNote.id, title: "Manager correction" },
          ),
        ).resolves.toMatchObject({ title: "Manager correction" });

        const foreignCommand = authorizeOrganizationPrivateNote({
          actorId: state.actor.outsider,
          correlationId: randomUUID(),
          organizationId: state.foreignOrganizationId,
          action: "update",
          noteId: ownerNote.id,
        });
        await expect(
          updateOrganizationPrivateNote(database, foreignCommand, {
            noteId: ownerNote.id,
            body: "Cross-tenant",
          }),
        ).rejects.toMatchObject({ reason: "access_denied" });

        await database
          .update(tables.organizationMemberships)
          .set({
            status: "revoked",
            deactivatedAt: new Date(),
            permissionScopeVersion: 2,
          })
          .where(
            eq(tables.organizationMemberships.actorId, state.actor.employee),
          );
        await expect(
          listOrganizationPrivateNotes(
            database,
            noteCommand(state, state.actor.employee, "list"),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });

        const noteFacts = await database
          .select()
          .from(tables.outboxEvents)
          .where(
            eq(
              tables.outboxEvents.eventType,
              "organization.private_note_created",
            ),
          );
        expect(JSON.stringify(noteFacts)).not.toContain("Private detail");
      },
    );
  });

  it("generates a guided snapshot and atomically exits without deleting shared data or notes", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-handover-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const state = await seed(database);
        const note = await createOrganizationPrivateNote(
          database,
          noteCommand(state, state.actor.owner, "create"),
          {
            title: "Retained",
            body: "Organization history",
            weddingId: state.weddingId,
          },
        );
        await database.insert(tables.weddingOrganizationInvitations).values({
          weddingId: state.weddingId,
          organizationId: state.organizationId,
          permissionCeiling: [],
          issuedByActorId: state.actor.partner,
          issuanceRequestId: randomUUID(),
          issuanceRequestFingerprint: "e".repeat(64),
          expiresAt: new Date("2026-02-01T00:00:00Z"),
        });
        const preview = await previewOrganizationWeddingExit(
          database,
          handoverCommand(state, state.actor.manager, "guided"),
        );
        expect(preview).toMatchObject({
          activeAssignmentCount: 1,
          leadAssigned: true,
          pendingInvitationCount: 1,
          unresolvedResponsibilityCount: 0,
          sharedDataRetained: true,
          privateNotesRetainedByOrganization: true,
        });
        await expect(
          completeOrganizationWeddingExit(
            database,
            handoverCommand(state, state.actor.employee, "immediate"),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });

        const requestId = randomUUID();
        const completed = await completeOrganizationWeddingExit(
          database,
          handoverCommand(state, state.actor.owner, "guided", requestId),
          new Date("2026-01-10T12:00:00Z"),
        );
        expect(completed).toMatchObject({
          replayed: false,
          snapshot: {
            activeAssignmentCount: preview.activeAssignmentCount,
            leadAssigned: preview.leadAssigned,
            pendingInvitationCount: preview.pendingInvitationCount,
            sharedDataRetained: true,
            privateNotesRetainedByOrganization: true,
          },
        });
        await expect(
          completeOrganizationWeddingExit(
            database,
            handoverCommand(state, state.actor.owner, "guided", requestId),
          ),
        ).resolves.toMatchObject({ id: completed.id, replayed: true });
        await expect(
          completeOrganizationWeddingExit(
            database,
            handoverCommand(state, state.actor.owner, "immediate", requestId),
          ),
        ).rejects.toBeInstanceOf(PlannerPrivateUnavailableError);

        const [access] = await database
          .select()
          .from(tables.weddingOrganizationAccesses)
          .where(eq(tables.weddingOrganizationAccesses.id, state.access.id));
        const [assignment] = await database
          .select()
          .from(tables.weddingOrganizationStaffAssignments)
          .where(
            eq(
              tables.weddingOrganizationStaffAssignments.id,
              state.assignment.id,
            ),
          );
        const [wedding] = await database
          .select()
          .from(tables.weddings)
          .where(eq(tables.weddings.id, state.weddingId));
        const [retainedNote] = await database
          .select()
          .from(tables.organizationPrivateNotes)
          .where(
            and(
              eq(tables.organizationPrivateNotes.id, note.id),
              eq(
                tables.organizationPrivateNotes.organizationId,
                state.organizationId,
              ),
            ),
          );
        expect(access).toMatchObject({
          status: "revoked",
          revokedByActorId: state.actor.owner,
        });
        expect(assignment).toMatchObject({ status: "revoked", isLead: false });
        expect(wedding).toMatchObject({
          id: state.weddingId,
          name: "Shared wedding",
        });
        expect(retainedNote).toMatchObject({
          id: note.id,
          weddingId: state.weddingId,
        });

        await expect(
          createOrganizationPrivateNote(
            database,
            noteCommand(state, state.actor.owner, "create"),
            {
              title: "Too late",
              body: "Cannot add link",
              weddingId: state.weddingId,
            },
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await expect(
          listOrganizationPrivateNotes(
            database,
            noteCommand(state, state.actor.owner, "list"),
          ),
        ).resolves.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: note.id })]),
        );

        const handoverFacts = await database
          .select()
          .from(tables.outboxEvents)
          .where(
            eq(
              tables.outboxEvents.eventType,
              "wedding.organization_handover_completed",
            ),
          );
        expect(handoverFacts).toHaveLength(1);
        expect(handoverFacts[0]).toMatchObject({
          weddingId: state.weddingId,
          organizationId: state.organizationId,
          eventType: "wedding.organization_handover_completed",
        });
        expect(JSON.stringify(handoverFacts)).not.toContain(
          "Organization history",
        );
        const handoverAudit = await database
          .select()
          .from(tables.auditEvents)
          .where(
            eq(
              tables.auditEvents.eventType,
              "wedding.organization_handover_completed",
            ),
          );
        expect(handoverAudit).toHaveLength(1);
        expect(JSON.stringify(handoverAudit)).not.toContain(
          "Organization history",
        );
      },
    );
  });

  it("serializes same-request concurrent exits into one stable replay and one fact pair", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-handover-same-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const state = await seed(database);
        const requestId = randomUUID();
        const results = await withTwoConnections(
          schemaName,
          async (first, second) =>
            Promise.all([
              completeOrganizationWeddingExit(
                first,
                handoverCommand(state, state.actor.owner, "guided", requestId),
              ),
              completeOrganizationWeddingExit(
                second,
                handoverCommand(state, state.actor.owner, "guided", requestId),
              ),
            ]),
        );
        expect(results.map((result) => result.replayed).sort()).toEqual([
          false,
          true,
        ]);
        expect(results[0]!.id).toBe(results[1]!.id);
        await expect(
          database
            .select({ value: count() })
            .from(tables.weddingOrganizationHandovers),
        ).resolves.toEqual([{ value: 1 }]);
        await expect(
          database
            .select({ value: count() })
            .from(tables.auditEvents)
            .where(
              eq(
                tables.auditEvents.eventType,
                "wedding.organization_handover_completed",
              ),
            ),
        ).resolves.toEqual([{ value: 1 }]);
        await expect(
          database
            .select({ value: count() })
            .from(tables.outboxEvents)
            .where(
              eq(
                tables.outboxEvents.eventType,
                "wedding.organization_handover_completed",
              ),
            ),
        ).resolves.toEqual([{ value: 1 }]);
      },
    );
  });

  it("allows one different-request concurrent exit and rejects the other without extra facts", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-handover-different-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const state = await seed(database);
        const results = await withTwoConnections(
          schemaName,
          async (first, second) =>
            Promise.allSettled([
              completeOrganizationWeddingExit(
                first,
                handoverCommand(state, state.actor.owner, "guided"),
              ),
              completeOrganizationWeddingExit(
                second,
                handoverCommand(state, state.actor.owner, "guided"),
              ),
            ]),
        );
        expect(
          results.filter((result) => result.status === "fulfilled"),
        ).toHaveLength(1);
        const rejected = results.filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        expect(rejected).toHaveLength(1);
        expect(rejected[0]!.reason).toMatchObject({ reason: "stale" });
        await expect(
          database
            .select({ value: count() })
            .from(tables.weddingOrganizationHandovers),
        ).resolves.toEqual([{ value: 1 }]);
        await expect(
          database
            .select({ value: count() })
            .from(tables.auditEvents)
            .where(
              eq(
                tables.auditEvents.eventType,
                "wedding.organization_handover_completed",
              ),
            ),
        ).resolves.toEqual([{ value: 1 }]);
        await expect(
          database
            .select({ value: count() })
            .from(tables.outboxEvents)
            .where(
              eq(
                tables.outboxEvents.eventType,
                "wedding.organization_handover_completed",
              ),
            ),
        ).resolves.toEqual([{ value: 1 }]);
      },
    );
  });
});
