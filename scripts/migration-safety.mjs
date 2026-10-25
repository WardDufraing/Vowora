import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const destructivePatterns = [
  /\bdrop\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
  /\balter\s+table\b[\s\S]*\brename\s+(?:to|column)\b/i,
  /\balter\s+table\b[\s\S]*\balter\s+column\b/i,
  /\balter\s+type\b[\s\S]*\brename\s+value\b/i,
];

function withoutSqlComments(sql) {
  let output = "";
  let state = "normal";
  let dollarDelimiter = "";
  for (let index = 0; index < sql.length; index += 1) {
    const current = sql[index];
    const next = sql[index + 1];
    if (state === "dollar-quote") {
      if (sql.startsWith(dollarDelimiter, index)) {
        output += dollarDelimiter;
        index += dollarDelimiter.length - 1;
        state = "normal";
      } else output += current;
    } else if (state === "line-comment") {
      if (current === "\n") {
        state = "normal";
        output += current;
      } else output += " ";
    } else if (state === "block-comment") {
      if (current === "*" && next === "/") {
        output += "  ";
        index += 1;
        state = "normal";
      } else output += current === "\n" ? "\n" : " ";
    } else if (state === "single-quote") {
      output += current;
      if (current === "'" && next === "'") {
        output += next;
        index += 1;
      } else if (current === "'") state = "normal";
    } else if (state === "double-quote") {
      output += current;
      if (current === '"' && next === '"') {
        output += next;
        index += 1;
      } else if (current === '"') state = "normal";
    } else if (current === "$") {
      const delimiter = sql
        .slice(index)
        .match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
      if (delimiter) {
        dollarDelimiter = delimiter;
        state = "dollar-quote";
        output += delimiter;
        index += delimiter.length - 1;
      } else output += current;
    } else if (current === "'") {
      state = "single-quote";
      output += current;
    } else if (current === '"') {
      state = "double-quote";
      output += current;
    } else if (current === "-" && next === "-") {
      state = "line-comment";
      output += "  ";
      index += 1;
    } else if (current === "/" && next === "*") {
      state = "block-comment";
      output += "  ";
      index += 1;
    } else output += current;
  }
  return output;
}

export function destructiveMigrationOperations(sql) {
  const withoutComments = withoutSqlComments(sql);
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
