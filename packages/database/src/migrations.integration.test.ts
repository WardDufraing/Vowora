import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseTestMigrationConfig } from "./config.js";
import {
  applyMigrations,
  testSchemaName,
  withIsolatedTestSchema,
} from "./migrations.js";
import { createUuidV7 } from "./uuid.js";

const config = parseTestMigrationConfig(process.env);

describe("isolated PostgreSQL migration harness", () => {
  it("replays migrations idempotently and rolls transactions back", async () => {
    await withIsolatedTestSchema(
      config,
      `replay-${randomUUID()}`,
      async (context) => {
        await applyMigrations(config, context.schemaName);
        const id = createUuidV7();
        await context.client.query("BEGIN");
        await context.client.query(
          "INSERT INTO schema_metadata (id, key) VALUES ($1, $2)",
          [id, "rolled-back"],
        );
        await context.client.query("ROLLBACK");
        const rolledBack = await context.client.query(
          "SELECT count(*)::int AS count FROM schema_metadata WHERE key = $1",
          ["rolled-back"],
        );
        expect(rolledBack.rows[0]?.count).toBe(0);
        await context.client.query(
          "INSERT INTO schema_metadata (id, key) VALUES ($1, $2)",
          [id, "committed"],
        );
        const stored = await context.client.query(
          "SELECT id, created_at FROM schema_metadata WHERE key = $1",
          ["committed"],
        );
        expect(stored.rows[0]?.id).toBe(id);
        expect(stored.rows[0]?.created_at).toBeInstanceOf(Date);
      },
    );
  });

  it("uses distinct schemas and removes them after success or failure", async () => {
    const runA = `isolation-a-${randomUUID()}`;
    const runB = `isolation-b-${randomUUID()}`;
    await Promise.all(
      [runA, runB].map((run) =>
        withIsolatedTestSchema(config, run, async ({ client }) => {
          await client.query(
            "INSERT INTO schema_metadata (id, key) VALUES ($1, $2)",
            [createUuidV7(), run],
          );
          const rows = await client.query(
            "SELECT key FROM schema_metadata ORDER BY key",
          );
          expect(rows.rows).toEqual([{ key: run }]);
        }),
      ),
    );

    const failureRun = `failure-${randomUUID()}`;
    await expect(
      withIsolatedTestSchema(config, failureRun, async () => {
        throw new Error("synthetic failure");
      }),
    ).rejects.toThrow("synthetic failure");

    await withIsolatedTestSchema(
      config,
      `verify-${randomUUID()}`,
      async ({ client }) => {
        for (const run of [runA, runB, failureRun]) {
          const result = await client.query(
            "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS exists",
            [testSchemaName(run)],
          );
          expect(result.rows[0]?.exists).toBe(false);
        }
      },
    );
  });

  it("rolls back every statement when a forward migration fails", async () => {
    const folder = await mkdtemp(join(tmpdir(), "vowora-migration-rollback-"));
    const migrationTimestamp = Date.now() + 60_000;
    await mkdir(join(folder, "meta"));
    await writeFile(
      join(folder, "meta", "_journal.json"),
      JSON.stringify({
        version: "7",
        dialect: "postgresql",
        entries: [
          {
            idx: 0,
            version: "7",
            when: migrationTimestamp,
            tag: "0001_rollback_probe",
            breakpoints: true,
          },
        ],
      }),
    );
    await writeFile(
      join(folder, "0001_rollback_probe.sql"),
      'CREATE TABLE "migration_rollback_probe" ("id" integer);\n--> statement-breakpoint\nSELECT vowora_missing_migration_function();\n',
    );
    try {
      await withIsolatedTestSchema(
        config,
        `migration-rollback-${randomUUID()}`,
        async (context) => {
          await expect(
            applyMigrations(config, context.schemaName, folder),
          ).rejects.toThrow();
          const relation = await context.client.query(
            "SELECT to_regclass('migration_rollback_probe') AS relation",
          );
          expect(relation.rows[0]?.relation).toBeNull();
        },
      );
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
});
