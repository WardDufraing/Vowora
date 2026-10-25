import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import type { TestMigrationConfig } from "./config.js";
import * as schema from "./schema.js";

const { Client } = pg;
const schemaPattern = /^vowora_test_[a-f0-9]{20}$/;

export function testSchemaName(runIdentifier: string): string {
  const digest = createHash("sha256").update(runIdentifier).digest("hex");
  return `vowora_test_${digest.slice(0, 20)}`;
}

function quotedSchema(name: string): string {
  if (!schemaPattern.test(name)) {
    throw new Error("Invalid isolated test schema name");
  }
  return `"${name}"`;
}

function clientConfig(config: TestMigrationConfig, schemaName?: string) {
  return {
    connectionString: config.connectionString,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    query_timeout: config.statementTimeoutMs,
    application_name: "vowora_migration_test",
    ...(schemaName
      ? { options: `-c search_path=${schemaName},public` }
      : undefined),
  };
}

export async function applyMigrations(
  config: TestMigrationConfig,
  schemaName: string,
  migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url)),
): Promise<void> {
  quotedSchema(schemaName);
  const client = new Client(clientConfig(config, schemaName));
  await client.connect();
  try {
    await migrate(drizzle(client, { casing: "snake_case", schema }), {
      migrationsFolder,
      migrationsSchema: schemaName,
      migrationsTable: "__drizzle_migrations",
    });
  } finally {
    await client.end();
  }
}

export async function withIsolatedTestSchema<T>(
  config: TestMigrationConfig,
  runIdentifier: string,
  callback: (context: {
    readonly client: InstanceType<typeof Client>;
    readonly schemaName: string;
  }) => Promise<T>,
): Promise<T> {
  const schemaName = testSchemaName(runIdentifier);
  const identifier = quotedSchema(schemaName);
  const administrator = new Client(clientConfig(config));
  await administrator.connect();
  let created = false;
  try {
    await administrator.query(`CREATE SCHEMA ${identifier}`);
    created = true;
    await applyMigrations(config, schemaName);
    const client = new Client(clientConfig(config, schemaName));
    await client.connect();
    try {
      return await callback({ client, schemaName });
    } finally {
      await client.end();
    }
  } finally {
    try {
      if (created) {
        await administrator.query(`DROP SCHEMA ${identifier} CASCADE`);
      }
    } finally {
      await administrator.end();
    }
  }
}
