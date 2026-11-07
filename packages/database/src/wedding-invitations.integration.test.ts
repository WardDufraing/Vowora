import { randomUUID } from "node:crypto";

import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  authorizeCoupleWeddingCreation,
  authorizeWeddingServerOperation,
} from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  auditEvents,
  outboxEvents,
  user,
  weddingInvitations,
  weddingMemberships,
  weddings,
} from "./schema.js";
import { createUuidV7 } from "./uuid.js";
import {
  acceptPartnerInvitation,
  issuePartnerInvitation,
  revokePartnerInvitation,
} from "./wedding-invitations.js";
import {
  createCoupleWedding,
  DatabaseWeddingAuthorizationState,
} from "./weddings.js";

const config = parseTestMigrationConfig(process.env);

describe("partner invitation persistence", () => {
  it("issues a digest-only 14-day invitation and accepts it once for the verified email", async () => {
    await withIsolatedTestSchema(
      config,
      `partner-invite-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingInvitations,
            weddingMemberships,
            weddings,
          },
        });
        const sender = createUuidV7();
        const recipient = createUuidV7();
        await database.insert(user).values([
          {
            id: sender,
            name: "Sender",
            email: `${sender}@example.test`,
            emailVerified: true,
          },
          {
            id: recipient,
            name: "Recipient",
            email: "partner@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createCoupleWedding(
          database,
          authorizeCoupleWeddingCreation({
            actorId: sender,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Jordan & Alex",
            weddingDate: null,
            timeZone: "Europe/Brussels",
          }),
        );
        const operation = await authorizeWeddingServerOperation(
          { actorId: sender },
          {
            resource: "existing",
            recordId: created.wedding.id,
            weddingId: created.wedding.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          new DatabaseWeddingAuthorizationState(database),
        );
        const issuedAt = new Date("2026-11-07T12:00:00.000Z");
        const issued = await issuePartnerInvitation(database, operation, {
          email: " Partner@Example.Test ",
          now: issuedAt,
        });
        expect(issued.invitation).toMatchObject({
          invitedEmail: "partner@example.test",
          expiresAt: "2026-11-21T12:00:00.000Z",
          reminderAt: "2026-11-18T12:00:00.000Z",
          status: "pending",
        });
        const [stored] = await database.select().from(weddingInvitations);
        expect(stored?.tokenDigest).toMatch(/^[0-9a-f]{64}$/);
        expect(stored?.tokenDigest).not.toContain(issued.token);

        const pool = new pg.Pool({
          connectionString: config.connectionString,
          max: 2,
          options: `-c search_path=${schemaName},public`,
        });
        const concurrentDatabase = drizzle(pool, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingInvitations,
            weddingMemberships,
            weddings,
          },
        });
        let first;
        let replay;
        try {
          [first, replay] = await Promise.all([
            acceptPartnerInvitation(concurrentDatabase, {
              actorId: recipient,
              correlationId: randomUUID(),
              token: issued.token,
              now: new Date("2026-11-08T12:00:00.000Z"),
            }),
            acceptPartnerInvitation(concurrentDatabase, {
              actorId: recipient,
              correlationId: randomUUID(),
              token: issued.token,
              now: new Date("2026-11-08T12:00:00.000Z"),
            }),
          ]);
        } finally {
          await pool.end();
        }
        expect([first!.replayed, replay!.replayed].sort()).toEqual([
          false,
          true,
        ]);
        expect(
          (
            await database
              .select({ value: count() })
              .from(weddingMemberships)
              .where(eq(weddingMemberships.role, "partner"))
          )[0]?.value,
        ).toBe(2);
        expect(
          (await database.select({ value: count() }).from(auditEvents))[0]
            ?.value,
        ).toBe(3);
        expect(
          (await database.select({ value: count() }).from(outboxEvents))[0]
            ?.value,
        ).toBe(3);
      },
    );
  });

  it("denies wrong, unverified, and expired accounts without creating membership", async () => {
    await withIsolatedTestSchema(
      config,
      `partner-invite-denial-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingInvitations,
            weddingMemberships,
            weddings,
          },
        });
        const sender = createUuidV7();
        const recipient = createUuidV7();
        const wrong = createUuidV7();
        await database.insert(user).values([
          {
            id: sender,
            name: "Sender",
            email: `${sender}@example.test`,
            emailVerified: true,
          },
          {
            id: recipient,
            name: "Recipient",
            email: "partner@example.test",
            emailVerified: false,
          },
          {
            id: wrong,
            name: "Wrong",
            email: "wrong@example.test",
            emailVerified: true,
          },
        ]);
        const created = await createCoupleWedding(
          database,
          authorizeCoupleWeddingCreation({
            actorId: sender,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Wedding",
            weddingDate: null,
            timeZone: "UTC",
          }),
        );
        const operation = await authorizeWeddingServerOperation(
          { actorId: sender },
          {
            resource: "existing",
            recordId: created.wedding.id,
            weddingId: created.wedding.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          new DatabaseWeddingAuthorizationState(database),
        );
        const issued = await issuePartnerInvitation(database, operation, {
          email: "partner@example.test",
          now: new Date("2026-11-07T12:00:00.000Z"),
        });
        await expect(
          acceptPartnerInvitation(database, {
            actorId: wrong,
            correlationId: randomUUID(),
            token: issued.token,
            now: new Date("2026-11-08T12:00:00.000Z"),
          }),
        ).rejects.toMatchObject({
          reason: "email_mismatch",
        });
        await expect(
          acceptPartnerInvitation(database, {
            actorId: recipient,
            correlationId: randomUUID(),
            token: issued.token,
            now: new Date("2026-11-08T12:00:00.000Z"),
          }),
        ).rejects.toMatchObject({
          reason: "email_unverified",
        });
        await database
          .update(user)
          .set({ emailVerified: true })
          .where(eq(user.id, recipient));
        await expect(
          acceptPartnerInvitation(database, {
            actorId: recipient,
            correlationId: randomUUID(),
            token: issued.token,
            now: new Date("2026-11-21T12:00:00.000Z"),
          }),
        ).rejects.toMatchObject({
          reason: "expired",
        });
        expect(
          (
            await database.select({ value: count() }).from(weddingMemberships)
          )[0]?.value,
        ).toBe(1);
      },
    );
  });

  it("renews an expired invitation only to its original authorized email", async () => {
    await withIsolatedTestSchema(
      config,
      `partner-invite-renewal-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingInvitations,
            weddingMemberships,
            weddings,
          },
        });
        const sender = createUuidV7();
        await database.insert(user).values({
          id: sender,
          name: "Sender",
          email: `${sender}@example.test`,
          emailVerified: true,
        });
        const created = await createCoupleWedding(
          database,
          authorizeCoupleWeddingCreation({
            actorId: sender,
            correlationId: randomUUID(),
            creationRequestId: randomUUID(),
            name: "Wedding",
            weddingDate: null,
            timeZone: "UTC",
          }),
        );
        const authorize = () =>
          authorizeWeddingServerOperation(
            { actorId: sender },
            {
              resource: "existing" as const,
              recordId: created.wedding.id,
              weddingId: created.wedding.id,
              action: "edit" as const,
              correlationId: randomUUID(),
            },
            new DatabaseWeddingAuthorizationState(database),
          );
        const original = await issuePartnerInvitation(
          database,
          await authorize(),
          {
            email: "partner@example.test",
            now: new Date("2026-11-01T00:00:00.000Z"),
          },
        );
        await expect(
          issuePartnerInvitation(database, await authorize(), {
            email: "other@example.test",
            now: new Date("2026-11-16T00:00:00.000Z"),
          }),
        ).rejects.toMatchObject({ reason: "pending_exists" });
        const renewed = await issuePartnerInvitation(
          database,
          await authorize(),
          {
            email: "partner@example.test",
            now: new Date("2026-11-16T00:00:00.000Z"),
          },
        );
        expect(renewed.token).not.toBe(original.token);
        expect(renewed.invitation.expiresAt).toBe("2026-11-30T00:00:00.000Z");
        const rows = await database
          .select()
          .from(weddingInvitations)
          .orderBy(weddingInvitations.createdAt);
        expect(rows.map(({ status }) => status)).toEqual([
          "replaced",
          "pending",
        ]);
        expect(rows[0]?.replacedByInvitationId).toBe(rows[1]?.id);
        await expect(
          revokePartnerInvitation(
            database,
            await authorize(),
            renewed.invitation.id,
            new Date("2026-11-16T01:00:00.000Z"),
          ),
        ).resolves.toBe(true);
        await expect(
          acceptPartnerInvitation(database, {
            actorId: sender,
            correlationId: randomUUID(),
            token: renewed.token,
            now: new Date("2026-11-16T02:00:00.000Z"),
          }),
        ).rejects.toMatchObject({ reason: "already_claimed" });
      },
    );
  });
});
