import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

import type { PersistentMigrationConfig } from "./persistent-migration-config.js";
import * as schema from "./schema.js";

const { Client } = pg;
const lockName = "vowora:persistent-migrations:v1";
const journalSchema = "drizzle";
const journalTable = "__drizzle_migrations";
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

const authTables = [
  "auth_user",
  "auth_account",
  "auth_session",
  "auth_verification",
] as const;
const appendOnlyTables = ["audit_events", "outbox_events"] as const;
const allApplicationTables = [
  "schema_metadata",
  ...appendOnlyTables,
  ...authTables,
] as const;

export class PersistentMigrationError extends Error {
  constructor(readonly reason: string) {
    super(`Persistent migration failed: ${reason}`);
    this.name = "PersistentMigrationError";
  }
}

function quoteIdentifier(identifier: string): string {
  if (!identifier || identifier.includes("\0")) {
    throw new PersistentMigrationError("invalid runtime identity");
  }
  return `"${identifier.replaceAll('"', '""')}"`;
}

function clientFor(config: PersistentMigrationConfig) {
  return new Client({
    connectionString: config.migrationConnectionString,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    query_timeout: config.statementTimeoutMs,
    application_name: `vowora_migrate_${config.target}`,
    options: "-c search_path=public,pg_catalog",
  });
}

function runtimeClientFor(config: PersistentMigrationConfig) {
  return new Client({
    connectionString: config.runtimeConnectionString,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    query_timeout: config.statementTimeoutMs,
    application_name: `vowora_runtime_preflight_${config.target}`,
    options: "-c search_path=public,pg_catalog",
  });
}

async function verifyRuntimeConnection(
  config: PersistentMigrationConfig,
): Promise<void> {
  const runtime = runtimeClientFor(config);
  let connected = false;
  try {
    await runtime.connect();
    connected = true;
    const identity = await runtime.query<{
      current_user: string;
      current_database: string;
    }>("SELECT current_user, current_database()");
    if (
      identity.rows[0]?.current_user !== config.runtimeUsername ||
      identity.rows[0]?.current_database !== config.databaseName
    ) {
      throw new PersistentMigrationError(
        "runtime connection identity mismatch",
      );
    }
  } catch (error) {
    if (error instanceof PersistentMigrationError) throw error;
    throw new PersistentMigrationError("runtime connection failed");
  } finally {
    if (connected) await runtime.end();
  }
}

export async function readDatabaseEnvironmentMarker(
  client: InstanceType<typeof Client>,
): Promise<string | undefined> {
  const environment = await client.query<{ markers: string[] | null }>(
    `SELECT array_agg(
              substring(setting FROM position('=' IN setting) + 1)
              ORDER BY setting
            ) AS markers
       FROM pg_db_role_setting role_setting
       JOIN pg_database database
         ON database.oid = role_setting.setdatabase
      CROSS JOIN LATERAL unnest(role_setting.setconfig) setting
      WHERE database.datname = current_database()
        AND role_setting.setrole = 0
        AND split_part(setting, '=', 1) = 'vowora.environment'`,
  );
  const markers = environment.rows[0]?.markers;
  return markers?.length === 1 ? markers[0] : undefined;
}

async function assertRuntimeRoleIsRestricted(
  client: InstanceType<typeof Client>,
  runtimeUsername: string,
): Promise<void> {
  const role = await client.query<{
    rolcanlogin: boolean;
    rolsuper: boolean;
    rolcreatedb: boolean;
    rolcreaterole: boolean;
    rolreplication: boolean;
    rolbypassrls: boolean;
  }>(
    `SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole,
            rolreplication, rolbypassrls
       FROM pg_roles WHERE rolname = $1`,
    [runtimeUsername],
  );
  const attributes = role.rows[0];
  if (
    !attributes?.rolcanlogin ||
    attributes.rolsuper ||
    attributes.rolcreatedb ||
    attributes.rolcreaterole ||
    attributes.rolreplication ||
    attributes.rolbypassrls
  ) {
    throw new PersistentMigrationError("runtime identity is not restricted");
  }
  const memberships = await client.query(
    `SELECT 1
       FROM pg_auth_members membership
       JOIN pg_roles member ON member.oid = membership.member
      WHERE member.rolname = $1
      LIMIT 1`,
    [runtimeUsername],
  );
  if (memberships.rowCount !== 0) {
    throw new PersistentMigrationError("runtime identity has role memberships");
  }
}

async function reconcileRuntimeGrants(
  client: InstanceType<typeof Client>,
  config: PersistentMigrationConfig,
): Promise<void> {
  await assertRuntimeRoleIsRestricted(client, config.runtimeUsername);
  const role = quoteIdentifier(config.runtimeUsername);
  const database = quoteIdentifier(config.databaseName);
  const auth = authTables.map(quoteIdentifier).join(", ");
  const appendOnly = appendOnlyTables.map(quoteIdentifier).join(", ");

  await client.query("BEGIN");
  try {
    await client.query(`REVOKE ALL ON DATABASE ${database} FROM PUBLIC`);
    await client.query(`REVOKE ALL ON DATABASE ${database} FROM ${role}`);
    await client.query(`GRANT CONNECT ON DATABASE ${database} TO ${role}`);
    await client.query('REVOKE ALL ON SCHEMA "public" FROM PUBLIC');
    await client.query(`REVOKE ALL ON SCHEMA "public" FROM ${role}`);
    await client.query(`GRANT USAGE ON SCHEMA "public" TO ${role}`);
    await client.query(`REVOKE ALL ON SCHEMA "${journalSchema}" FROM PUBLIC`);
    await client.query(`REVOKE ALL ON SCHEMA "${journalSchema}" FROM ${role}`);
    await client.query(
      'REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM PUBLIC',
    );
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM ${role}`,
    );
    await client.query(
      `REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM PUBLIC`,
    );
    await client.query(
      `REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM ${role}`,
    );
    await client.query(
      `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM PUBLIC`,
    );
    await client.query(
      `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM ${role}`,
    );
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "${journalSchema}" FROM PUBLIC`,
    );
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "${journalSchema}" FROM ${role}`,
    );
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${auth} TO ${role}`,
    );
    await client.query(`GRANT INSERT ON TABLE ${appendOnly} TO ${role}`);
    await client.query(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM PUBLIC',
    );
    await client.query(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM PUBLIC',
    );
    await client.query(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM PUBLIC',
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function verifyMigrationJournal(
  client: InstanceType<typeof Client>,
): Promise<void> {
  const expected = readMigrationFiles({ migrationsFolder });
  const journal = await client.query<{ hash: string; created_at: string }>(
    `SELECT hash, created_at::text
       FROM "${journalSchema}"."${journalTable}"
      ORDER BY created_at, id`,
  );
  if (
    journal.rows.length !== expected.length ||
    expected.some(
      (migration, index) =>
        journal.rows[index]?.hash !== migration.hash ||
        Number(journal.rows[index]?.created_at) !== migration.folderMillis,
    )
  ) {
    throw new PersistentMigrationError("migration journal mismatch");
  }
}

async function hasTablePrivilege(
  client: InstanceType<typeof Client>,
  role: string,
  table: string,
  privilege: string,
): Promise<boolean> {
  const result = await client.query<{ allowed: boolean }>(
    "SELECT has_table_privilege($1, $2, $3) AS allowed",
    [role, table, privilege],
  );
  return result.rows[0]?.allowed === true;
}

async function verifyRuntimeGrants(
  client: InstanceType<typeof Client>,
  config: PersistentMigrationConfig,
): Promise<void> {
  await assertRuntimeRoleIsRestricted(client, config.runtimeUsername);
  const schemaPrivileges = await client.query<{
    public_usage: boolean;
    public_create: boolean;
    journal_usage: boolean;
  }>(
    `SELECT has_schema_privilege($1, 'public', 'USAGE') AS public_usage,
            has_schema_privilege($1, 'public', 'CREATE') AS public_create,
            has_schema_privilege($1, 'drizzle', 'USAGE') AS journal_usage`,
    [config.runtimeUsername],
  );
  const schemas = schemaPrivileges.rows[0];
  if (
    !schemas?.public_usage ||
    schemas.public_create ||
    schemas.journal_usage
  ) {
    throw new PersistentMigrationError("runtime schema privileges mismatch");
  }
  const databasePrivileges = await client.query<{
    can_connect: boolean;
    can_create: boolean;
    can_temp: boolean;
  }>(
    `SELECT has_database_privilege($1, $2, 'CONNECT') AS can_connect,
            has_database_privilege($1, $2, 'CREATE') AS can_create,
            has_database_privilege($1, $2, 'TEMP') AS can_temp`,
    [config.runtimeUsername, config.databaseName],
  );
  const database = databasePrivileges.rows[0];
  if (!database?.can_connect || database.can_create || database.can_temp) {
    throw new PersistentMigrationError("runtime database privileges mismatch");
  }
  const publicPrivileges = await client.query<{ exposed: boolean }>(
    `SELECT
       EXISTS (
         SELECT 1 FROM pg_database database,
           LATERAL aclexplode(COALESCE(database.datacl, acldefault('d', database.datdba))) acl
         WHERE database.datname = current_database() AND acl.grantee = 0
       ) OR EXISTS (
         SELECT 1 FROM pg_namespace namespace,
           LATERAL aclexplode(COALESCE(namespace.nspacl, acldefault('n', namespace.nspowner))) acl
         WHERE namespace.nspname IN ('public', 'drizzle') AND acl.grantee = 0
       ) OR EXISTS (
         SELECT 1 FROM information_schema.role_table_grants
         WHERE table_schema IN ('public', 'drizzle') AND grantee = 'PUBLIC'
       ) AS exposed`,
  );
  if (publicPrivileges.rows[0]?.exposed) {
    throw new PersistentMigrationError("public database privileges remain");
  }

  for (const table of authTables) {
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      if (
        !(await hasTablePrivilege(
          client,
          config.runtimeUsername,
          `public.${table}`,
          privilege,
        ))
      ) {
        throw new PersistentMigrationError("runtime table privileges mismatch");
      }
    }
    if (
      await hasTablePrivilege(
        client,
        config.runtimeUsername,
        `public.${table}`,
        "TRUNCATE",
      )
    ) {
      throw new PersistentMigrationError("runtime table privileges mismatch");
    }
  }
  for (const table of appendOnlyTables) {
    for (const privilege of ["SELECT", "UPDATE", "DELETE", "TRUNCATE"]) {
      if (
        await hasTablePrivilege(
          client,
          config.runtimeUsername,
          `public.${table}`,
          privilege,
        )
      ) {
        throw new PersistentMigrationError("runtime table privileges mismatch");
      }
    }
    if (
      !(await hasTablePrivilege(
        client,
        config.runtimeUsername,
        `public.${table}`,
        "INSERT",
      ))
    ) {
      throw new PersistentMigrationError("runtime table privileges mismatch");
    }
  }
  for (const privilege of [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "TRUNCATE",
  ]) {
    if (
      await hasTablePrivilege(
        client,
        config.runtimeUsername,
        "public.schema_metadata",
        privilege,
      )
    ) {
      throw new PersistentMigrationError("runtime table privileges mismatch");
    }
  }
  for (const privilege of [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "TRUNCATE",
  ]) {
    if (
      await hasTablePrivilege(
        client,
        config.runtimeUsername,
        `${journalSchema}.${journalTable}`,
        privilege,
      )
    ) {
      throw new PersistentMigrationError("runtime journal privileges mismatch");
    }
  }
  if (allApplicationTables.length !== 7) {
    throw new PersistentMigrationError("runtime grant manifest mismatch");
  }
}

export async function runPersistentMigration(
  config: PersistentMigrationConfig,
): Promise<void> {
  const client = clientFor(config);
  let connected = false;
  let locked = false;
  try {
    await client.connect();
    connected = true;
    const identity = await client.query<{
      current_user: string;
      current_database: string;
    }>("SELECT current_user, current_database()");
    if (
      identity.rows[0]?.current_user !== config.migrationUsername ||
      identity.rows[0]?.current_database !== config.databaseName
    ) {
      throw new PersistentMigrationError(
        "connected database identity mismatch",
      );
    }
    if ((await readDatabaseEnvironmentMarker(client)) !== config.target) {
      throw new PersistentMigrationError(
        "database environment marker mismatch",
      );
    }
    await verifyRuntimeConnection(config);
    const lock = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired",
      [lockName],
    );
    locked = lock.rows[0]?.acquired === true;
    if (!locked)
      throw new PersistentMigrationError("another migration is running");
    await assertRuntimeRoleIsRestricted(client, config.runtimeUsername);
    if (config.mode === "apply") {
      await migrate(drizzle(client, { casing: "snake_case", schema }), {
        migrationsFolder,
        migrationsSchema: journalSchema,
        migrationsTable: journalTable,
      });
      await reconcileRuntimeGrants(client, config);
    }
    await verifyMigrationJournal(client);
    await verifyRuntimeGrants(client, config);
  } catch (error) {
    if (error instanceof PersistentMigrationError) throw error;
    throw new PersistentMigrationError("database operation failed");
  } finally {
    if (connected && locked) {
      try {
        await client.query(
          "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
          [lockName],
        );
      } catch {
        // Closing the session releases the lock even if explicit unlock fails.
      }
    }
    if (connected) await client.end();
  }
}
