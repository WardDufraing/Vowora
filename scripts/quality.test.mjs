import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { destructiveMigrationOperations } from "./migration-safety.mjs";
const require = createRequire(import.meta.url);
const prettier = require.resolve("prettier/bin/prettier.cjs");
const root = new URL("../", import.meta.url);

test("format gate rejects unformatted maintained source and accepts formatted source", () => {
  const run = (input) =>
    spawnSync(
      process.execPath,
      [prettier, "--check", "--stdin-filepath", "apps/web/app/probe.ts"],
      { cwd: root, input, encoding: "utf8" },
    );
  assert.equal(run("const value={ok:true};\n").status, 1);
  assert.equal(run("const value = { ok: true };\n").status, 0);
});

test("lint gate rejects real errors without weakening package boundary checks", async () => {
  const { ESLint } = createRequire(
    new URL("../packages/config/package.json", import.meta.url),
  )("eslint");
  const { workspaceConfig } = await import("@vowora/config/eslint");
  const lint = new ESLint({
    cwd: new URL("apps/web/", root).pathname,
    overrideConfigFile: true,
    overrideConfig: workspaceConfig("web"),
  });
  const [invalid] = await lint.lintText(
    'const value: any = "bad";\nexport default value;',
    { filePath: "app/probe.ts" },
  );
  assert(
    invalid.messages.some(
      (message) => message.ruleId === "@typescript-eslint/no-explicit-any",
    ),
  );
  const [valid] = await lint.lintText('export const value: string = "valid";', {
    filePath: "app/probe.ts",
  });
  assert.equal(valid.errorCount, 0);
});

test(
  "build gate rejects invalid environment without disclosing its value",
  { timeout: 30000 },
  () => {
    const invalidValue = "invalid-private-ci-probe";
    const result = spawnSync("pnpm", ["build:web"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, VOWORA_ENV: invalidValue },
    });
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, output);
    assert.match(output, /VOWORA_ENV/);
    assert.doesNotMatch(output, new RegExp(invalidValue));
  },
);

test("migration gate rejects destructive SQL and accepts additive SQL", () => {
  assert.deepEqual(
    destructiveMigrationOperations(
      'CREATE TABLE "safe" ("id" uuid PRIMARY KEY);',
    ),
    [],
  );
  assert.notEqual(
    destructiveMigrationOperations('ALTER TABLE "safe" DROP COLUMN "id";')
      .length,
    0,
  );
  for (const destructive of [
    'DROP VIEW "legacy_view";',
    'DROP SEQUENCE "legacy_sequence";',
    'DROP DOMAIN "legacy_domain";',
    'DROP TRIGGER "legacy_trigger" ON "safe";',
    'ALTER TABLE "safe" RENAME COLUMN "name" TO "label";',
    'ALTER TABLE "safe" RENAME CONSTRAINT "old_key" TO "new_key";',
    'ALTER INDEX "old_index" RENAME TO "new_index";',
    'ALTER TYPE "old_type" RENAME TO "new_type";',
    'ALTER DOMAIN "old_domain" RENAME TO "new_domain";',
    'ALTER TABLE "safe" ALTER COLUMN "id" TYPE text;',
    'ALTER TABLE "safe" ALTER COLUMN "id" SET NOT NULL;',
    'ALTER TABLE "safe" ALTER COLUMN "id" DROP NOT NULL;',
    'DELETE FROM "safe";',
    "ALTER TYPE \"status\" RENAME VALUE 'old' TO 'new';",
    "SELECT '--'; DROP TABLE sensitive;",
    "SELECT '/*'; DROP TABLE sensitive; SELECT '*/';",
    "SELECT $$--$$; DROP TABLE sensitive;",
    String.raw`SELECT E'--\''; DROP TABLE sensitive;`,
  ]) {
    assert.notEqual(
      destructiveMigrationOperations(destructive).length,
      0,
      destructive,
    );
  }
  assert.deepEqual(
    destructiveMigrationOperations("-- DROP TABLE ignored_comment;\nSELECT 1;"),
    [],
  );
  for (const quoted of [
    "SELECT 'DROP TABLE quoted_text';",
    'SELECT "DROP TABLE quoted_identifier";',
    "SELECT $$ALTER INDEX old RENAME TO new$$;",
    "SELECT E'DROP DOMAIN escaped';",
    String.raw`SELECT E'safe\' DROP TABLE quoted_text';`,
    "SELECT E'first line\nDROP TABLE quoted_text';",
  ]) {
    assert.deepEqual(destructiveMigrationOperations(quoted), [], quoted);
  }
  for (const structuralAfterString of [
    String.raw`SELECT 'safe\'; DROP TABLE sensitive;`,
    String.raw`SELECT 'safe\\'; DROP TABLE sensitive;`,
    String.raw`SELECT E'safe\\'; DROP TABLE sensitive;`,
    "SELECT 'first line\nsecond line';\nDROP TABLE sensitive;",
  ]) {
    assert.notEqual(
      destructiveMigrationOperations(structuralAfterString).length,
      0,
      structuralAfterString,
    );
  }
});
