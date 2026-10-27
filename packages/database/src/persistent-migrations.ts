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
const tablePrivileges = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "REFERENCES",
  "TRIGGER",
  "MAINTAIN",
] as const;
const columnPrivileges = ["SELECT", "INSERT", "UPDATE", "REFERENCES"] as const;
const sequencePrivileges = ["USAGE", "SELECT", "UPDATE"] as const;

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

function expectedTablePrivileges(schemaName: string, tableName: string) {
  if (schemaName !== "public") return new Set<string>();
  if ((authTables as readonly string[]).includes(tableName)) {
    return new Set(["SELECT", "INSERT", "UPDATE", "DELETE"]);
  }
  if ((appendOnlyTables as readonly string[]).includes(tableName)) {
    return new Set(["INSERT"]);
  }
  return new Set<string>();
}

function expectedColumnPrivileges(schemaName: string, tableName: string) {
  if (schemaName !== "public") return new Set<string>();
  if ((authTables as readonly string[]).includes(tableName)) {
    return new Set(["SELECT", "INSERT", "UPDATE"]);
  }
  if ((appendOnlyTables as readonly string[]).includes(tableName)) {
    return new Set(["INSERT"]);
  }
  return new Set<string>();
}

async function revokeColumnPrivileges(
  client: InstanceType<typeof Client>,
  grantee: string,
): Promise<void> {
  const relations = await client.query<{
    schema_name: string;
    relation_name: string;
    columns: string[];
  }>(
    `SELECT namespace.nspname AS schema_name,
            relation.relname AS relation_name,
            json_agg(attribute.attname ORDER BY attribute.attnum) AS columns
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       JOIN pg_attribute attribute ON attribute.attrelid = relation.oid
      WHERE namespace.nspname IN ('public', $1)
        AND relation.relkind IN ('r', 'p', 'v', 'm', 'f')
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
      GROUP BY namespace.nspname, relation.relname`,
    [journalSchema],
  );
  const quotedGrantee =
    grantee === "PUBLIC" ? grantee : quoteIdentifier(grantee);
  for (const relation of relations.rows) {
    const columns = relation.columns.map(quoteIdentifier).join(", ");
    await client.query(
      `REVOKE ALL PRIVILEGES (${columns}) ON TABLE ${quoteIdentifier(relation.schema_name)}.${quoteIdentifier(relation.relation_name)} FROM ${quotedGrantee}`,
    );
  }
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
      `REVOKE ALL ON ALL ROUTINES IN SCHEMA "public" FROM PUBLIC`,
    );
    await client.query(
      `REVOKE ALL ON ALL ROUTINES IN SCHEMA "public" FROM ${role}`,
    );
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "${journalSchema}" FROM PUBLIC`,
    );
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "${journalSchema}" FROM ${role}`,
    );
    await revokeColumnPrivileges(client, "PUBLIC");
    await revokeColumnPrivileges(client, config.runtimeUsername);
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
      'ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON ROUTINES FROM PUBLIC',
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM ${role}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM ${role}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON ROUTINES FROM ${role}`,
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
  table: number,
  privilege: string,
): Promise<boolean> {
  const result = await client.query<{ allowed: boolean }>(
    "SELECT has_table_privilege($1, $2::oid, $3) AS allowed",
    [role, table, privilege],
  );
  return result.rows[0]?.allowed === true;
}

async function verifyRuntimeGrants(
  client: InstanceType<typeof Client>,
  config: PersistentMigrationConfig,
): Promise<void> {
  await assertRuntimeRoleIsRestricted(client, config.runtimeUsername);
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

  const schemas = await client.query<{ oid: number; schema_name: string }>(
    `SELECT oid, nspname AS schema_name
       FROM pg_namespace
      WHERE nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
        AND nspname <> 'information_schema'`,
  );
  for (const schema of schemas.rows) {
    for (const privilege of ["USAGE", "CREATE"]) {
      const result = await client.query<{ allowed: boolean }>(
        "SELECT has_schema_privilege($1, $2::oid, $3) AS allowed",
        [config.runtimeUsername, schema.oid, privilege],
      );
      const expected = schema.schema_name === "public" && privilege === "USAGE";
      if (result.rows[0]?.allowed !== expected) {
        throw new PersistentMigrationError(
          "runtime schema privileges mismatch",
        );
      }
    }
  }

  const relations = await client.query<{
    oid: number;
    schema_name: string;
    relation_name: string;
  }>(
    `SELECT relation.oid, namespace.nspname AS schema_name,
            relation.relname AS relation_name
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
        AND namespace.nspname <> 'information_schema'
        AND relation.relkind IN ('r', 'p', 'v', 'm', 'f')`,
  );
  for (const relation of relations.rows) {
    const expected = expectedTablePrivileges(
      relation.schema_name,
      relation.relation_name,
    );
    for (const privilege of tablePrivileges) {
      const allowed = await hasTablePrivilege(
        client,
        config.runtimeUsername,
        relation.oid,
        privilege,
      );
      if (allowed !== expected.has(privilege)) {
        throw new PersistentMigrationError("runtime table privileges mismatch");
      }
    }
  }

  const columns = await client.query<{
    relation_oid: number;
    attribute_number: number;
    schema_name: string;
    relation_name: string;
  }>(
    `SELECT relation.oid AS relation_oid,
            attribute.attnum AS attribute_number,
            namespace.nspname AS schema_name,
            relation.relname AS relation_name
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
       JOIN pg_attribute attribute ON attribute.attrelid = relation.oid
      WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
        AND namespace.nspname <> 'information_schema'
        AND relation.relkind IN ('r', 'p', 'v', 'm', 'f')
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped`,
  );
  for (const column of columns.rows) {
    const expected = expectedColumnPrivileges(
      column.schema_name,
      column.relation_name,
    );
    for (const privilege of columnPrivileges) {
      const result = await client.query<{ allowed: boolean }>(
        "SELECT has_column_privilege($1, $2::oid, $3::smallint, $4) AS allowed",
        [
          config.runtimeUsername,
          column.relation_oid,
          column.attribute_number,
          privilege,
        ],
      );
      if (result.rows[0]?.allowed !== expected.has(privilege)) {
        throw new PersistentMigrationError(
          "runtime column privileges mismatch",
        );
      }
    }
  }

  const sequences = await client.query<{ oid: number }>(
    `SELECT relation.oid
       FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
        AND namespace.nspname <> 'information_schema'
        AND relation.relkind = 'S'`,
  );
  for (const sequence of sequences.rows) {
    for (const privilege of sequencePrivileges) {
      const result = await client.query<{ allowed: boolean }>(
        "SELECT has_sequence_privilege($1, $2::oid, $3) AS allowed",
        [config.runtimeUsername, sequence.oid, privilege],
      );
      if (result.rows[0]?.allowed) {
        throw new PersistentMigrationError(
          "runtime sequence privileges mismatch",
        );
      }
    }
  }

  const routines = await client.query<{ oid: number }>(
    `SELECT routine.oid
       FROM pg_proc routine
       JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
      WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
        AND namespace.nspname <> 'information_schema'`,
  );
  for (const routine of routines.rows) {
    const result = await client.query<{ allowed: boolean }>(
      "SELECT has_function_privilege($1, $2::oid, 'EXECUTE') AS allowed",
      [config.runtimeUsername, routine.oid],
    );
    if (result.rows[0]?.allowed) {
      throw new PersistentMigrationError("runtime routine privileges mismatch");
    }
  }

  const exposedPrivileges = await client.query<{ exposed: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_database database,
         LATERAL aclexplode(COALESCE(database.datacl, acldefault('d', database.datdba))) acl
       WHERE database.datname = current_database() AND acl.grantee = 0
     ) OR EXISTS (
       SELECT 1 FROM pg_namespace namespace,
         LATERAL aclexplode(COALESCE(namespace.nspacl, acldefault('n', namespace.nspowner))) acl
       WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
         AND namespace.nspname <> 'information_schema' AND acl.grantee = 0
     ) OR EXISTS (
       SELECT 1 FROM pg_class relation
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace,
         LATERAL aclexplode(COALESCE(
           relation.relacl,
           acldefault(CASE WHEN relation.relkind = 'S' THEN 's'::"char" ELSE 'r'::"char" END, relation.relowner)
         )) acl
       WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
         AND namespace.nspname <> 'information_schema' AND acl.grantee = 0
     ) OR EXISTS (
       SELECT 1 FROM pg_attribute attribute
       JOIN pg_class relation ON relation.oid = attribute.attrelid
       JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace,
         LATERAL aclexplode(COALESCE(attribute.attacl, acldefault('c', relation.relowner))) acl
       WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
         AND namespace.nspname <> 'information_schema'
         AND attribute.attnum > 0 AND NOT attribute.attisdropped AND acl.grantee = 0
     ) OR EXISTS (
       SELECT 1 FROM pg_proc routine
       JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace,
         LATERAL aclexplode(COALESCE(routine.proacl, acldefault('f', routine.proowner))) acl
       WHERE namespace.nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
         AND namespace.nspname <> 'information_schema' AND acl.grantee = 0
     ) AS exposed`,
  );
  if (exposedPrivileges.rows[0]?.exposed) {
    throw new PersistentMigrationError("public database privileges remain");
  }

  const defaultPrivileges = await client.query<{ exposed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM pg_default_acl defaults
         CROSS JOIN LATERAL aclexplode(defaults.defaclacl) acl
         JOIN pg_roles runtime ON runtime.rolname = $1
        WHERE acl.grantee IN (0, runtime.oid)
          AND (defaults.defaclnamespace = 0 OR defaults.defaclnamespace IN (
            SELECT oid FROM pg_namespace
             WHERE nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
               AND nspname <> 'information_schema'
          ))
     ) AS exposed`,
    [config.runtimeUsername],
  );
  if (defaultPrivileges.rows[0]?.exposed) {
    throw new PersistentMigrationError("runtime default privileges mismatch");
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
