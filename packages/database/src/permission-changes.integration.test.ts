import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  createPermissionScopeChangeCapture,
  type PermissionScopeChangeCapture,
} from "@vowora/domain";

import { AuditEventWriter, OutboxEventWriter } from "./audit-outbox.js";
import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import { auditEvents, outboxEvents } from "./schema.js";
import { syntheticWeddingOperation } from "./test/authorization.js";
import {
  type AuthorizedTenantTransaction,
  type TransactionHost,
  withAuthorizedTenantTransaction,
} from "./tenant.js";

const permissionScopeStates = pgTable("permission_scope_states", {
  membershipId: uuid("membership_id").primaryKey(),
  weddingId: uuid("wedding_id").notNull(),
  version: text("version").notNull(),
});

type Schema = {
  auditEvents: typeof auditEvents;
  outboxEvents: typeof outboxEvents;
  permissionScopeStates: typeof permissionScopeStates;
};
type Database = NodePgDatabase<Schema>;
type Session = Parameters<Parameters<Database["transaction"]>[0]>[0];

const migrationConfig = parseTestMigrationConfig(process.env);
const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000010";
const membershipId = "019a1f5e-70a0-7000-8000-000000000030";

function syntheticUuid(index: number): string {
  return `019a1f5e-70a0-7000-8000-${index.toString().padStart(12, "0")}`;
}

function host(database: Database): TransactionHost<Session> {
  return {
    transaction: (callback) =>
      database.transaction((session) => callback(session)),
  };
}

function capture(
  operation: Awaited<ReturnType<typeof syntheticWeddingOperation>>,
  input: {
    auditEventId: string;
    outboxEventId: string;
    previousVersion: string;
    version: string;
  },
): PermissionScopeChangeCapture {
  return createPermissionScopeChangeCapture(operation.authorization, {
    scope: "wedding",
    weddingId,
    membershipId,
    change: "permissions_changed",
    effectiveAccess: "reduced",
    previousPermissionScopeVersion: input.previousVersion,
    permissionScopeVersion: input.version,
    auditEventId: input.auditEventId,
    outboxEventId: input.outboxEventId,
    occurredAt: "2026-10-29T09:00:00.000Z",
  });
}

async function applyCapture(
  transaction: AuthorizedTenantTransaction<Session>,
  event: PermissionScopeChangeCapture,
  expectedVersion: string,
  version: string,
): Promise<void> {
  const updated = await transaction.session
    .update(permissionScopeStates)
    .set({ version })
    .where(
      and(
        eq(permissionScopeStates.membershipId, membershipId),
        eq(permissionScopeStates.weddingId, weddingId),
        eq(permissionScopeStates.version, expectedVersion),
      ),
    )
    .returning({ membershipId: permissionScopeStates.membershipId });
  if (updated.length !== 1) throw new Error("stale permission scope version");

  await new AuditEventWriter().append(transaction, event.audit);
  await new OutboxEventWriter().enqueue(transaction, event.invalidation);
}

async function withDatabase(
  name: string,
  callback: (database: Database) => Promise<void>,
) {
  await withIsolatedTestSchema(
    migrationConfig,
    `${name}-${randomUUID()}`,
    async ({ client, schemaName }) => {
      await client.query(`
        CREATE TABLE permission_scope_states (
          membership_id uuid PRIMARY KEY,
          wedding_id uuid NOT NULL,
          version text NOT NULL
        )
      `);
      const pool = new pg.Pool({
        connectionString: migrationConfig.connectionString,
        max: 3,
        options: `-c search_path=${schemaName},public`,
      });
      try {
        await callback(
          drizzle(pool, {
            casing: "snake_case",
            schema: { auditEvents, outboxEvents, permissionScopeStates },
          }),
        );
      } finally {
        await pool.end();
      }
    },
  );
}

describe("transactional permission-scope invalidation", () => {
  it("commits the version, audit and invalidation event atomically", async () => {
    await withDatabase("permission-change-commit", async (database) => {
      await database.insert(permissionScopeStates).values({
        membershipId,
        weddingId,
        version: "membership:1",
      });
      const operation = await syntheticWeddingOperation(actorId, weddingId);
      const event = capture(operation, {
        auditEventId: syntheticUuid(100),
        outboxEventId: syntheticUuid(101),
        previousVersion: "membership:1",
        version: "membership:2",
      });

      await withAuthorizedTenantTransaction(
        host(database),
        operation,
        (transaction) =>
          applyCapture(transaction, event, "membership:1", "membership:2"),
      );

      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [{ membershipId, weddingId, version: "membership:2" }],
      );
      expect(await database.select().from(auditEvents)).toMatchObject([
        {
          subjectId: membershipId,
          eventType: "authorization.permission_scope_changed",
          metadata: {
            change: "permissions_changed",
            effectiveAccess: "reduced",
            previousPermissionScopeVersion: "membership:1",
            permissionScopeVersion: "membership:2",
          },
        },
      ]);
      expect(await database.select().from(outboxEvents)).toMatchObject([
        {
          eventType: "authorization.permission_scope_invalidated",
          payload: {
            membershipId,
            permissionScopeVersion: "membership:2",
            scope: "wedding",
            scopeId: weddingId,
          },
        },
      ]);
    });
  });

  it("rolls back the policy version and audit when invalidation capture fails", async () => {
    await withDatabase("permission-change-rollback", async (database) => {
      await database.insert(permissionScopeStates).values({
        membershipId,
        weddingId,
        version: "membership:1",
      });
      const firstOperation = await syntheticWeddingOperation(
        actorId,
        weddingId,
      );
      const duplicateOutboxId = syntheticUuid(201);
      const first = capture(firstOperation, {
        auditEventId: syntheticUuid(200),
        outboxEventId: duplicateOutboxId,
        previousVersion: "membership:1",
        version: "membership:2",
      });
      await withAuthorizedTenantTransaction(
        host(database),
        firstOperation,
        (transaction) =>
          applyCapture(transaction, first, "membership:1", "membership:2"),
      );

      const secondOperation = await syntheticWeddingOperation(
        actorId,
        weddingId,
      );
      const second = capture(secondOperation, {
        auditEventId: syntheticUuid(202),
        outboxEventId: duplicateOutboxId,
        previousVersion: "membership:2",
        version: "membership:3",
      });
      await expect(
        withAuthorizedTenantTransaction(
          host(database),
          secondOperation,
          (transaction) =>
            applyCapture(transaction, second, "membership:2", "membership:3"),
        ),
      ).rejects.toThrow();

      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [{ version: "membership:2" }],
      );
      expect(await database.select().from(auditEvents)).toHaveLength(1);
      expect(await database.select().from(outboxEvents)).toHaveLength(1);
    });
  });

  it("allows only one stale-version competitor to capture a change", async () => {
    await withDatabase("permission-change-cas", async (database) => {
      await database.insert(permissionScopeStates).values({
        membershipId,
        weddingId,
        version: "membership:1",
      });
      const attempts = await Promise.allSettled(
        [
          [syntheticUuid(300), syntheticUuid(301), "membership:2"],
          [syntheticUuid(302), syntheticUuid(303), "membership:3"],
        ].map(async ([auditEventId, outboxEventId, version]) => {
          const operation = await syntheticWeddingOperation(actorId, weddingId);
          const event = capture(operation, {
            auditEventId: auditEventId!,
            outboxEventId: outboxEventId!,
            previousVersion: "membership:1",
            version: version!,
          });
          return withAuthorizedTenantTransaction(
            host(database),
            operation,
            (transaction) =>
              applyCapture(transaction, event, "membership:1", version!),
          );
        }),
      );

      expect(
        attempts.filter(({ status }) => status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        attempts.filter(({ status }) => status === "rejected"),
      ).toHaveLength(1);
      expect(await database.select().from(auditEvents)).toHaveLength(1);
      expect(await database.select().from(outboxEvents)).toHaveLength(1);
    });
  });
});
