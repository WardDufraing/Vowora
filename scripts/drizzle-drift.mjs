import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const databaseRoot = resolve(root, "packages/database");
const migrationsRoot = resolve(databaseRoot, "drizzle");

async function snapshot(directory) {
  const entries = new Map();
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (entry.isFile()) {
        entries.set(
          relative(directory, path),
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        );
      }
    }
  }
  await visit(directory);
  return [...entries].sort(([left], [right]) => left.localeCompare(right));
}

const before = await snapshot(migrationsRoot);
const result = spawnSync(
  "pnpm",
  ["exec", "drizzle-kit", "generate", "--config", "drizzle.config.ts"],
  { cwd: databaseRoot, encoding: "utf8" },
);
if (result.status !== 0) {
  process.stderr.write(result.stdout + result.stderr);
  process.exitCode = result.status ?? 1;
} else {
  const after = await snapshot(migrationsRoot);
  if (JSON.stringify(after) !== JSON.stringify(before)) {
    console.error(
      "Drizzle schema and committed migrations differ; inspect and commit a reviewed forward migration",
    );
    process.exitCode = 1;
  } else {
    console.log("Drizzle schema matches committed migration metadata");
  }
}
