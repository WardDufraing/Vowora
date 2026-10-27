import { pathToFileURL } from "node:url";

import {
  parsePersistentMigrationConfig,
  PersistentMigrationConfigurationError,
  productionMigrationConfirmation,
} from "./persistent-migration-config.js";
import {
  PersistentMigrationError,
  runPersistentMigration,
} from "./persistent-migrations.js";

export function parseArguments(values: readonly string[]) {
  const allowed = new Set(["--target", "--mode", "--confirm-production"]);
  const parsed = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];
    if (
      !name ||
      !allowed.has(name) ||
      value === undefined ||
      parsed.has(name)
    ) {
      throw new PersistentMigrationConfigurationError(["arguments"]);
    }
    parsed.set(name, value);
  }
  return {
    target: parsed.get("--target"),
    mode: parsed.get("--mode"),
    confirmation: parsed.get("--confirm-production"),
  };
}

export async function runCli(
  values: readonly string[] = process.argv.slice(2),
): Promise<void> {
  const arguments_ = parseArguments(values);
  const config = parsePersistentMigrationConfig({
    target: arguments_.target,
    mode: arguments_.mode,
    confirmation: arguments_.confirmation,
    environment: process.env,
  });
  await runPersistentMigration(config);
  process.stdout.write(
    `Persistent migration ${config.mode} verified for ${config.target}.\n`,
  );
}

function reportFailure(error: unknown) {
  if (
    error instanceof PersistentMigrationConfigurationError ||
    error instanceof PersistentMigrationError
  ) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write("Persistent migration failed unexpectedly.\n");
  }
  process.stderr.write(
    `Production apply requires --confirm-production ${productionMigrationConfirmation}.\n`,
  );
  process.exitCode = 1;
}

const executedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (executedPath === import.meta.url) runCli().catch(reportFailure);
