import { describe, expect, it } from "vitest";

import {
  parsePersistentMigrationConfig,
  productionMigrationConfirmation,
} from "./persistent-migration-config.js";

const migrationUrl =
  "postgresql://vowora_migrator:private-value@ep-small.eu-central-1.aws.neon.tech/vowora?sslmode=require";
const runtimeUrl =
  "postgresql://vowora_runtime:other-private@ep-small-pooler.eu-central-1.aws.neon.tech/vowora?sslmode=require";

function parse(
  overrides: {
    target?: unknown;
    mode?: unknown;
    confirmation?: unknown;
    migration?: string;
    runtime?: string;
  } = {},
) {
  return parsePersistentMigrationConfig({
    target: Object.hasOwn(overrides, "target") ? overrides.target : "staging",
    mode: Object.hasOwn(overrides, "mode") ? overrides.mode : "apply",
    confirmation: overrides.confirmation,
    environment: {
      DATABASE_MIGRATION_URL: overrides.migration ?? migrationUrl,
      DATABASE_URL: overrides.runtime ?? runtimeUrl,
    },
  });
}

describe("persistent migration configuration", () => {
  it("accepts a direct migrator and pooled distinct runtime identity", () => {
    expect(parse()).toMatchObject({
      target: "staging",
      mode: "apply",
      migrationUsername: "vowora_migrator",
      runtimeUsername: "vowora_runtime",
      databaseName: "vowora",
    });
  });

  it.each([undefined, "test", "preview", "STAGING"])(
    "rejects missing or unsupported target %s",
    (target) => {
      expect(() => parse({ target })).toThrow(/target/);
    },
  );

  it.each([undefined, "plan", "migrate"])(
    "rejects missing or unsupported mode %s",
    (mode) => {
      expect(() => parse({ mode })).toThrow(/mode/);
    },
  );

  it("requires the exact additional production apply confirmation", () => {
    expect(() => parse({ target: "production" })).toThrow(
      /production confirmation/,
    );
    expect(() =>
      parse({
        target: "production",
        confirmation: productionMigrationConfirmation,
      }),
    ).not.toThrow();
    expect(() => parse({ target: "production", mode: "verify" })).not.toThrow();
  });

  it.each([
    migrationUrl.replace("ep-small.", "ep-small-pooler."),
    migrationUrl.replace("?sslmode=require", ""),
    migrationUrl.replace("sslmode=require", "sslmode=disable"),
    migrationUrl.replace("sslmode=require", "sslmode=require&sslmode=require"),
  ])("rejects pooled or unsafe direct migration URL", (migration) => {
    expect(() => parse({ migration })).toThrow(/DATABASE_MIGRATION_URL/);
  });

  it("requires runtime TLS on a managed host", () => {
    expect(() =>
      parse({ runtime: runtimeUrl.replace("?sslmode=require", "") }),
    ).toThrow(/DATABASE_URL/);
  });

  it("requires password-bearing migration and runtime identities", () => {
    expect(() =>
      parse({ migration: migrationUrl.replace(":private-value", "") }),
    ).toThrow(/DATABASE_MIGRATION_URL/);
    expect(() =>
      parse({ runtime: runtimeUrl.replace(":other-private", "") }),
    ).toThrow(/DATABASE_URL/);
  });

  it("rejects equal and encoded-equivalent identities", () => {
    expect(() =>
      parse({
        runtime: runtimeUrl.replace("vowora_runtime", "vowora_migrator"),
      }),
    ).toThrow(/DATABASE_MIGRATION_URL, DATABASE_URL/);
    expect(() =>
      parse({
        runtime: runtimeUrl.replace("vowora_runtime", "vowora%5Fmigrator"),
      }),
    ).toThrow(/DATABASE_MIGRATION_URL, DATABASE_URL/);
    expect(() =>
      parse({
        runtime: runtimeUrl.replace("vowora_runtime", "%2576owora_runtime"),
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it.each([
    runtimeUrl.replace("ep-small-pooler", "ep-other-pooler"),
    runtimeUrl.replace("/vowora?", "/other?"),
  ])("requires both identities to address one database", (runtime) => {
    expect(() => parse({ runtime })).toThrow(
      /DATABASE_MIGRATION_URL, DATABASE_URL/,
    );
  });

  it("does not reflect credentials in configuration errors", () => {
    const secret = "must-never-appear";
    let message = "";
    try {
      parse({
        migration: `postgresql://same:${secret}@ep-small.eu-central-1.aws.neon.tech/vowora`,
        runtime: `postgresql://same:${secret}@ep-small-pooler.eu-central-1.aws.neon.tech/vowora`,
      });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain("DATABASE_MIGRATION_URL");
    expect(message).not.toContain(secret);
  });
});
