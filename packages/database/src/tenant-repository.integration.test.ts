import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { type AuthorizationContext } from "@vowora/domain";

import {
  syntheticOrganizationAuthorization,
  syntheticWeddingAuthorization,
} from "./authorization-test-helper.js";
import { parseTestMigrationConfig } from "./config.js";
import { withIsolatedTestSchema } from "./migrations.js";
import {
  assertTenantWriteScope,
  tenantScopePredicate,
  type TenantRepositoryCall,
  type TenantScopedRepository,
  TenantScopeViolationError,
  type TenantScopeColumns,
  type TransactionHost,
  withTenantTransaction,
} from "./tenant.js";

const records = pgTable("tenant_repository_records", {
  id: uuid("id").primaryKey(),
  weddingId: uuid("wedding_id"),
  organizationId: uuid("organization_id"),
  value: text("value").notNull(),
});

type RecordRow = typeof records.$inferSelect;
type NewRecord = typeof records.$inferInsert;
type Schema = { records: typeof records };
type RepositorySession = Pick<NodePgDatabase<Schema>, "insert" | "select">;
interface RecordOperations {
  findById(
    call: TenantRepositoryCall<RepositorySession>,
    id: string,
  ): Promise<RecordRow | null>;
  create(
    call: TenantRepositoryCall<RepositorySession>,
    input: NewRecord,
  ): Promise<RecordRow>;
}

class RecordRepository implements TenantScopedRepository<
  RepositorySession,
  RecordOperations
> {
  constructor(private readonly scopeColumns: TenantScopeColumns) {}

  async findById(
    { authorization, session }: TenantRepositoryCall<RepositorySession>,
    id: string,
  ): Promise<RecordRow | null> {
    const [record] = await session
      .select()
      .from(records)
      .where(
        and(
          eq(records.id, id),
          tenantScopePredicate(authorization, this.scopeColumns),
        ),
      );
    return record ?? null;
  }

  async create(
    { authorization, session }: TenantRepositoryCall<RepositorySession>,
    input: NewRecord,
  ): Promise<RecordRow> {
    assertTenantWriteScope(authorization, input, this.scopeColumns);
    const [record] = await session.insert(records).values(input).returning();
    if (!record) throw new Error("Synthetic insert did not return a record");
    return record;
  }
}

const migrationConfig = parseTestMigrationConfig(process.env);
const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const organizationA = "019a1f5e-70a0-7000-8000-000000000020";
const organizationB = "019a1f5e-70a0-7000-8000-000000000021";
function syntheticUuid(index: number): string {
  return `019a1f5e-70a0-7000-8000-${index.toString().padStart(12, "0")}`;
}

function authorization(scopes: {
  activeWeddingId?: string;
  activeOrganizationId?: string;
}) {
  if (scopes.activeWeddingId && !scopes.activeOrganizationId) {
    return syntheticWeddingAuthorization(actorId, scopes.activeWeddingId);
  }
  if (scopes.activeOrganizationId && !scopes.activeWeddingId) {
    return syntheticOrganizationAuthorization(
      actorId,
      scopes.activeOrganizationId,
    );
  }
  throw new Error("Synthetic tests issue exactly one authoritative scope");
}

function repositoryCall(
  session: RepositorySession,
  authorization: AuthorizationContext,
): TenantRepositoryCall<RepositorySession> {
  return { authorization, session };
}

async function withRepositoryDatabase(
  name: string,
  callback: (database: NodePgDatabase<Schema>) => Promise<void>,
) {
  await withIsolatedTestSchema(
    migrationConfig,
    `${name}-${randomUUID()}`,
    async ({ client }) => {
      await client.query(`
        CREATE TABLE tenant_repository_records (
          id uuid PRIMARY KEY,
          wedding_id uuid,
          organization_id uuid,
          value text NOT NULL,
          CONSTRAINT tenant_repository_records_has_scope
            CHECK (wedding_id IS NOT NULL OR organization_id IS NOT NULL)
        )
      `);
      await callback(
        drizzle(client, { casing: "snake_case", schema: { records } }),
      );
    },
  );
}

describe("tenant-scoped repository and transactions", () => {
  it("allows active tenants and denies cross-tenant reads and writes", async () => {
    await withRepositoryDatabase("tenant-isolation", async (database) => {
      const weddingRepository = new RecordRepository({
        weddingId: records.weddingId,
      });
      const organizationRepository = new RecordRepository({
        organizationId: records.organizationId,
      });
      const combinedRepository = new RecordRepository({
        weddingId: records.weddingId,
        organizationId: records.organizationId,
      });
      const weddingContext = await authorization({ activeWeddingId: weddingA });
      const organizationContext = await authorization({
        activeOrganizationId: organizationA,
      });
      const weddingRecord = {
        id: syntheticUuid(100),
        weddingId: weddingA,
        value: "wedding-a",
      };
      const otherWeddingRecord = {
        id: syntheticUuid(101),
        weddingId: weddingB,
        value: "wedding-b",
      };
      const organizationRecord = {
        id: syntheticUuid(102),
        organizationId: organizationA,
        value: "organization-a",
      };
      const combinedRecord = {
        id: syntheticUuid(103),
        weddingId: weddingA,
        organizationId: organizationA,
        value: "wedding-a-organization-a",
      };
      await database
        .insert(records)
        .values([
          weddingRecord,
          otherWeddingRecord,
          organizationRecord,
          combinedRecord,
        ]);

      await expect(
        weddingRepository.findById(
          repositoryCall(database, weddingContext),
          weddingRecord.id,
        ),
      ).resolves.toMatchObject({ value: "wedding-a" });
      await expect(
        weddingRepository.findById(
          repositoryCall(database, weddingContext),
          otherWeddingRecord.id,
        ),
      ).resolves.toBeNull();
      await expect(
        weddingRepository.findById(
          repositoryCall(database, organizationContext),
          weddingRecord.id,
        ),
      ).resolves.toBeNull();
      await expect(
        organizationRepository.findById(
          repositoryCall(database, organizationContext),
          organizationRecord.id,
        ),
      ).resolves.toMatchObject({ value: "organization-a" });
      await expect(
        combinedRepository.findById(
          repositoryCall(database, weddingContext),
          combinedRecord.id,
        ),
      ).resolves.toBeNull();

      await expect(
        weddingRepository.create(repositoryCall(database, weddingContext), {
          id: syntheticUuid(104),
          weddingId: weddingB,
          value: "forbidden",
        }),
      ).rejects.toBeInstanceOf(TenantScopeViolationError);
      await expect(
        organizationRepository.create(
          repositoryCall(database, organizationContext),
          {
            id: syntheticUuid(105),
            organizationId: organizationB,
            value: "forbidden",
          },
        ),
      ).rejects.toBeInstanceOf(TenantScopeViolationError);
      await expect(
        combinedRepository.create(repositoryCall(database, weddingContext), {
          id: syntheticUuid(106),
          weddingId: weddingA,
          value: "missing-required-organization",
        }),
      ).rejects.toBeInstanceOf(TenantScopeViolationError);
    });
  });

  it("commits multi-record work once and rolls every record back on failure", async () => {
    await withRepositoryDatabase("transaction-rollback", async (database) => {
      const repository = new RecordRepository({ weddingId: records.weddingId });
      const context = await authorization({ activeWeddingId: weddingA });
      const host: TransactionHost<RepositorySession> = {
        transaction: (callback) => database.transaction((tx) => callback(tx)),
      };

      await withTenantTransaction(host, context, async (transaction) => {
        await repository.create(transaction, {
          id: syntheticUuid(200),
          weddingId: weddingA,
          value: "committed-a",
        });
        await repository.create(transaction, {
          id: syntheticUuid(201),
          weddingId: weddingA,
          value: "committed-b",
        });
      });

      await expect(
        withTenantTransaction(host, context, async (transaction) => {
          await repository.create(transaction, {
            id: syntheticUuid(202),
            weddingId: weddingA,
            value: "rolled-back-a",
          });
          await repository.create(transaction, {
            id: syntheticUuid(203),
            weddingId: weddingA,
            value: "rolled-back-b",
          });
          throw new Error("synthetic application failure");
        }),
      ).rejects.toThrow("synthetic application failure");

      const duplicateId = syntheticUuid(204);
      await expect(
        withTenantTransaction(host, context, async (transaction) => {
          await repository.create(transaction, {
            id: duplicateId,
            weddingId: weddingA,
            value: "rolled-back-before-constraint",
          });
          await repository.create(transaction, {
            id: duplicateId,
            weddingId: weddingA,
            value: "duplicate-primary-key",
          });
        }),
      ).rejects.toThrow();

      const stored = await database
        .select({ value: records.value })
        .from(records)
        .where(tenantScopePredicate(context, { weddingId: records.weddingId }));
      expect(stored.map(({ value }) => value).sort()).toEqual([
        "committed-a",
        "committed-b",
      ]);
    });
  });
});
