import { describe, expect, it } from "vitest";

import {
  DatabaseConfigurationError,
  parseRuntimeDatabaseConfig,
  parseTestMigrationConfig,
} from "./config.js";
import { testSchemaName } from "./migrations.js";
import { createUuidV7, isUuidV7 } from "./uuid.js";

function testPostgresUrl({
  database = "vowora",
  password,
  username,
}: {
  database?: string;
  password?: string;
  username: string;
}) {
  const url = new URL(`postgresql://example.test/${database}`);
  url.username = username;
  if (password) url.password = password;
  url.searchParams.set("sslmode", "require");
  return url.toString();
}

describe("database configuration", () => {
  it("parses bounded runtime settings without requiring them at build time", () => {
    const result = parseRuntimeDatabaseConfig({
      DATABASE_URL: testPostgresUrl({
        username: "runtime",
        password: "synthetic",
      }),
      DATABASE_POOL_MAX: "3",
      DATABASE_STATEMENT_TIMEOUT_MS: "2500",
      VOWORA_ENV: "preview",
    });
    expect(result).toMatchObject({
      deployment: "preview",
      poolMax: 3,
      statementTimeoutMs: 2500,
    });
  });

  it("uses environment-specific pool budgets and requires managed TLS", () => {
    const preview = parseRuntimeDatabaseConfig({
      DATABASE_URL: "postgresql://runtime@example.test/vowora?sslmode=require",
      VOWORA_ENV: "preview",
    });
    expect(preview.poolMax).toBe(3);
    expect(() =>
      parseRuntimeDatabaseConfig({
        DATABASE_URL: "postgresql://runtime@example.test/vowora",
        VOWORA_ENV: "production",
      }),
    ).toThrow(DatabaseConfigurationError);
    expect(() =>
      parseRuntimeDatabaseConfig({
        DATABASE_URL: "postgresql://runtime@example.test/vowora",
      }),
    ).toThrow(DatabaseConfigurationError);
    expect(
      parseRuntimeDatabaseConfig({
        DATABASE_URL: "postgresql://runtime@127.0.0.1/vowora",
      }).deployment,
    ).toBe("local");
  });

  it("reports variable names without reflecting invalid secret values", () => {
    const privateValue = "not-a-url-private-value";
    let error: unknown;
    try {
      parseRuntimeDatabaseConfig({ DATABASE_URL: privateValue });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(DatabaseConfigurationError);
    expect(String(error)).toContain("DATABASE_URL");
    expect(String(error)).not.toContain(privateValue);
  });

  it("bounds connection resources", () => {
    expect(() =>
      parseRuntimeDatabaseConfig({
        DATABASE_URL: "postgresql://runtime@example.test/vowora",
        DATABASE_POOL_MAX: "1000",
        DATABASE_STATEMENT_TIMEOUT_MS: "0",
      }),
    ).toThrow(DatabaseConfigurationError);
  });

  it("requires a dedicated, explicitly test-only migration identity", () => {
    const url = testPostgresUrl({
      database: "vowora_test",
      username: "migration",
      password: "synthetic",
    });
    expect(() =>
      parseTestMigrationConfig({ DATABASE_MIGRATION_URL: url }),
    ).toThrow(/DATABASE_MIGRATION_TARGET/);
    expect(() =>
      parseTestMigrationConfig({
        DATABASE_MIGRATION_URL: url,
        DATABASE_MIGRATION_TARGET: "test",
        DATABASE_URL: url,
      }),
    ).toThrow(DatabaseConfigurationError);
    expect(() =>
      parseTestMigrationConfig({
        DATABASE_MIGRATION_URL: testPostgresUrl({
          database: "vowora_test",
          username: "shared",
          password: "migration-value",
        }),
        DATABASE_MIGRATION_TARGET: "test",
        DATABASE_URL: testPostgresUrl({
          username: "shared",
          password: "runtime-value",
        }),
      }),
    ).toThrow(DatabaseConfigurationError);
    for (const invalidUrl of [
      testPostgresUrl({ database: "vowora_test", username: "" }),
      testPostgresUrl({ database: "", username: "migration" }),
    ]) {
      expect(() =>
        parseTestMigrationConfig({
          DATABASE_MIGRATION_URL: invalidUrl,
          DATABASE_MIGRATION_TARGET: "test",
        }),
      ).toThrow(DatabaseConfigurationError);
    }
  });
});

describe("UUIDv7 convention", () => {
  it("generates valid, lexically sortable version 7 identifiers", () => {
    const identifiers = Array.from({ length: 100 }, createUuidV7);
    expect(identifiers.every(isUuidV7)).toBe(true);
    expect([...identifiers].sort()).toEqual(identifiers);
  });

  it("rejects other UUID versions and malformed values", () => {
    expect(isUuidV7("00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(isUuidV7("private-value")).toBe(false);
  });
});

describe("isolated test schema names", () => {
  it("maps arbitrary CI identifiers to deterministic safe names", () => {
    const first = testSchemaName("pull/123 attempt 1; drop schema public");
    expect(first).toMatch(/^vowora_test_[a-f0-9]{20}$/);
    expect(testSchemaName("pull/123 attempt 1; drop schema public")).toBe(
      first,
    );
    expect(testSchemaName("pull/123 attempt 2")).not.toBe(first);
  });
});
