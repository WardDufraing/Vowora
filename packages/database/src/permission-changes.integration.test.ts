import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import pg from "pg";
import { describe, expect, it } from "vitest";

import {
  authorizeWeddingPermissionChange,
  PermissionScopeChangeError,
  type WeddingMembership,
  type WeddingPermissionChangeAuthorizationState,
} from "@vowora/domain";

import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  assertAuthorizedWeddingPermissionChangeCall,
  type AuthorizedWeddingPermissionChangeCall,
  type WeddingPermissionChangeRepository,
  type WeddingPermissionMutationRequirement,
  withAuditedWeddingPermissionChange,
} from "./permission-changes.js";
import { auditEvents, outboxEvents } from "./schema.js";
import { syntheticWeddingOperation } from "./test/authorization.js";
import type { TransactionHost } from "./tenant.js";

const permissionScopeStates = pgTable("permission_scope_states", {
  membershipId: uuid("membership_id").primaryKey(),
  weddingId: uuid("wedding_id").notNull(),
  version: text("version").notNull(),
  membership: jsonb("membership").notNull().$type<WeddingMembership>(),
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
const targetActorId = "019a1f5e-70a0-7000-8000-000000000002";
const weddingId = "019a1f5e-70a0-7000-8000-000000000010";
const membershipId = "019a1f5e-70a0-7000-8000-000000000030";

function syntheticUuid(index: number): string {
  return `019a1f5e-70a0-7000-8000-${index.toString().padStart(12, "0")}`;
}

function partnerMembership(): WeddingMembership {
  return {
    actorId,
    weddingId,
    role: "partner",
    status: "active",
    accessExpiresAt: null,
    permissionOverrides: [],
  };
}

function helperMembership(
  status: "active" | "revoked" = "active",
): WeddingMembership {
  return {
    actorId: targetActorId,
    weddingId,
    role: "helper",
    status,
    accessExpiresAt: null,
    permissionOverrides: [],
  };
}

function host(database: Database): TransactionHost<Session> {
  return {
    transaction: (callback) =>
      database.transaction((session) => callback(session)),
  };
}

function state(database: Database): WeddingPermissionChangeAuthorizationState {
  return {
    loadWeddingPermissionChange: async (input) => {
      const source =
        (input.authorizationSession as Session | undefined) ?? database;
      const [row] = await source
        .select()
        .from(permissionScopeStates)
        .where(
          and(
            eq(permissionScopeStates.membershipId, input.membershipId),
            eq(permissionScopeStates.weddingId, input.weddingId),
          ),
        );
      if (!row) return undefined;
      return {
        actorIsAssignedLeadPlanner: false,
        actorPermissionScopeVersion: "actor:1",
        coupleAllowsLeadPlannerAccessManagement: false,
        actorMembership: partnerMembership(),
        targetMembership: row.membership,
        membershipId: row.membershipId,
        targetPermissionScopeVersion: row.version,
      };
    },
  };
}

class PermissionRepository implements WeddingPermissionChangeRepository<Session> {
  constructor(
    private readonly nextVersion: string,
    private readonly assertCapability = true,
  ) {}

  async compareAndSwap(
    call: AuthorizedWeddingPermissionChangeCall<Session>,
    requirement: WeddingPermissionMutationRequirement,
  ) {
    if (this.assertCapability) {
      assertAuthorizedWeddingPermissionChangeCall(call, requirement);
    }
    const [row] = await call.session
      .update(permissionScopeStates)
      .set({ membership: requirement.membership, version: this.nextVersion })
      .where(
        and(
          eq(permissionScopeStates.membershipId, requirement.membershipId),
          eq(permissionScopeStates.weddingId, requirement.weddingId),
          eq(
            permissionScopeStates.version,
            requirement.expectedPermissionScopeVersion,
          ),
        ),
      )
      .returning();
    if (!row) return undefined;
    return {
      membership: row.membership,
      membershipId: row.membershipId,
      weddingId: row.weddingId,
      previousPermissionScopeVersion:
        requirement.expectedPermissionScopeVersion,
      permissionScopeVersion: row.version,
    };
  }
}

function revokeCommand() {
  return {
    correlationId: randomUUID(),
    membershipId,
    mutation: { kind: "access_revoked" as const },
    weddingId,
  };
}

function restoreCommand() {
  return {
    correlationId: randomUUID(),
    membershipId,
    mutation: {
      kind: "access_restored" as const,
      accessExpiresAt: "2026-11-05T09:00:00.000Z",
    },
    weddingId,
  };
}

function eventIdentity(auditIndex: number, outboxIndex: number) {
  return {
    auditEventId: syntheticUuid(auditIndex),
    outboxEventId: syntheticUuid(outboxIndex),
    occurredAt: "2026-10-29T09:00:00.000Z",
  };
}

async function seed(
  database: Database,
  membership: WeddingMembership = helperMembership(),
) {
  await database.insert(permissionScopeStates).values({
    membershipId,
    weddingId,
    version: "membership:1",
    membership,
  });
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
          version text NOT NULL,
          membership jsonb NOT NULL
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

describe("mandatory audited permission change transaction", () => {
  it("commits the authoritative mutation, audit and invalidation atomically", async () => {
    await withDatabase("permission-change-commit", async (database) => {
      await seed(database);
      const operation = await authorizeWeddingPermissionChange(
        { actorId },
        revokeCommand(),
        state(database),
      );

      await withAuditedWeddingPermissionChange(
        host(database),
        operation,
        new PermissionRepository("membership:2"),
        eventIdentity(100, 101),
      );

      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [{ version: "membership:2", membership: { status: "revoked" } }],
      );
      expect(await database.select().from(auditEvents)).toMatchObject([
        {
          subjectId: membershipId,
          metadata: {
            change: "access_revoked",
            effectiveAccess: "reduced",
            previousPermissionScopeVersion: "membership:1",
            permissionScopeVersion: "membership:2",
          },
        },
      ]);
      expect(await database.select().from(outboxEvents)).toMatchObject([
        {
          payload: {
            membershipId,
            permissionScopeVersion: "membership:2",
          },
        },
      ]);
    });
  });

  it("rolls back mutation and audit when invalidation persistence fails", async () => {
    await withDatabase("permission-change-rollback", async (database) => {
      await seed(database);
      const first = await authorizeWeddingPermissionChange(
        { actorId },
        revokeCommand(),
        state(database),
      );
      const duplicateOutboxId = syntheticUuid(201);
      await withAuditedWeddingPermissionChange(
        host(database),
        first,
        new PermissionRepository("membership:2"),
        {
          auditEventId: syntheticUuid(200),
          outboxEventId: duplicateOutboxId,
          occurredAt: "2026-10-29T09:00:00.000Z",
        },
      );

      const second = await authorizeWeddingPermissionChange(
        { actorId },
        restoreCommand(),
        state(database),
      );
      await expect(
        withAuditedWeddingPermissionChange(
          host(database),
          second,
          new PermissionRepository("membership:3"),
          {
            auditEventId: syntheticUuid(202),
            outboxEventId: duplicateOutboxId,
            occurredAt: "2026-10-29T09:01:00.000Z",
          },
        ),
      ).rejects.toThrow();

      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [{ version: "membership:2", membership: { status: "revoked" } }],
      );
      expect(await database.select().from(auditEvents)).toHaveLength(1);
      expect(await database.select().from(outboxEvents)).toHaveLength(1);
    });
  });

  it("restores an expired helper only with a new future expiry and records expansion", async () => {
    await withDatabase("permission-change-restore", async (database) => {
      await seed(database, {
        ...helperMembership("revoked"),
        accessExpiresAt: "2026-10-20T09:00:00.000Z",
      });
      await expect(
        authorizeWeddingPermissionChange(
          { actorId },
          {
            ...restoreCommand(),
            mutation: {
              kind: "access_restored",
              accessExpiresAt: "2026-10-28T09:00:00.000Z",
            },
          },
          state(database),
          new Date("2026-10-29T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
      expect(await database.select().from(auditEvents)).toEqual([]);
      expect(await database.select().from(outboxEvents)).toEqual([]);

      const operation = await authorizeWeddingPermissionChange(
        { actorId },
        restoreCommand(),
        state(database),
        new Date("2026-10-29T09:00:00.000Z"),
      );
      await withAuditedWeddingPermissionChange(
        host(database),
        operation,
        new PermissionRepository("membership:2"),
        eventIdentity(250, 251),
      );

      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [
          {
            version: "membership:2",
            membership: {
              status: "active",
              accessExpiresAt: "2026-11-05T09:00:00.000Z",
            },
          },
        ],
      );
      expect(await database.select().from(auditEvents)).toMatchObject([
        {
          metadata: { change: "access_restored", effectiveAccess: "expanded" },
        },
      ]);
      expect(await database.select().from(outboxEvents)).toMatchObject([
        { payload: { change: "access_restored", effectiveAccess: "expanded" } },
      ]);
    });
  });

  it("permits only one concurrent stale-version capability to commit", async () => {
    await withDatabase("permission-change-concurrent", async (database) => {
      await seed(database);
      const [first, second] = await Promise.all([
        authorizeWeddingPermissionChange(
          { actorId },
          revokeCommand(),
          state(database),
        ),
        authorizeWeddingPermissionChange(
          { actorId },
          revokeCommand(),
          state(database),
        ),
      ]);
      const outcomes = await Promise.allSettled([
        withAuditedWeddingPermissionChange(
          host(database),
          first,
          new PermissionRepository("membership:2"),
          eventIdentity(300, 301),
        ),
        withAuditedWeddingPermissionChange(
          host(database),
          second,
          new PermissionRepository("membership:3"),
          eventIdentity(302, 303),
        ),
      ]);

      expect(
        outcomes.filter(({ status }) => status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        outcomes.filter(({ status }) => status === "rejected"),
      ).toHaveLength(1);
      expect(await database.select().from(auditEvents)).toHaveLength(1);
      expect(await database.select().from(outboxEvents)).toHaveLength(1);
    });
  });

  it("rejects repositories that omit the exact capability assertion", async () => {
    await withDatabase("permission-change-assertion", async (database) => {
      await seed(database);
      const operation = await authorizeWeddingPermissionChange(
        { actorId },
        revokeCommand(),
        state(database),
      );
      await expect(
        withAuditedWeddingPermissionChange(
          host(database),
          operation,
          new PermissionRepository("membership:2", false),
          eventIdentity(400, 401),
        ),
      ).rejects.toBeInstanceOf(PermissionScopeChangeError);
      expect(await database.select().from(permissionScopeStates)).toMatchObject(
        [{ version: "membership:1", membership: { status: "active" } }],
      );
      expect(await database.select().from(auditEvents)).toEqual([]);
      expect(await database.select().from(outboxEvents)).toEqual([]);
    });
  });

  it("rejects an ordinary record capability before opening a transaction", async () => {
    await withDatabase(
      "permission-change-record-capability",
      async (database) => {
        await seed(database);
        const ordinaryTaskEdit = await syntheticWeddingOperation(
          actorId,
          weddingId,
        );
        const transaction = host(database);
        expect(() =>
          withAuditedWeddingPermissionChange(
            transaction,
            ordinaryTaskEdit as never,
            new PermissionRepository("membership:2"),
            eventIdentity(500, 501),
          ),
        ).toThrow(PermissionScopeChangeError);
        expect(
          await database.select().from(permissionScopeStates),
        ).toMatchObject([{ version: "membership:1" }]);
      },
    );
  });
});
