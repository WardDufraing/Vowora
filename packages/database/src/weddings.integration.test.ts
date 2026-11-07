import { randomUUID } from "node:crypto";

import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  authorizeCoupleWeddingCreation,
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
  WeddingCreationAuthorizationError,
} from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import {
  auditEvents,
  outboxEvents,
  user,
  weddingMemberships,
  weddings,
} from "./schema.js";
import { withIsolatedTestSchema } from "./migrations.js";
import { createUuidV7 } from "./uuid.js";
import {
  createCoupleWedding,
  DatabaseWeddingAuthorizationState,
  listAccessibleWeddingWorkspaces,
  updateWeddingSettings,
  WeddingCreationConflictError,
  WeddingSettingsConflictError,
} from "./weddings.js";

const config = parseTestMigrationConfig(process.env);

function command(input: {
  actorId: string;
  creationRequestId?: string;
  name?: string;
  timeZone?: string;
}) {
  return authorizeCoupleWeddingCreation({
    actorId: input.actorId,
    correlationId: randomUUID(),
    creationRequestId: input.creationRequestId ?? randomUUID(),
    name: input.name ?? "Jordan & Alex",
    weddingDate: "2027-06-12",
    timeZone: input.timeZone ?? "Europe/Brussels",
  });
}

describe("wedding workspace persistence", () => {
  it("creates the partner membership and audit/outbox atomically", async () => {
    await withIsolatedTestSchema(
      config,
      `wedding-create-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingMemberships,
            weddings,
          },
        });
        const actorId = createUuidV7();
        await database.insert(user).values({
          id: actorId,
          name: "Jordan",
          email: `${actorId}@example.test`,
        });
        const result = await createCoupleWedding(
          database,
          command({ actorId }),
        );
        expect(result.replayed).toBe(false);
        expect(result.wedding.settingsVersion).toBe(1);

        const [membership] = await database
          .select()
          .from(weddingMemberships)
          .where(eq(weddingMemberships.weddingId, result.wedding.id));
        expect(membership).toMatchObject({
          actorId,
          role: "partner",
          status: "active",
          accessExpiresAt: null,
          permissionOverrides: [],
        });
        expect(
          (await database.select({ value: count() }).from(auditEvents))[0]
            ?.value,
        ).toBe(1);
        expect(
          (await database.select({ value: count() }).from(outboxEvents))[0]
            ?.value,
        ).toBe(1);

        const missingActor = createUuidV7();
        await expect(
          createCoupleWedding(database, command({ actorId: missingActor })),
        ).rejects.toThrow();
        expect(
          (
            await database
              .select({ value: count() })
              .from(weddings)
              .where(eq(weddings.creatorActorId, missingActor))
          )[0]?.value,
        ).toBe(0);
      },
    );
  });

  it("serializes concurrent retries and rejects changed payload reuse", async () => {
    await withIsolatedTestSchema(
      config,
      `wedding-idempotency-${randomUUID()}`,
      async ({ client, schemaName }) => {
        const actorId = createUuidV7();
        await client.query(
          "INSERT INTO auth_user (id, name, email) VALUES ($1, $2, $3)",
          [actorId, "Alex", `${actorId}@example.test`],
        );
        const pool = new pg.Pool({
          connectionString: config.connectionString,
          max: 2,
          options: `-c search_path=${schemaName},public`,
        });
        const database = drizzle(pool, {
          casing: "snake_case",
          schema: { auditEvents, outboxEvents, weddingMemberships, weddings },
        });
        const creationRequestId = randomUUID();
        try {
          const results = await Promise.all([
            createCoupleWedding(
              database,
              command({ actorId, creationRequestId }),
            ),
            createCoupleWedding(
              database,
              command({ actorId, creationRequestId }),
            ),
          ]);
          expect(results.map(({ replayed }) => replayed).sort()).toEqual([
            false,
            true,
          ]);
          expect(results[0]?.wedding.id).toBe(results[1]?.wedding.id);
          expect(
            (await database.select({ value: count() }).from(weddings))[0]
              ?.value,
          ).toBe(1);
          expect(
            (await database.select({ value: count() }).from(auditEvents))[0]
              ?.value,
          ).toBe(1);
          await expect(
            createCoupleWedding(
              database,
              command({ actorId, creationRequestId, name: "Different" }),
            ),
          ).rejects.toBeInstanceOf(WeddingCreationConflictError);
        } finally {
          await pool.end();
        }
      },
    );
  });

  it("lists exact-actor active workspaces by personal recency and records the opened wedding", async () => {
    await withIsolatedTestSchema(
      config,
      `wedding-workspaces-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingMemberships,
            weddings,
          },
        });
        const actorId = createUuidV7();
        const otherActorId = createUuidV7();
        await database.insert(user).values([
          { id: actorId, name: "Jordan", email: `${actorId}@example.test` },
          {
            id: otherActorId,
            name: "Other",
            email: `${otherActorId}@example.test`,
          },
        ]);
        const older = await createCoupleWedding(
          database,
          command({ actorId, name: "Older accessible" }),
        );
        const opened = await createCoupleWedding(
          database,
          command({ actorId, name: "Just opened" }),
        );
        const revoked = await createCoupleWedding(
          database,
          command({ actorId, name: "Revoked" }),
        );
        const expired = await createCoupleWedding(
          database,
          command({ actorId, name: "Expired" }),
        );
        await createCoupleWedding(
          database,
          command({ actorId: otherActorId, name: "Other actor" }),
        );
        await database
          .update(weddingMemberships)
          .set({ lastOpenedAt: new Date("2026-01-04T00:00:00.000Z") })
          .where(eq(weddingMemberships.weddingId, older.wedding.id));
        await database
          .update(weddingMemberships)
          .set({ lastOpenedAt: new Date("2026-01-01T00:00:00.000Z") })
          .where(eq(weddingMemberships.weddingId, opened.wedding.id));
        await database
          .update(weddingMemberships)
          .set({ status: "revoked" })
          .where(eq(weddingMemberships.weddingId, revoked.wedding.id));
        await database
          .update(weddingMemberships)
          .set({
            role: "coordinator",
            accessExpiresAt: new Date("2026-01-02T00:00:00.000Z"),
          })
          .where(eq(weddingMemberships.weddingId, expired.wedding.id));

        const now = new Date("2026-01-05T00:00:00.000Z");
        const workspaces = await listAccessibleWeddingWorkspaces(database, {
          actorId,
          openedWeddingId: opened.wedding.id,
          now,
        });
        expect(workspaces.map(({ name }) => name)).toEqual([
          "Just opened",
          "Older accessible",
        ]);
        expect(workspaces[0]).toMatchObject({
          weddingId: opened.wedding.id,
          lastOpenedAt: now.toISOString(),
          membership: { actorId, status: "active" },
        });
        expect(
          workspaces.every(({ membership }) => membership.actorId === actorId),
        ).toBe(true);
      },
    );
  });

  it("revalidates tenant membership and optimistic settings version", async () => {
    await withIsolatedTestSchema(
      config,
      `wedding-settings-${randomUUID()}`,
      async ({ client }) => {
        const database = drizzle(client, {
          casing: "snake_case",
          schema: {
            auditEvents,
            outboxEvents,
            user,
            weddingMemberships,
            weddings,
          },
        });
        const actorId = createUuidV7();
        const otherActorId = createUuidV7();
        await database.insert(user).values([
          { id: actorId, name: "Jordan", email: `${actorId}@example.test` },
          {
            id: otherActorId,
            name: "Other",
            email: `${otherActorId}@example.test`,
          },
        ]);
        const created = await createCoupleWedding(
          database,
          command({ actorId }),
        );
        const state = new DatabaseWeddingAuthorizationState(database);
        const operation = await authorizeWeddingServerOperation(
          { actorId },
          {
            resource: "existing",
            recordId: created.wedding.id,
            weddingId: created.wedding.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          state,
        );
        const updated = await updateWeddingSettings(database, operation, {
          expectedVersion: 1,
          name: "Jordan & Alex updated",
          weddingDate: null,
          timeZone: "Europe/Amsterdam",
        });
        expect(updated).toMatchObject({
          settingsVersion: 2,
          weddingDate: null,
        });
        expect(
          (await database.select({ value: count() }).from(auditEvents))[0]
            ?.value,
        ).toBe(2);

        const stale = await authorizeWeddingServerOperation(
          { actorId },
          {
            resource: "existing",
            recordId: created.wedding.id,
            weddingId: created.wedding.id,
            action: "edit",
            correlationId: randomUUID(),
          },
          state,
        );
        await expect(
          updateWeddingSettings(database, stale, {
            expectedVersion: 1,
            name: "Stale",
            weddingDate: null,
            timeZone: "Europe/Paris",
          }),
        ).rejects.toBeInstanceOf(WeddingSettingsConflictError);
        expect(
          (await database.select({ value: count() }).from(auditEvents))[0]
            ?.value,
        ).toBe(2);

        await expect(
          authorizeWeddingServerOperation(
            { actorId: otherActorId },
            {
              resource: "existing",
              recordId: created.wedding.id,
              weddingId: created.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            state,
          ),
        ).rejects.toMatchObject<Partial<ServerAuthorizationError>>({
          failure: "access_denied",
        });

        await database
          .update(weddingMemberships)
          .set({ status: "revoked", permissionScopeVersion: 2 })
          .where(eq(weddingMemberships.actorId, actorId));
        await expect(
          authorizeWeddingServerOperation(
            { actorId },
            {
              resource: "existing",
              recordId: created.wedding.id,
              weddingId: created.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            state,
          ),
        ).rejects.toMatchObject<Partial<ServerAuthorizationError>>({
          failure: "access_denied",
        });

        await database
          .update(weddingMemberships)
          .set({
            status: "active",
            role: "coordinator",
            accessExpiresAt: new Date("2020-01-01T00:00:00.000Z"),
            permissionOverrides: [
              {
                area: "settings",
                action: "view",
                effect: "allow",
                scope: "workspace",
              },
              {
                area: "settings",
                action: "edit",
                effect: "allow",
                scope: "assigned",
              },
            ],
            permissionScopeVersion: 3,
          })
          .where(eq(weddingMemberships.actorId, actorId));
        await expect(
          authorizeWeddingServerOperation(
            { actorId },
            {
              resource: "existing",
              recordId: created.wedding.id,
              weddingId: created.wedding.id,
              action: "edit",
              correlationId: randomUUID(),
            },
            state,
          ),
        ).rejects.toMatchObject<Partial<ServerAuthorizationError>>({
          failure: "access_denied",
        });
      },
    );
  });

  it("rejects unauthenticated shapes, planner claims, and invalid time zones", () => {
    expect(() => command({ actorId: "not-an-actor" })).toThrow(
      WeddingCreationAuthorizationError,
    );
    expect(() =>
      command({ actorId: createUuidV7(), timeZone: "Mars/Olympus" }),
    ).toThrow(WeddingCreationAuthorizationError);
    expect(() =>
      authorizeCoupleWeddingCreation({
        actorId: createUuidV7(),
        correlationId: randomUUID(),
        creationRequestId: randomUUID(),
        creationMode: "planner",
        name: "Unverified planner",
        weddingDate: null,
        timeZone: "Europe/Brussels",
      }),
    ).toThrow(WeddingCreationAuthorizationError);
  });
});
