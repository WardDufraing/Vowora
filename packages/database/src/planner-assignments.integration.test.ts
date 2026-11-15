import { randomUUID } from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  authorizeCoupleWeddingCreation,
  authorizeOrganizationCreation,
  authorizeOrganizationLeadTransfer,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
} from "@vowora/domain";
import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import * as tables from "./schema.js";
import { createUuidV7 } from "./uuid.js";
import {
  createCoupleWedding,
  DatabaseWeddingAuthorizationState,
  readWeddingWorkspaceEntryState,
} from "./weddings.js";
import {
  createOrganization,
  DatabaseOrganizationAuthorizationState,
  deactivateOrganizationMember,
} from "./organizations.js";
import {
  assignOrganizationStaffToWedding,
  issueWeddingOrganizationInvitation,
  getWeddingOrganizationAccessManagement,
  listCurrentLeadWeddingAccesses,
  listWeddingOrganizationInvitations,
  listOrganizationWeddingInvitations,
  removeOrganizationStaffFromWedding,
  resolveCurrentActorPlannerFallback,
  respondWeddingOrganizationInvitation,
  revokeWeddingOrganizationAccess,
  revokeWeddingOrganizationInvitation,
  setPlannerStaffRestriction,
  setLeadPlannerAbsence,
  transferCurrentLeadPlanner,
} from "./planner-assignments.js";
const config = parseTestMigrationConfig(process.env);
const schema = {
  auditEvents: tables.auditEvents,
  outboxEvents: tables.outboxEvents,
  user: tables.user,
  weddings: tables.weddings,
  weddingMemberships: tables.weddingMemberships,
  organizations: tables.organizations,
  organizationInvitations: tables.organizationInvitations,
  organizationMemberships: tables.organizationMemberships,
  weddingOrganizationInvitations: tables.weddingOrganizationInvitations,
  weddingOrganizationAccesses: tables.weddingOrganizationAccesses,
  weddingOrganizationStaffAssignments:
    tables.weddingOrganizationStaffAssignments,
  weddingOrganizationStaffRestrictions:
    tables.weddingOrganizationStaffRestrictions,
};
describe("planner organization wedding assignment", () => {
  it("serializes invitation, narrows staff access, blocks staff, and cascades couple revocation", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-assignment-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const db = drizzle(client, { casing: "snake_case", schema });
        const partner = createUuidV7(),
          owner = createUuidV7(),
          manager = createUuidV7(),
          employee = createUuidV7(),
          foreignOwner = createUuidV7();
        await db.insert(tables.user).values([
          {
            id: partner,
            name: "Partner",
            email: "partner@example.test",
            emailVerified: true,
          },
          {
            id: owner,
            name: "Owner",
            email: "owner@example.test",
            emailVerified: true,
          },
          {
            id: employee,
            name: "Employee",
            email: "employee@example.test",
            emailVerified: true,
          },
          {
            id: manager,
            name: "Manager",
            email: "manager@example.test",
            emailVerified: true,
          },
          {
            id: foreignOwner,
            name: "Foreign owner",
            email: "foreign-owner@example.test",
            emailVerified: true,
          },
        ]);
        const wedding = await createCoupleWedding(
          db,
          authorizeCoupleWeddingCreation({
            actorId: partner,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Wedding",
            weddingDate: null,
            timeZone: "Europe/Brussels",
          }),
        );
        const org = await createOrganization(
          db,
          authorizeOrganizationCreation({
            actorId: owner,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Planner",
          }),
        );
        const foreignOrg = await createOrganization(
          db,
          authorizeOrganizationCreation({
            actorId: foreignOwner,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Foreign planner",
          }),
        );
        const [foreignMembership] = await db
          .select()
          .from(tables.organizationMemberships)
          .where(
            eq(
              tables.organizationMemberships.organizationId,
              foreignOrg.organization.id,
            ),
          );
        const [employeeMembership] = await db
          .insert(tables.organizationMemberships)
          .values({
            organizationId: org.organization.id,
            actorId: employee,
            role: "employee",
            status: "active",
            permissionOverrides: [],
          })
          .returning();
        const [managerMembership] = await db
          .insert(tables.organizationMemberships)
          .values({
            organizationId: org.organization.id,
            actorId: manager,
            role: "manager",
            status: "active",
            permissionOverrides: [],
          })
          .returning();
        const weddingAuth = () =>
          authorizeWeddingServerOperation(
            { actorId: partner },
            {
              resource: "existing",
              recordId: wedding.wedding.id,
              weddingId: wedding.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(db),
          );
        const orgAuth = () =>
          authorizeOrganizationServerOperation(
            { actorId: owner },
            {
              organizationId: org.organization.id,
              recordId: org.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(db),
          );
        const requestId = randomUUID();
        const ceiling = [
          {
            area: "tasks" as const,
            actions: ["view" as const, "edit" as const],
          },
          {
            area: "settings" as const,
            actions: ["view" as const, "edit" as const],
          },
        ];
        const issued = await issueWeddingOrganizationInvitation(
          db,
          await weddingAuth(),
          {
            organizationId: org.organization.id,
            ceiling,
            requestId,
            now: new Date("2026-01-01T00:00:00Z"),
          },
        );
        expect(issued.invitation.expiresAt.toISOString()).toBe(
          "2026-01-15T00:00:00.000Z",
        );
        await expect(
          db.insert(tables.weddingOrganizationInvitations).values({
            weddingId: wedding.wedding.id,
            organizationId: org.organization.id,
            status: "accepted",
            permissionCeiling: ceiling,
            issuedByActorId: partner,
            issuanceRequestId: randomUUID(),
            issuanceRequestFingerprint: "a".repeat(64),
            expiresAt: new Date("2026-01-15T00:00:00Z"),
          }),
        ).rejects.toThrow();
        await expect(
          issueWeddingOrganizationInvitation(db, await weddingAuth(), {
            organizationId: org.organization.id,
            ceiling,
            requestId,
          }),
        ).resolves.toMatchObject({ replayed: true });
        expect(
          await listOrganizationWeddingInvitations(db, await orgAuth()),
        ).toHaveLength(1);
        const accepted = await respondWeddingOrganizationInvitation(
          db,
          await orgAuth(),
          issued.invitation.id,
          "accept",
          new Date("2026-01-02T00:00:00Z"),
        );
        expect(accepted.accepted).toBe(true);
        const [membership] = await db
          .select()
          .from(tables.organizationMemberships)
          .where(eq(tables.organizationMemberships.actorId, owner));
        const assignment = await assignOrganizationStaffToWedding(
          db,
          await orgAuth(),
          {
            accessId: accepted.access!.id,
            organizationMembershipId: membership!.id,
            permissions: [{ area: "tasks", actions: ["view", "edit"] }],
            isLead: true,
          },
        );
        expect(
          (
            await readWeddingWorkspaceEntryState(db, { actorId: owner })
          ).accessibleWorkspaces.map((workspace) => workspace.weddingId),
        ).toContain(wedding.wedding.id);
        const employeeAssignment = await assignOrganizationStaffToWedding(
          db,
          await orgAuth(),
          {
            accessId: accepted.access!.id,
            organizationMembershipId: employeeMembership!.id,
            permissions: [{ area: "tasks", actions: ["view"] }],
          },
        );
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: managerMembership!.id,
          permissions: [
            { area: "tasks", actions: ["view", "edit"] },
            { area: "settings", actions: ["view", "edit"] },
          ],
        });

        // A regular employee who is the canonical current lead can transfer
        // only the lead designation to another already eligible assignee.
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: employeeMembership!.id,
          permissions: [{ area: "tasks", actions: ["view"] }],
          isLead: true,
        });
        const leadTransfer = authorizeOrganizationLeadTransfer({
          actorId: employee,
          correlationId: randomUUID(),
          organizationId: org.organization.id,
          accessId: accepted.access!.id,
          targetOrganizationMembershipId: managerMembership!.id,
        });
        await expect(
          listCurrentLeadWeddingAccesses(db, {
            actorId: employee,
            organizationId: org.organization.id,
          }),
        ).resolves.toMatchObject({
          accesses: [
            {
              id: accepted.access!.id,
              currentMembershipId: employeeMembership!.id,
              assignments: expect.arrayContaining([
                expect.objectContaining({
                  organizationMembershipId: managerMembership!.id,
                }),
              ]),
            },
          ],
        });
        await expect(
          listCurrentLeadWeddingAccesses(db, {
            actorId: employee,
            organizationId: createUuidV7(),
          }),
        ).resolves.toEqual({ accesses: [], staff: [] });
        await expect(
          transferCurrentLeadPlanner(db, leadTransfer),
        ).resolves.toMatchObject({
          organizationMembershipId: managerMembership!.id,
          isLead: true,
        });
        await expect(
          transferCurrentLeadPlanner(db, leadTransfer),
        ).rejects.toThrow();
        await expect(
          transferCurrentLeadPlanner(
            db,
            authorizeOrganizationLeadTransfer({
              actorId: employee,
              correlationId: randomUUID(),
              organizationId: org.organization.id,
              accessId: accepted.access!.id,
              targetOrganizationMembershipId: foreignMembership!.id,
            }),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await expect(
          transferCurrentLeadPlanner(
            db,
            authorizeOrganizationLeadTransfer({
              actorId: manager,
              correlationId: randomUUID(),
              organizationId: org.organization.id,
              accessId: accepted.access!.id,
              targetOrganizationMembershipId: managerMembership!.id,
            }),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await expect(
          transferCurrentLeadPlanner(
            db,
            authorizeOrganizationLeadTransfer({
              actorId: manager,
              correlationId: randomUUID(),
              organizationId: org.organization.id,
              accessId: accepted.access!.id,
              targetOrganizationMembershipId: foreignMembership!.id,
            }),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        const transferConnection = {
          connectionString: config.connectionString,
          options: `-c search_path=${schemaName},public`,
        };
        const transferClientA = new pg.Client(transferConnection);
        const transferClientB = new pg.Client(transferConnection);
        await Promise.all([
          transferClientA.connect(),
          transferClientB.connect(),
        ]);
        const transferDbA = drizzle(transferClientA, {
          casing: "snake_case",
          schema,
        });
        const transferDbB = drizzle(transferClientB, {
          casing: "snake_case",
          schema,
        });
        let racingTransfers: PromiseSettledResult<unknown>[];
        try {
          racingTransfers = await Promise.allSettled([
            transferCurrentLeadPlanner(
              transferDbA,
              authorizeOrganizationLeadTransfer({
                actorId: manager,
                correlationId: randomUUID(),
                organizationId: org.organization.id,
                accessId: accepted.access!.id,
                targetOrganizationMembershipId: employeeMembership!.id,
              }),
            ),
            transferCurrentLeadPlanner(
              transferDbB,
              authorizeOrganizationLeadTransfer({
                actorId: manager,
                correlationId: randomUUID(),
                organizationId: org.organization.id,
                accessId: accepted.access!.id,
                targetOrganizationMembershipId: membership!.id,
              }),
            ),
          ]);
        } finally {
          await Promise.all([transferClientA.end(), transferClientB.end()]);
        }
        expect(
          racingTransfers.filter((result) => result.status === "fulfilled"),
        ).toHaveLength(1);
        expect(
          racingTransfers.filter((result) => result.status === "rejected"),
        ).toHaveLength(1);
        await expect(
          db
            .select({ value: count() })
            .from(tables.weddingOrganizationStaffAssignments)
            .where(
              and(
                eq(
                  tables.weddingOrganizationStaffAssignments.accessId,
                  accepted.access!.id,
                ),
                eq(tables.weddingOrganizationStaffAssignments.status, "active"),
                eq(tables.weddingOrganizationStaffAssignments.isLead, true),
              ),
            ),
        ).resolves.toEqual([{ value: 1 }]);
        await expect(
          transferCurrentLeadPlanner(
            db,
            authorizeOrganizationLeadTransfer({
              actorId: createUuidV7(),
              correlationId: randomUUID(),
              organizationId: org.organization.id,
              accessId: accepted.access!.id,
              targetOrganizationMembershipId: membership!.id,
            }),
          ),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          permissions: [{ area: "tasks", actions: ["view", "edit"] }],
          isLead: true,
        });

        const plannerSettingsAuth = () =>
          authorizeWeddingServerOperation(
            { actorId: manager },
            {
              resource: "existing",
              recordId: wedding.wedding.id,
              area: "settings",
              weddingId: wedding.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(db),
          );
        // An assigned planner's settings grant never stands in for the
        // couple's partner-only organization access/restriction authority.
        const [auditBeforeDenials] = await db
          .select({ value: count() })
          .from(tables.auditEvents);
        const [outboxBeforeDenials] = await db
          .select({ value: count() })
          .from(tables.outboxEvents);
        await expect(
          plannerSettingsAuth().then((operation) =>
            issueWeddingOrganizationInvitation(db, operation, {
              organizationId: org.organization.id,
              ceiling,
              requestId: randomUUID(),
            }),
          ),
        ).rejects.toThrow();
        await expect(
          plannerSettingsAuth().then((operation) =>
            listWeddingOrganizationInvitations(db, operation),
          ),
        ).rejects.toThrow();
        await expect(
          plannerSettingsAuth().then((operation) =>
            revokeWeddingOrganizationInvitation(
              db,
              operation,
              issued.invitation.id,
            ),
          ),
        ).rejects.toThrow();
        await expect(
          plannerSettingsAuth().then((operation) =>
            getWeddingOrganizationAccessManagement(db, operation),
          ),
        ).rejects.toThrow();
        await expect(
          plannerSettingsAuth().then((operation) =>
            setPlannerStaffRestriction(db, operation, {
              accessId: accepted.access!.id,
              organizationMembershipId: employeeMembership!.id,
              blocked: true,
            }),
          ),
        ).rejects.toThrow();
        await expect(
          plannerSettingsAuth().then((operation) =>
            revokeWeddingOrganizationAccess(db, operation, accepted.access!.id),
          ),
        ).rejects.toThrow();
        await expect(
          db.select({ value: count() }).from(tables.auditEvents),
        ).resolves.toEqual([auditBeforeDenials]);
        await expect(
          db.select({ value: count() }).from(tables.outboxEvents),
        ).resolves.toEqual([outboxBeforeDenials]);
        const secondWedding = await createCoupleWedding(
          db,
          authorizeCoupleWeddingCreation({
            actorId: partner,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Second wedding",
            weddingDate: null,
            timeZone: "Europe/Brussels",
          }),
        );
        const secondWeddingOperation = await authorizeWeddingServerOperation(
          { actorId: partner },
          {
            resource: "existing",
            recordId: secondWedding.wedding.id,
            weddingId: secondWedding.wedding.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          new DatabaseWeddingAuthorizationState(db),
        );
        const secondInvitation = await issueWeddingOrganizationInvitation(
          db,
          secondWeddingOperation,
          {
            organizationId: org.organization.id,
            ceiling: [{ area: "tasks", actions: ["view"] }],
            requestId: randomUUID(),
          },
        );
        const secondAccess = await respondWeddingOrganizationInvitation(
          db,
          await orgAuth(),
          secondInvitation.invitation.id,
          "accept",
        );
        const [auditBeforeCrossWeddingDenial] = await db
          .select({ value: count() })
          .from(tables.auditEvents);
        const [outboxBeforeCrossWeddingDenial] = await db
          .select({ value: count() })
          .from(tables.outboxEvents);
        await expect(
          revokeWeddingOrganizationAccess(
            db,
            secondWeddingOperation,
            accepted.access!.id,
          ),
        ).rejects.toThrow();
        await expect(
          db.select({ value: count() }).from(tables.auditEvents),
        ).resolves.toEqual([auditBeforeCrossWeddingDenial]);
        await expect(
          db.select({ value: count() }).from(tables.outboxEvents),
        ).resolves.toEqual([outboxBeforeCrossWeddingDenial]);
        const secondEmployeeAssignment = await assignOrganizationStaffToWedding(
          db,
          await orgAuth(),
          {
            accessId: secondAccess.access!.id,
            organizationMembershipId: employeeMembership!.id,
            permissions: [{ area: "tasks", actions: ["view"] }],
          },
        );
        const connection = {
          connectionString: config.connectionString,
          options: `-c search_path=${schemaName},public`,
        };
        const blocker = new pg.Client(connection);
        const deactivationClient = new pg.Client(connection);
        const assignmentClient = new pg.Client(connection);
        await Promise.all([
          blocker.connect(),
          deactivationClient.connect(),
          assignmentClient.connect(),
        ]);
        const deactivationDb = drizzle(deactivationClient, {
          casing: "snake_case",
          schema,
        });
        const assignmentDb = drizzle(assignmentClient, {
          casing: "snake_case",
          schema,
        });
        const [{ pid: deactivationPid }] = (
          await deactivationClient.query<{ pid: number }>(
            "SELECT pg_backend_pid() AS pid",
          )
        ).rows;
        const [{ pid: assignmentPid }] = (
          await assignmentClient.query<{ pid: number }>(
            "SELECT pg_backend_pid() AS pid",
          )
        ).rows;
        const waitForLockWaiters = async (minimum: number) => {
          let observed: Array<{
            query: string;
            waitEventType: string | null;
          }> = [];
          for (let attempt = 0; attempt < 100; attempt++) {
            const result = await blocker.query<{
              query: string;
              waitEventType: string | null;
            }>(
              `
              SELECT query,
                     wait_event_type AS "waitEventType"
              FROM pg_stat_activity
              WHERE pid = ANY($1::int[])
            `,
              [[deactivationPid!, assignmentPid!]],
            );
            observed = result.rows;
            if (
              result.rows.filter((row) => row.waitEventType === "Lock")
                .length >= minimum
            )
              return;
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
          throw new Error(
            `Expected ${minimum} lock waiter(s): ${JSON.stringify(observed)}`,
          );
        };
        const pendingOperations: Promise<unknown>[] = [];
        try {
          await blocker.query("BEGIN");
          await blocker.query(
            "SELECT id FROM organization_memberships WHERE id = $1 FOR UPDATE",
            [employeeMembership!.id],
          );
          const deactivation = deactivateOrganizationMember(
            deactivationDb,
            await orgAuth(),
            employeeMembership!.id,
          );
          pendingOperations.push(deactivation);
          await waitForLockWaiters(1);
          const racingAssignment = assignOrganizationStaffToWedding(
            assignmentDb,
            await orgAuth(),
            {
              accessId: accepted.access!.id,
              organizationMembershipId: employeeMembership!.id,
              permissions: [{ area: "tasks", actions: ["view"] }],
            },
          );
          pendingOperations.push(racingAssignment);
          await waitForLockWaiters(2);
          await blocker.query("COMMIT");
          await expect(deactivation).resolves.toMatchObject({
            id: employeeMembership!.id,
          });
          await expect(racingAssignment).rejects.toMatchObject({
            reason: "ineligible",
          });
        } finally {
          await blocker.query("ROLLBACK").catch(() => undefined);
          await Promise.allSettled(pendingOperations);
          await Promise.all([
            blocker.end(),
            deactivationClient.end(),
            assignmentClient.end(),
          ]);
        }
        expect(
          (
            await db
              .select()
              .from(tables.weddingOrganizationStaffAssignments)
              .where(
                eq(
                  tables.weddingOrganizationStaffAssignments.id,
                  employeeAssignment.id,
                ),
              )
          )[0],
        ).toMatchObject({ status: "revoked", isLead: false });
        expect(
          (
            await db
              .select()
              .from(tables.weddingMemberships)
              .where(
                eq(
                  tables.weddingMemberships.id,
                  employeeAssignment.weddingMembershipId,
                ),
              )
          )[0],
        ).toMatchObject({ status: "active", role: "planner" });
        expect(
          await db
            .select({
              status: tables.weddingOrganizationStaffAssignments.status,
            })
            .from(tables.weddingOrganizationStaffAssignments)
            .where(
              inArray(tables.weddingOrganizationStaffAssignments.id, [
                employeeAssignment.id,
                secondEmployeeAssignment.id,
              ]),
            ),
        ).toEqual([{ status: "revoked" }, { status: "revoked" }]);
        expect(
          await db
            .select({ status: tables.weddingMemberships.status })
            .from(tables.weddingMemberships)
            .where(
              inArray(tables.weddingMemberships.id, [
                employeeAssignment.weddingMembershipId,
                secondEmployeeAssignment.weddingMembershipId,
              ]),
            ),
        ).toEqual([{ status: "active" }, { status: "active" }]);
        const fallbackOp = (
          actorId: string,
          area: "tasks" | "budget",
          action: "edit" | "view",
        ) =>
          authorizeWeddingServerOperation(
            { actorId },
            {
              resource: "new",
              area,
              weddingId: wedding.wedding.id,
              action,
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(db),
          );

        // Without a designated lead, a distinct assigned manager with the
        // exact requested operation receives the approved manager fallback.
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          permissions: [{ area: "tasks", actions: ["view", "edit"] }],
          isLead: false,
        });
        const managerCapability = await fallbackOp(manager, "tasks", "edit");
        await expect(
          resolveCurrentActorPlannerFallback(db, managerCapability, {
            area: "tasks",
            action: "view",
          }),
        ).rejects.toMatchObject({ reason: "access_denied" });
        await expect(
          resolveCurrentActorPlannerFallback(db, managerCapability, {
            area: "tasks",
            action: "edit",
          }),
        ).resolves.toEqual({ kind: "manager_fallback" });
        await expect(
          resolveCurrentActorPlannerFallback(db, managerCapability, {
            area: "tasks",
            action: "edit",
          }),
        ).rejects.toThrow();

        // A designated lead who lacks the requested operation does not block
        // a distinct eligible manager, and fallback still grants no wider
        // permission than the manager's own assignment.
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          permissions: [{ area: "tasks", actions: ["view"] }],
          isLead: true,
        });
        await expect(
          resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(manager, "tasks", "edit"),
            { area: "tasks", action: "edit" },
          ),
        ).resolves.toEqual({ kind: "manager_fallback" });
        await assignOrganizationStaffToWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          permissions: [{ area: "tasks", actions: ["view", "edit"] }],
          isLead: true,
        });
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(owner, "tasks", "edit"),
            { area: "tasks", action: "edit" },
          ),
        ).toEqual({ kind: "lead" });
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(manager, "tasks", "edit"),
            { area: "tasks", action: "edit" },
          ),
        ).toEqual({ kind: "ineligible" });
        await expect(
          fallbackOp(createUuidV7(), "budget", "view"),
        ).rejects.toThrow();
        const leadOp = () =>
          authorizeWeddingServerOperation(
            { actorId: owner },
            {
              resource: "new",
              area: "tasks",
              weddingId: wedding.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(db),
          );
        await setLeadPlannerAbsence(
          db,
          await leadOp(),
          {
            accessId: accepted.access!.id,
            startsAt: new Date("2026-01-03T00:00:00Z"),
            endsAt: new Date("2026-01-05T00:00:00Z"),
          },
          new Date("2026-01-03T01:00:00Z"),
        );
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(owner, "tasks", "edit"),
            { area: "tasks", action: "edit" },
            new Date("2026-01-04T00:00:00Z"),
          ),
        ).toEqual({ kind: "ineligible" });
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(manager, "tasks", "edit"),
            { area: "tasks", action: "edit" },
            new Date("2026-01-04T00:00:00Z"),
          ),
        ).toEqual({ kind: "manager_fallback" });
        await setLeadPlannerAbsence(
          db,
          await leadOp(),
          { accessId: accepted.access!.id, startsAt: null, endsAt: null },
          new Date("2026-01-04T01:00:00Z"),
        );
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(owner, "tasks", "edit"),
            { area: "tasks", action: "edit" },
            new Date("2026-01-04T02:00:00Z"),
          ),
        ).toEqual({ kind: "lead" });
        await setPlannerStaffRestriction(db, await weddingAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          blocked: true,
        });
        await expect(fallbackOp(owner, "tasks", "edit")).rejects.toThrow();
        expect(
          (await readWeddingWorkspaceEntryState(db, { actorId: owner }))
            .accessibleWorkspaces,
        ).toEqual([]);
        expect(
          (
            await db
              .select()
              .from(tables.weddingMemberships)
              .where(
                eq(
                  tables.weddingMemberships.id,
                  assignment.weddingMembershipId,
                ),
              )
          )[0],
        ).toMatchObject({ status: "active", role: "planner" });
        const auditCountAfterBlock = (
          await db.select({ value: count() }).from(tables.auditEvents)
        )[0]!.value;
        await setPlannerStaffRestriction(db, await weddingAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          blocked: true,
        });
        expect(
          (await db.select({ value: count() }).from(tables.auditEvents))[0]!
            .value,
        ).toBe(auditCountAfterBlock);
        await setPlannerStaffRestriction(db, await weddingAuth(), {
          accessId: accepted.access!.id,
          organizationMembershipId: membership!.id,
          blocked: false,
        });
        const reassigned = await assignOrganizationStaffToWedding(
          db,
          await orgAuth(),
          {
            accessId: accepted.access!.id,
            organizationMembershipId: membership!.id,
            permissions: [{ area: "tasks", actions: ["view"] }],
            isLead: false,
          },
        );
        expect(reassigned.id).toBe(assignment.id);
        expect(
          (
            await readWeddingWorkspaceEntryState(db, { actorId: owner })
          ).accessibleWorkspaces.map((workspace) => workspace.weddingId),
        ).toContain(wedding.wedding.id);
        await removeOrganizationStaffFromWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          assignmentId: reassigned.id,
        });
        expect(
          (await readWeddingWorkspaceEntryState(db, { actorId: owner }))
            .accessibleWorkspaces,
        ).toEqual([]);
        expect(
          (
            await db
              .select()
              .from(tables.weddingOrganizationStaffAssignments)
              .where(
                eq(
                  tables.weddingOrganizationStaffAssignments.id,
                  reassigned.id,
                ),
              )
          )[0],
        ).toMatchObject({ status: "revoked", isLead: false });
        expect(
          (await db.select({ value: count() }).from(tables.auditEvents))[0]!
            .value,
        ).toBeGreaterThanOrEqual(6);
        expect(
          await revokeWeddingOrganizationAccess(
            db,
            await weddingAuth(),
            accepted.access!.id,
          ),
        ).toBe(true);
        expect(
          (
            await db
              .select()
              .from(tables.weddingOrganizationAccesses)
              .where(
                eq(tables.weddingOrganizationAccesses.id, accepted.access!.id),
              )
          )[0],
        ).toMatchObject({ status: "revoked" });
        await db
          .update(tables.weddingMemberships)
          .set({ status: "revoked", permissionScopeVersion: 2 })
          .where(
            and(
              eq(tables.weddingMemberships.weddingId, wedding.wedding.id),
              eq(tables.weddingMemberships.actorId, partner),
            ),
          );
        const [auditBeforeRevokedPartnerDenial] = await db
          .select({ value: count() })
          .from(tables.auditEvents);
        const [outboxBeforeRevokedPartnerDenial] = await db
          .select({ value: count() })
          .from(tables.outboxEvents);
        await expect(
          weddingAuth().then((operation) =>
            listWeddingOrganizationInvitations(db, operation),
          ),
        ).rejects.toThrow();
        await expect(
          db.select({ value: count() }).from(tables.auditEvents),
        ).resolves.toEqual([auditBeforeRevokedPartnerDenial]);
        await expect(
          db.select({ value: count() }).from(tables.outboxEvents),
        ).resolves.toEqual([outboxBeforeRevokedPartnerDenial]);
      },
    );
  });

  it("rejects permissions outside the couple ceiling and wrong-organization acceptance", async () => {
    await withIsolatedTestSchema(
      config,
      `planner-isolation-${randomUUID()}`,
      async ({ client }) => {
        const db = drizzle(client, { casing: "snake_case", schema });
        const partner = createUuidV7(),
          ownerA = createUuidV7(),
          ownerB = createUuidV7();
        await db.insert(tables.user).values([
          {
            id: partner,
            name: "P",
            email: "p@example.test",
            emailVerified: true,
          },
          {
            id: ownerA,
            name: "A",
            email: "a@example.test",
            emailVerified: true,
          },
          {
            id: ownerB,
            name: "B",
            email: "b@example.test",
            emailVerified: true,
          },
        ]);
        const w = await createCoupleWedding(
          db,
          authorizeCoupleWeddingCreation({
            actorId: partner,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "W",
            weddingDate: null,
            timeZone: "UTC",
          }),
        );
        const a = await createOrganization(
          db,
          authorizeOrganizationCreation({
            actorId: ownerA,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "A",
          }),
        );
        const b = await createOrganization(
          db,
          authorizeOrganizationCreation({
            actorId: ownerB,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "B",
          }),
        );
        const wa = () =>
          authorizeWeddingServerOperation(
            { actorId: partner },
            {
              resource: "existing",
              recordId: w.wedding.id,
              weddingId: w.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(db),
          );
        const oa = (actorId: string, organizationId: string) =>
          authorizeOrganizationServerOperation(
            { actorId },
            {
              organizationId,
              recordId: organizationId,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(db),
          );
        const issued = await issueWeddingOrganizationInvitation(
          db,
          await wa(),
          {
            organizationId: a.organization.id,
            ceiling: [{ area: "tasks", actions: ["view"] }],
            requestId: randomUUID(),
          },
        );
        await expect(
          respondWeddingOrganizationInvitation(
            db,
            await oa(ownerB, b.organization.id),
            issued.invitation.id,
            "accept",
          ),
        ).rejects.toMatchObject({ reason: "invalid" });
        const accepted = await respondWeddingOrganizationInvitation(
          db,
          await oa(ownerA, a.organization.id),
          issued.invitation.id,
          "accept",
        );
        const [member] = await db
          .select()
          .from(tables.organizationMemberships)
          .where(eq(tables.organizationMemberships.actorId, ownerA));
        const [otherMember] = await db
          .select()
          .from(tables.organizationMemberships)
          .where(eq(tables.organizationMemberships.actorId, ownerB));
        await expect(
          setPlannerStaffRestriction(db, await wa(), {
            accessId: accepted.access!.id,
            organizationMembershipId: otherMember!.id,
            blocked: true,
          }),
        ).rejects.toMatchObject({ reason: "invalid" });
        await expect(
          assignOrganizationStaffToWedding(
            db,
            await oa(ownerA, a.organization.id),
            {
              accessId: accepted.access!.id,
              organizationMembershipId: member!.id,
              permissions: [{ area: "tasks", actions: ["view", "edit"] }],
            },
          ),
        ).rejects.toMatchObject({ reason: "ineligible" });
      },
    );
  });
});
