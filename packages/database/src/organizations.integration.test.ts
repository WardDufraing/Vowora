import { randomUUID } from "node:crypto";

import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  authorizeOrganizationCreation,
  authorizeOrganizationInvitationClaim,
  authorizeOrganizationServerOperation,
} from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  auditEvents,
  organizationInvitations,
  organizationMemberships,
  organizations,
  outboxEvents,
  user,
} from "./schema.js";
import { createUuidV7 } from "./uuid.js";
import {
  acceptOrganizationInvitation,
  createOrganization,
  DatabaseOrganizationAuthorizationState,
  deactivateOrganizationMember,
  issueOrganizationInvitation,
  listOrganizationInvitations,
  listOrganizationStaff,
  revokeOrganizationInvitation,
} from "./organizations.js";

const config = parseTestMigrationConfig(process.env);
const schema = {
  auditEvents,
  organizationInvitations,
  organizationMemberships,
  organizations,
  outboxEvents,
  user,
};

describe("organization and staff persistence", () => {
  it("creates an owner, accepts verified staff once, and deactivates without erasing history", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const employeeId = createUuidV7();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "owner@example.test",
            emailVerified: true,
          },
          {
            id: employeeId,
            name: "Employee",
            email: "employee@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "North Star",
          }),
        );
        const authorize = () =>
          authorizeOrganizationServerOperation(
            { actorId: ownerId },
            {
              organizationId: created.organization.id,
              recordId: created.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(database),
          );
        const now = new Date();
        const issued = await issueOrganizationInvitation(
          database,
          await authorize(),
          {
            email: " Employee@Example.Test ",
            role: "employee",
            locale: "en",
            issuanceRequestId: randomUUID(),
            now,
          },
        );
        const [stored] = await database.select().from(organizationInvitations);
        expect(stored?.tokenDigest).toMatch(/^[0-9a-f]{64}$/);
        expect(stored?.expiresAt.toISOString()).toBe(
          new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        );
        expect(stored?.reminderAt.toISOString()).toBe(
          new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        );
        expect(
          JSON.stringify(
            (await database.select().from(outboxEvents)).map(
              (row) => row.payload,
            ),
          ),
        ).not.toContain(issued.token);
        const claimed = await acceptOrganizationInvitation(
          database,
          authorizeOrganizationInvitationClaim({
            actorId: employeeId,
            correlationId: randomUUID(),
            token: issued.token!,
          }),
        );
        expect(claimed).toEqual({
          organizationId: created.organization.id,
          replayed: false,
        });
        await expect(
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              token: issued.token!,
            }),
          ),
        ).resolves.toMatchObject({ replayed: true });
        const staff = await listOrganizationStaff(database, await authorize());
        expect(staff.map((member) => member.role).sort()).toEqual([
          "employee",
          "owner",
        ]);
        expect(
          staff.find((member) => member.actorId === employeeId),
        ).toMatchObject({
          name: "Employee",
          email: "employee@example.test",
        });
        const employee = staff.find((member) => member.actorId === employeeId)!;
        const [joinAudit] = await database
          .select({ subjectId: auditEvents.subjectId })
          .from(auditEvents)
          .where(eq(auditEvents.eventType, "organization.staff_joined"));
        expect(joinAudit?.subjectId).toBe(employee.id);
        await expect(
          deactivateOrganizationMember(
            database,
            await authorize(),
            employee.id,
          ),
        ).resolves.toMatchObject({ actorId: employeeId });
        expect(
          (await database.select({ value: count() }).from(auditEvents))[0]
            ?.value,
        ).toBe(4);
        expect(
          (await database.select({ value: count() }).from(outboxEvents))[0]
            ?.value,
        ).toBe(4);
        expect(
          (
            await database
              .select()
              .from(organizationMemberships)
              .where(eq(organizationMemberships.actorId, employeeId))
          )[0],
        ).toMatchObject({ status: "revoked", permissionScopeVersion: 2 });
        await expect(
          issueOrganizationInvitation(database, await authorize(), {
            email: "employee@example.test",
            role: "employee",
            locale: "en",
            issuanceRequestId: randomUUID(),
          }),
        ).rejects.toMatchObject({ reason: "member_exists" });
      },
    );
  });

  it("denies wrong-email claims, cross-organization management, and owner deactivation", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-isolation-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerA = createUuidV7();
        const ownerB = createUuidV7();
        const wrong = createUuidV7();
        await database.insert(user).values([
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
          {
            id: wrong,
            name: "Wrong",
            email: "wrong@example.test",
            emailVerified: true,
          },
        ]);
        const create = (actorId: string, name: string) =>
          createOrganization(
            database,
            authorizeOrganizationCreation({
              actorId,
              correlationId: randomUUID(),
              creationRequestId: randomUUID(),
              name,
            }),
          );
        const [a, b] = await Promise.all([
          create(ownerA, "A Org"),
          create(ownerB, "B Org"),
        ]);
        const authorizeA = () =>
          authorizeOrganizationServerOperation(
            { actorId: ownerA },
            {
              organizationId: a.organization.id,
              recordId: a.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(database),
          );
        const operationA = await authorizeA();
        const issued = await issueOrganizationInvitation(database, operationA, {
          email: "b@example.test",
          role: "manager",
          locale: "en",
          issuanceRequestId: randomUUID(),
        });
        await expect(
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: wrong,
              correlationId: randomUUID(),
              token: issued.token!,
            }),
          ),
        ).rejects.toMatchObject({ reason: "email_mismatch" });
        await expect(
          authorizeOrganizationServerOperation(
            { actorId: ownerA },
            {
              organizationId: b.organization.id,
              recordId: b.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(database),
          ),
        ).rejects.toMatchObject({ failure: "access_denied" });
        const ownerMembership = (
          await listOrganizationStaff(database, await authorizeA())
        ).find((member) => member.actorId === ownerA)!;
        await expect(
          deactivateOrganizationMember(
            database,
            await authorizeA(),
            ownerMembership.id,
          ),
        ).rejects.toMatchObject({ reason: "invalid" });
      },
    );
  });

  it("allows managers to manage non-owner staff while employees remain read-only", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-roles-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const managerId = createUuidV7();
        const employeeId = createUuidV7();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "owner-roles@example.test",
            emailVerified: true,
          },
          {
            id: managerId,
            name: "Manager",
            email: "manager@example.test",
            emailVerified: true,
          },
          {
            id: employeeId,
            name: "Employee",
            email: "employee-roles@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Role Boundaries",
          }),
        );
        const state = new DatabaseOrganizationAuthorizationState(database);
        const authorize = (actorId: string) =>
          authorizeOrganizationServerOperation(
            { actorId },
            {
              organizationId: created.organization.id,
              recordId: created.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            state,
          );
        for (const invitee of [
          {
            actorId: managerId,
            email: "manager@example.test",
            role: "manager" as const,
          },
          {
            actorId: employeeId,
            email: "employee-roles@example.test",
            role: "employee" as const,
          },
        ]) {
          const invitation = await issueOrganizationInvitation(
            database,
            await authorize(ownerId),
            {
              email: invitee.email,
              role: invitee.role,
              locale: "en",
              issuanceRequestId: randomUUID(),
            },
          );
          await acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: invitee.actorId,
              correlationId: randomUUID(),
              token: invitation.token!,
            }),
          );
        }

        await expect(authorize(employeeId)).rejects.toMatchObject({
          failure: "access_denied",
        });
        const managerOperation = await authorize(managerId);
        const staff = await listOrganizationStaff(database, managerOperation);
        const employee = staff.find((member) => member.actorId === employeeId)!;
        await expect(
          deactivateOrganizationMember(
            database,
            await authorize(managerId),
            employee.id,
          ),
        ).resolves.toMatchObject({ actorId: employeeId });
      },
    );
  });

  it("keeps organization bootstrap idempotent for an explicit trusted request", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-idempotency-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const unverifiedId = createUuidV7();
        const creationRequestId = randomUUID();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "idempotent-owner@example.test",
            emailVerified: true,
          },
          {
            id: unverifiedId,
            name: "Unverified",
            email: "unverified-owner@example.test",
            emailVerified: false,
          },
        ]);
        const create = (name: string) =>
          createOrganization(
            database,
            authorizeOrganizationCreation({
              actorId: ownerId,
              correlationId: randomUUID(),
              creationRequestId,
              name,
            }),
          );
        const first = await create("Trusted bootstrap");
        await expect(create("Trusted bootstrap")).resolves.toEqual({
          organization: first.organization,
          replayed: true,
        });
        await expect(create("Different organization")).rejects.toMatchObject({
          reason: "idempotency",
        });
        await expect(
          createOrganization(
            database,
            authorizeOrganizationCreation({
              actorId: unverifiedId,
              correlationId: randomUUID(),
              creationRequestId: randomUUID(),
              name: "Unverified Org",
            }),
          ),
        ).rejects.toMatchObject({ fields: ["verifiedIdentity"] });
        expect(
          (await database.select({ value: count() }).from(organizations))[0]
            ?.value,
        ).toBe(1);
        expect(
          (
            await database
              .select({ value: count() })
              .from(organizationMemberships)
          )[0]?.value,
        ).toBe(1);
      },
    );
  });

  it("reissues and revokes pending invitations without exposing the old capability", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-reissue-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const employeeId = createUuidV7();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "reissue-owner@example.test",
            emailVerified: true,
          },
          {
            id: employeeId,
            name: "Employee",
            email: "reissue-employee@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Reissue Org",
          }),
        );
        const authorize = () =>
          authorizeOrganizationServerOperation(
            { actorId: ownerId },
            {
              organizationId: created.organization.id,
              recordId: created.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            new DatabaseOrganizationAuthorizationState(database),
          );
        const firstRequestId = randomUUID();
        const first = await issueOrganizationInvitation(
          database,
          await authorize(),
          {
            email: "reissue-employee@example.test",
            role: "employee",
            locale: "en",
            issuanceRequestId: firstRequestId,
          },
        );
        const replay = await issueOrganizationInvitation(
          database,
          await authorize(),
          {
            email: "reissue-employee@example.test",
            role: "employee",
            locale: "en",
            issuanceRequestId: firstRequestId,
          },
        );
        expect(replay).toMatchObject({
          invitation: { id: first.invitation.id },
          replayed: true,
          token: undefined,
        });
        await expect(
          issueOrganizationInvitation(database, await authorize(), {
            email: "reissue-employee@example.test",
            role: "manager",
            locale: "en",
            issuanceRequestId: firstRequestId,
          }),
        ).rejects.toMatchObject({ reason: "idempotency" });
        await expect(
          issueOrganizationInvitation(database, await authorize(), {
            email: "reissue-employee@example.test",
            role: "employee",
            locale: "en",
            issuanceRequestId: randomUUID(),
          }),
        ).rejects.toMatchObject({ reason: "invitation_exists" });
        expect(
          (
            await database
              .select({ value: count() })
              .from(outboxEvents)
              .where(eq(outboxEvents.eventType, "organization.staff_invited"))
          )[0]?.value,
        ).toBe(1);
        const second = await issueOrganizationInvitation(
          database,
          await authorize(),
          {
            email: "reissue-employee@example.test",
            role: "manager",
            locale: "nl",
            issuanceRequestId: randomUUID(),
            reissueInvitationId: first.invitation.id,
          },
        );
        expect(second.replayed).toBe(false);
        expect(second.token).not.toBe(first.token);
        await expect(
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              token: first.token!,
            }),
          ),
        ).rejects.toMatchObject({ reason: "already_claimed" });
        expect(
          await listOrganizationInvitations(database, await authorize()),
        ).toHaveLength(1);
        await expect(
          revokeOrganizationInvitation(
            database,
            await authorize(),
            second.invitation.id,
          ),
        ).resolves.toBe(true);
        await expect(
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              token: second.token!,
            }),
          ),
        ).rejects.toMatchObject({ reason: "already_claimed" });
      },
    );
  });

  it("serializes bearer and verified-email acceptance into one membership", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-concurrency-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const employeeId = createUuidV7();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "concurrent-owner@example.test",
            emailVerified: true,
          },
          {
            id: employeeId,
            name: "Employee",
            email: "concurrent-employee@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Concurrent Org",
          }),
        );
        const operation = await authorizeOrganizationServerOperation(
          { actorId: ownerId },
          {
            organizationId: created.organization.id,
            recordId: created.organization.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          new DatabaseOrganizationAuthorizationState(database),
        );
        const issued = await issueOrganizationInvitation(database, operation, {
          email: "concurrent-employee@example.test",
          role: "employee",
          locale: "en",
          issuanceRequestId: randomUUID(),
        });
        const results = await Promise.all([
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              token: issued.token!,
            }),
          ),
          acceptOrganizationInvitation(
            database,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              invitationId: issued.invitation.id,
            }),
          ),
        ]);
        expect(results.map((result) => result.replayed).sort()).toEqual([
          false,
          true,
        ]);
        expect(
          (
            await database
              .select({ value: count() })
              .from(organizationMemberships)
              .where(
                and(
                  eq(
                    organizationMemberships.organizationId,
                    created.organization.id,
                  ),
                  eq(organizationMemberships.actorId, employeeId),
                ),
              )
          )[0]?.value,
        ).toBe(1);
      },
    );
  });

  it("serializes concurrent invitation retries without duplicate delivery facts", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-issue-retry-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        await database.insert(user).values({
          id: ownerId,
          name: "Owner",
          email: "retry-owner@example.test",
          emailVerified: true,
        });
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Retry Org",
          }),
        );
        const state = new DatabaseOrganizationAuthorizationState(database);
        const requestId = randomUUID();
        const issue = async () =>
          issueOrganizationInvitation(
            database,
            await authorizeOrganizationServerOperation(
              { actorId: ownerId },
              {
                organizationId: created.organization.id,
                recordId: created.organization.id,
                action: "edit",
                correlationId: randomUUID(),
              },
              state,
            ),
            {
              email: "retry-staff@example.test",
              role: "employee",
              locale: "en",
              issuanceRequestId: requestId,
            },
          );
        const results = await Promise.all([issue(), issue()]);
        expect(results.map((result) => result.replayed).sort()).toEqual([
          false,
          true,
        ]);
        expect(results.filter((result) => result.token).length).toBe(1);
        expect(
          (
            await database
              .select({ value: count() })
              .from(organizationInvitations)
          )[0]?.value,
        ).toBe(1);
        expect(
          (
            await database
              .select({ value: count() })
              .from(outboxEvents)
              .where(eq(outboxEvents.eventType, "organization.staff_invited"))
          )[0]?.value,
        ).toBe(1);
      },
    );
  });

  it("serializes acceptance before reissue so joined staff cannot retain a pending invite", async () => {
    await withIsolatedTestSchema(
      config,
      `organization-accept-reissue-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const database = drizzle(client, { casing: "snake_case", schema });
        const ownerId = createUuidV7();
        const employeeId = createUuidV7();
        await database.insert(user).values([
          {
            id: ownerId,
            name: "Owner",
            email: "race-owner@example.test",
            emailVerified: true,
          },
          {
            id: employeeId,
            name: "Employee",
            email: "race-employee@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createOrganization(
          database,
          authorizeOrganizationCreation({
            actorId: ownerId,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Race Org",
          }),
        );
        const state = new DatabaseOrganizationAuthorizationState(database);
        const authorize = () =>
          authorizeOrganizationServerOperation(
            { actorId: ownerId },
            {
              organizationId: created.organization.id,
              recordId: created.organization.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            state,
          );
        const issued = await issueOrganizationInvitation(
          database,
          await authorize(),
          {
            email: "race-employee@example.test",
            role: "employee",
            locale: "en",
            issuanceRequestId: randomUUID(),
          },
        );
        const pool = new pg.Pool({
          connectionString: config.connectionString,
          max: 3,
          options: `-c search_path=${schemaName},public`,
        });
        const concurrentDatabase = drizzle(pool, {
          casing: "snake_case",
          schema,
        });
        const blocker = await pool.connect();
        try {
          await blocker.query("BEGIN");
          await blocker.query(
            "SELECT id FROM organization_invitations WHERE id = $1 FOR UPDATE",
            [issued.invitation.id],
          );
          const acceptance = acceptOrganizationInvitation(
            concurrentDatabase,
            authorizeOrganizationInvitationClaim({
              actorId: employeeId,
              correlationId: randomUUID(),
              token: issued.token!,
            }),
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          const reissue = authorize().then((operation) =>
            issueOrganizationInvitation(concurrentDatabase, operation, {
              email: "race-employee@example.test",
              role: "manager",
              locale: "en",
              issuanceRequestId: randomUUID(),
              reissueInvitationId: issued.invitation.id,
            }),
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          await blocker.query("COMMIT");
          await expect(acceptance).resolves.toMatchObject({ replayed: false });
          await expect(reissue).rejects.toMatchObject({
            reason: "member_exists",
          });
        } finally {
          await blocker.query("ROLLBACK").catch(() => undefined);
          blocker.release();
          await pool.end();
        }
        expect(
          (
            await database
              .select({ value: count() })
              .from(organizationMemberships)
              .where(
                and(
                  eq(
                    organizationMemberships.organizationId,
                    created.organization.id,
                  ),
                  eq(organizationMemberships.actorId, employeeId),
                ),
              )
          )[0]?.value,
        ).toBe(1);
        expect(
          (
            await database
              .select({ value: count() })
              .from(organizationInvitations)
              .where(
                and(
                  eq(
                    organizationInvitations.organizationId,
                    created.organization.id,
                  ),
                  eq(organizationInvitations.status, "pending"),
                ),
              )
          )[0]?.value,
        ).toBe(0);
        expect(
          (
            await database
              .select({ value: count() })
              .from(outboxEvents)
              .where(eq(outboxEvents.eventType, "organization.staff_invited"))
          )[0]?.value,
        ).toBe(1);
      },
    );
  });
});
