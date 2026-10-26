import { z } from "zod";

const managedTlsModes = new Set(["require", "verify-full"]);
const localHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const targetSchema = z.enum(["staging", "production"]);
const modeSchema = z.enum(["apply", "verify"]);

export const productionMigrationConfirmation =
  "APPLY_VOWORA_PRODUCTION_MIGRATIONS";

export class PersistentMigrationConfigurationError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    const unique = [...new Set(fields)].sort();
    super(`Invalid persistent migration configuration: ${unique.join(", ")}`);
    this.name = "PersistentMigrationConfigurationError";
    this.fields = unique;
  }
}

function parseUrl(value: string | undefined, field: string): URL {
  if (!value) throw new PersistentMigrationConfigurationError([field]);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      throw new Error("protocol");
    }
    return parsed;
  } catch {
    throw new PersistentMigrationConfigurationError([field]);
  }
}

function decoded(value: string, field: string): string {
  try {
    const result = decodeURIComponent(value);
    if (!result || result.includes("\0") || /%[0-9a-f]{2}/i.test(result)) {
      throw new Error("identity");
    }
    return result;
  } catch {
    throw new PersistentMigrationConfigurationError([field]);
  }
}

function databaseName(url: URL, field: string): string {
  return decoded(url.pathname.replace(/^\/+/, ""), field);
}

function requiresTls(url: URL): boolean {
  return !localHosts.has(url.hostname);
}

function hasManagedTls(url: URL): boolean {
  const modes = url.searchParams.getAll("sslmode");
  return modes.length === 1 && managedTlsModes.has(modes[0] ?? "");
}

function normalizedNeonHost(hostname: string): string {
  return hostname.toLowerCase().replace(/-pooler(?=\.)/, "");
}

export interface PersistentMigrationConfig {
  readonly target: z.infer<typeof targetSchema>;
  readonly mode: z.infer<typeof modeSchema>;
  readonly migrationConnectionString: string;
  readonly runtimeConnectionString: string;
  readonly migrationUsername: string;
  readonly runtimeUsername: string;
  readonly databaseName: string;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
}

export function parsePersistentMigrationConfig(input: {
  readonly target: unknown;
  readonly mode: unknown;
  readonly confirmation?: unknown;
  readonly environment: NodeJS.ProcessEnv;
}): PersistentMigrationConfig {
  const target = targetSchema.safeParse(input.target);
  const mode = modeSchema.safeParse(input.mode);
  const fields: string[] = [];
  if (!target.success) fields.push("target");
  if (!mode.success) fields.push("mode");
  if (!target.success || !mode.success) {
    throw new PersistentMigrationConfigurationError(fields);
  }

  if (
    target.data === "production" &&
    mode.data === "apply" &&
    input.confirmation !== productionMigrationConfirmation
  ) {
    throw new PersistentMigrationConfigurationError([
      "production confirmation",
    ]);
  }

  const migrationUrl = parseUrl(
    input.environment.DATABASE_MIGRATION_URL,
    "DATABASE_MIGRATION_URL",
  );
  const runtimeUrl = parseUrl(input.environment.DATABASE_URL, "DATABASE_URL");
  const migrationUsername = decoded(
    migrationUrl.username,
    "DATABASE_MIGRATION_URL",
  );
  const runtimeUsername = decoded(runtimeUrl.username, "DATABASE_URL");
  const migrationDatabase = databaseName(
    migrationUrl,
    "DATABASE_MIGRATION_URL",
  );
  const runtimeDatabase = databaseName(runtimeUrl, "DATABASE_URL");

  if (!migrationUrl.password) fields.push("DATABASE_MIGRATION_URL");
  if (!runtimeUrl.password) fields.push("DATABASE_URL");

  if (
    migrationUrl.hostname.toLowerCase().includes("-pooler.") ||
    migrationUrl.searchParams.has("options") ||
    (requiresTls(migrationUrl) && !hasManagedTls(migrationUrl))
  ) {
    fields.push("DATABASE_MIGRATION_URL");
  }
  if (
    runtimeUrl.searchParams.has("options") ||
    (requiresTls(runtimeUrl) && !hasManagedTls(runtimeUrl))
  ) {
    fields.push("DATABASE_URL");
  }
  if (
    input.environment.DATABASE_MIGRATION_URL ===
      input.environment.DATABASE_URL ||
    migrationUsername === runtimeUsername
  ) {
    fields.push("DATABASE_MIGRATION_URL", "DATABASE_URL");
  }
  if (
    normalizedNeonHost(migrationUrl.hostname) !==
      normalizedNeonHost(runtimeUrl.hostname) ||
    migrationUrl.port !== runtimeUrl.port ||
    migrationDatabase !== runtimeDatabase
  ) {
    fields.push("DATABASE_MIGRATION_URL", "DATABASE_URL");
  }
  if (fields.length) throw new PersistentMigrationConfigurationError(fields);

  const timeoutSchema = z.coerce.number().int().min(1_000).max(30_000);
  const connectionTimeout = timeoutSchema.safeParse(
    input.environment.DATABASE_CONNECTION_TIMEOUT_MS ?? "5000",
  );
  const statementTimeout = timeoutSchema.safeParse(
    input.environment.DATABASE_STATEMENT_TIMEOUT_MS ?? "15000",
  );
  if (!connectionTimeout.success || !statementTimeout.success) {
    throw new PersistentMigrationConfigurationError([
      ...(!connectionTimeout.success ? ["DATABASE_CONNECTION_TIMEOUT_MS"] : []),
      ...(!statementTimeout.success ? ["DATABASE_STATEMENT_TIMEOUT_MS"] : []),
    ]);
  }

  return {
    target: target.data,
    mode: mode.data,
    migrationConnectionString: input.environment.DATABASE_MIGRATION_URL!,
    runtimeConnectionString: input.environment.DATABASE_URL!,
    migrationUsername,
    runtimeUsername,
    databaseName: migrationDatabase,
    connectionTimeoutMs: connectionTimeout.data,
    statementTimeoutMs: statementTimeout.data,
  };
}
