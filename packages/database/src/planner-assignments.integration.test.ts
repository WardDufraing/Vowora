import { randomUUID } from "node:crypto";
import { count, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  authorizeCoupleWeddingCreation,
  authorizeOrganizationCreation,
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
} from "./weddings.js";
import {
  createOrganization,
  DatabaseOrganizationAuthorizationState,
  deactivateOrganizationMember,
} from "./organizations.js";
import {
  assignOrganizationStaffToWedding,
  issueWeddingOrganizationInvitation,
  listOrganizationWeddingInvitations,
  removeOrganizationStaffFromWedding,
  resolveCurrentActorPlannerFallback,
  respondWeddingOrganizationInvitation,
  revokeWeddingOrganizationAccess,
  setPlannerStaffRestriction,
  setLeadPlannerAbsence,
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
          employee = createUuidV7();
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
        const employeeAssignment = await assignOrganizationStaffToWedding(
          db,
          await orgAuth(),
          {
            accessId: accepted.access!.id,
            organizationMembershipId: employeeMembership!.id,
            permissions: [{ area: "tasks", actions: ["view"] }],
          },
        );
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
        ).toMatchObject({ status: "revoked" });
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
        ).toEqual([{ status: "revoked" }, { status: "revoked" }]);
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
        expect(
          await resolveCurrentActorPlannerFallback(
            db,
            await fallbackOp(owner, "tasks", "edit"),
            { area: "tasks", action: "edit" },
          ),
        ).toEqual({ kind: "lead" });
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
        ).toMatchObject({ status: "revoked" });
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
        await removeOrganizationStaffFromWedding(db, await orgAuth(), {
          accessId: accepted.access!.id,
          assignmentId: reassigned.id,
        });
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
