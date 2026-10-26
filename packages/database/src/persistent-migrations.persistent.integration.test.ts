import { randomUUID } from "node:crypto";

import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parsePersistentMigrationConfig } from "./persistent-migration-config.js";
import { runPersistentMigration } from "./persistent-migrations.js";

const { Client } = pg;
const migrationUrl = process.env.DATABASE_MIGRATION_URL;
const runtimeRole = "vowora_runtime_persistent_test";
const runtimePassword = "synthetic-runtime-password";
const lockName = "vowora:persistent-migrations:v1";

function runtimeUrl(): string {
  if (!migrationUrl) throw new Error("DATABASE_MIGRATION_URL is required");
  const url = new URL(migrationUrl);
  url.username = runtimeRole;
  url.password = runtimePassword;
  return url.toString();
}

function assertDisposableDatabase(): void {
  if (
    process.env.DATABASE_MIGRATION_TARGET !== "test" ||
    !migrationUrl ||
    !new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(
      new URL(migrationUrl).hostname,
    ) ||
    !new URL(migrationUrl).pathname.replace(/^\/+/, "").endsWith("_test")
  ) {
    throw new Error(
      "Persistent migration integration tests require a disposable local *_test database",
    );
  }
}

function config(mode: "apply" | "verify" = "apply") {
  return parsePersistentMigrationConfig({
    target: "staging",
    mode,
    environment: {
      DATABASE_MIGRATION_URL: migrationUrl,
      DATABASE_URL: runtimeUrl(),
    },
  });
}

async function administrator(): Promise<InstanceType<typeof Client>> {
  if (!migrationUrl) throw new Error("DATABASE_MIGRATION_URL is required");
  const client = new Client({ connectionString: migrationUrl });
  await client.connect();
  return client;
}

async function dropRuntimeRole(client: InstanceType<typeof Client>) {
  const exists = await client.query(
    "SELECT 1 FROM pg_roles WHERE rolname = $1",
    [runtimeRole],
  );
  if (exists.rowCount) {
    await client.query(`DROP OWNED BY "${runtimeRole}"`);
    await client.query(`DROP ROLE "${runtimeRole}"`);
  }
}

describe("persistent migration workflow", () => {
  beforeAll(async () => {
    assertDisposableDatabase();
    const client = await administrator();
    try {
      await dropRuntimeRole(client);
      await client.query("DROP TABLE IF EXISTS future_runtime_table");
    } finally {
      await client.end();
    }
  });

  it("fails before schema changes when the runtime identity is not restricted", async () => {
    await expect(runPersistentMigration(config())).rejects.toThrow(
      "runtime identity is not restricted",
    );
    const client = await administrator();
    try {
      const journal = await client.query(
        "SELECT to_regclass('drizzle.__drizzle_migrations') AS journal",
      );
      expect(journal.rows[0]?.journal).toBeNull();
      await client.query(
        `CREATE ROLE "${runtimeRole}" LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`,
      );
    } finally {
      await client.end();
    }
  });

  afterAll(async () => {
    const client = await administrator();
    try {
      await dropRuntimeRole(client);
    } finally {
      await client.end();
    }
  });

  it("applies the committed journal once and reconciles exact runtime grants", async () => {
    await runPersistentMigration(config());
    await runPersistentMigration(config());
    await expect(
      runPersistentMigration(config("verify")),
    ).resolves.toBeUndefined();

    const admin = await administrator();
    try {
      const journal = await admin.query(
        'SELECT hash FROM "drizzle"."__drizzle_migrations"',
      );
      expect(journal.rowCount).toBe(3);
      await admin.query(
        "CREATE TABLE future_runtime_table (id uuid PRIMARY KEY)",
      );
    } finally {
      await admin.end();
    }

    const runtime = new Client({ connectionString: runtimeUrl() });
    await runtime.connect();
    try {
      const userId = "019a27f0-67b7-7000-8000-000000000001";
      await runtime.query(
        `INSERT INTO auth_user
          (id, name, email, email_verified, created_at, updated_at)
         VALUES ($1, 'Synthetic', 'synthetic@example.invalid', false, now(), now())`,
        [userId],
      );
      await runtime.query("DELETE FROM auth_user WHERE id = $1", [userId]);
      await runtime.query(
        `INSERT INTO audit_events
          (event_id, event_type, schema_version, occurred_at, actor_id,
           wedding_id, correlation_id, subject_type, subject_id, metadata)
         VALUES
          ($1, 'test.created', 1, now(),
           '019a27f0-67b7-7000-8000-000000000003',
           '019a27f0-67b7-7000-8000-000000000004',
           '019a27f0-67b7-7000-8000-000000000005', 'test',
           '019a27f0-67b7-7000-8000-000000000006', '{}'::jsonb)`,
        [randomUUID()],
      );
      await expect(runtime.query("SELECT * FROM audit_events")).rejects.toThrow(
        /permission denied/,
      );
    } finally {
      await runtime.end();
    }

    const denied = new Client({ connectionString: runtimeUrl() });
    await denied.connect();
    try {
      await expect(
        denied.query("SELECT * FROM schema_metadata"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await denied.end();
    }
    const journalDenied = new Client({ connectionString: runtimeUrl() });
    await journalDenied.connect();
    try {
      await expect(
        journalDenied.query('SELECT * FROM "drizzle"."__drizzle_migrations"'),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await journalDenied.end();
    }
    const futureDenied = new Client({ connectionString: runtimeUrl() });
    await futureDenied.connect();
    try {
      await expect(
        futureDenied.query(
          "INSERT INTO future_runtime_table (id) VALUES ($1)",
          [randomUUID()],
        ),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await futureDenied.end();
    }
  });

  it("fails closed while another persistent migration owns the lock", async () => {
    const client = await administrator();
    try {
      await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [
        lockName,
      ]);
      await expect(runPersistentMigration(config("verify"))).rejects.toThrow(
        "another migration is running",
      );
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [
        lockName,
      ]);
      await client.end();
    }
  });
});
