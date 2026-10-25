import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const destructivePatterns = [
  /\bdrop\b/i,
  /\btruncate\b/i,
  /\balter\s+table\b[\s\S]*\brename\s+(?:to|column)\b/i,
  /\balter\s+table\b[\s\S]*\balter\s+column\b/i,
];

export function destructiveMigrationOperations(sql) {
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ");
  return destructivePatterns
    .filter((pattern) => pattern.test(withoutComments))
    .map((pattern) => pattern.source);
}

export async function checkMigrationDirectory(directory) {
  const files = (await readdir(directory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();
  const findings = [];
  for (const file of files) {
    const operations = destructiveMigrationOperations(
      await readFile(resolve(directory, file), "utf8"),
    );
    if (operations.length > 0) findings.push({ file, operations });
  }
  return { files, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = resolve(process.argv[2] ?? "packages/database/drizzle");
  const result = await checkMigrationDirectory(directory);
  if (result.files.length === 0) {
    console.error("No versioned SQL migrations found");
    process.exitCode = 1;
  } else if (result.findings.length > 0) {
    console.error(
      `Destructive migration operations require a separately reviewed expand-and-contract change: ${result.findings.map(({ file }) => file).join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Migration safety check passed (${result.files.length} file(s))`,
    );
  }
}
