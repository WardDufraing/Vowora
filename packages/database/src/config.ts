import { z } from "zod";

const deploymentSchema = z.enum(["local", "preview", "production"]);
const boundedInteger = (minimum: number, maximum: number, fallback: number) =>
  z.coerce.number().int().min(minimum).max(maximum).default(fallback);
const localPostgresHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const managedTlsModes = new Set(["require", "verify-full"]);

function requiresManagedTls(url: URL): boolean {
  return !localPostgresHosts.has(url.hostname);
}

function hasManagedTls(url: URL): boolean {
  return managedTlsModes.has(url.searchParams.get("sslmode") ?? "");
}

const postgresUrlSchema = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        context.addIssue({ code: "custom", message: "unsupported protocol" });
      }
    } catch {
      context.addIssue({ code: "custom", message: "invalid URL" });
    }
  });

const runtimeSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(10).optional(),
  DATABASE_CONNECTION_TIMEOUT_MS: boundedInteger(250, 10_000, 5_000),
  DATABASE_IDLE_TIMEOUT_MS: boundedInteger(1_000, 60_000, 10_000),
  DATABASE_STATEMENT_TIMEOUT_MS: boundedInteger(100, 30_000, 5_000),
  DATABASE_TRANSACTION_IDLE_TIMEOUT_MS: boundedInteger(100, 30_000, 5_000),
  VOWORA_ENV: deploymentSchema.default("local"),
});

const migrationSchema = z.object({
  DATABASE_MIGRATION_URL: postgresUrlSchema,
  DATABASE_MIGRATION_TARGET: z.literal("test"),
  DATABASE_URL: postgresUrlSchema.optional(),
  DATABASE_CONNECTION_TIMEOUT_MS: boundedInteger(250, 10_000, 5_000),
  DATABASE_STATEMENT_TIMEOUT_MS: boundedInteger(100, 30_000, 10_000),
});

export class DatabaseConfigurationError extends Error {
  readonly variables: readonly string[];

  constructor(variables: readonly string[]) {
    const unique = [...new Set(variables)].sort();
    super(`Invalid database configuration: ${unique.join(", ")}`);
    this.name = "DatabaseConfigurationError";
    this.variables = unique;
  }
}

function issueVariables(error: z.ZodError): string[] {
  return error.issues.map((issue) => String(issue.path[0] ?? "database"));
}

function candidate(
  environment: NodeJS.ProcessEnv,
  names: readonly string[],
): Record<string, string | undefined> {
  return Object.fromEntries(names.map((name) => [name, environment[name]]));
}

export interface RuntimeDatabaseConfig {
  readonly connectionString: string;
  readonly deployment: z.infer<typeof deploymentSchema>;
  readonly poolMax: number;
  readonly connectionTimeoutMs: number;
  readonly idleTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly transactionIdleTimeoutMs: number;
}

export function parseRuntimeDatabaseConfig(
  environment: NodeJS.ProcessEnv,
): RuntimeDatabaseConfig {
  const result = runtimeSchema.safeParse(
    candidate(environment, [
      "DATABASE_URL",
      "DATABASE_POOL_MAX",
      "DATABASE_CONNECTION_TIMEOUT_MS",
      "DATABASE_IDLE_TIMEOUT_MS",
      "DATABASE_STATEMENT_TIMEOUT_MS",
      "DATABASE_TRANSACTION_IDLE_TIMEOUT_MS",
      "VOWORA_ENV",
    ]),
  );
  if (!result.success) {
    throw new DatabaseConfigurationError(issueVariables(result.error));
  }
  const url = new URL(result.data.DATABASE_URL);
  if (requiresManagedTls(url) && !hasManagedTls(url)) {
    throw new DatabaseConfigurationError(["DATABASE_URL"]);
  }
  const defaultPoolMax = { local: 4, preview: 3, production: 5 } as const;
  return {
    connectionString: result.data.DATABASE_URL,
    deployment: result.data.VOWORA_ENV,
    poolMax:
      result.data.DATABASE_POOL_MAX ?? defaultPoolMax[result.data.VOWORA_ENV],
    connectionTimeoutMs: result.data.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: result.data.DATABASE_IDLE_TIMEOUT_MS,
    statementTimeoutMs: result.data.DATABASE_STATEMENT_TIMEOUT_MS,
    transactionIdleTimeoutMs: result.data.DATABASE_TRANSACTION_IDLE_TIMEOUT_MS,
  };
}

export interface TestMigrationConfig {
  readonly connectionString: string;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
}

export function parseTestMigrationConfig(
  environment: NodeJS.ProcessEnv,
): TestMigrationConfig {
  const result = migrationSchema.safeParse(
    candidate(environment, [
      "DATABASE_MIGRATION_URL",
      "DATABASE_MIGRATION_TARGET",
      "DATABASE_URL",
      "DATABASE_CONNECTION_TIMEOUT_MS",
      "DATABASE_STATEMENT_TIMEOUT_MS",
    ]),
  );
  if (!result.success) {
    throw new DatabaseConfigurationError(issueVariables(result.error));
  }
  const migrationUrl = new URL(result.data.DATABASE_MIGRATION_URL);
  if (
    (requiresManagedTls(migrationUrl) && !hasManagedTls(migrationUrl)) ||
    migrationUrl.username.length === 0 ||
    migrationUrl.pathname.replace(/^\/+/, "").length === 0
  ) {
    throw new DatabaseConfigurationError(["DATABASE_MIGRATION_URL"]);
  }
  if (
    result.data.DATABASE_URL &&
    (result.data.DATABASE_URL === result.data.DATABASE_MIGRATION_URL ||
      new URL(result.data.DATABASE_URL).username ===
        new URL(result.data.DATABASE_MIGRATION_URL).username)
  ) {
    throw new DatabaseConfigurationError([
      "DATABASE_MIGRATION_URL",
      "DATABASE_URL",
    ]);
  }
  return {
    connectionString: result.data.DATABASE_MIGRATION_URL,
    connectionTimeoutMs: result.data.DATABASE_CONNECTION_TIMEOUT_MS,
    statementTimeoutMs: result.data.DATABASE_STATEMENT_TIMEOUT_MS,
  };
}
