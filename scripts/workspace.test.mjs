import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { ESLint } = createRequire(
  new URL("../packages/config/package.json", import.meta.url),
)("eslint");
import { workspaceConfig } from "@vowora/config/eslint";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const root = new URL("../", import.meta.url);

for (const layer of ["domain", "contracts"]) {
  test(`${layer} rejects framework, application and cross-package implementation imports`, async () => {
    const lint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: workspaceConfig(layer),
    });
    for (const name of [
      "next/headers",
      "react",
      "node:fs",
      "fs",
      "fs/promises",
      "path",
      "@vowora/web",
      "@vowora/domain/internal",
      "../../../apps/web/app/page",
      "../../marketing/app/page",
    ]) {
      const [result] = await lint.lintText(
        `import * as dependency from '${name}';\nvoid dependency;`,
        { filePath: `packages/${layer}/src/probe.ts` },
      );
      assert(
        result.messages.some((m) => m.ruleId === "no-restricted-imports"),
        name,
      );
    }
    const [valid] = await lint.lintText(
      "export type Example = { readonly value: string };",
      { filePath: `packages/${layer}/src/probe.ts` },
    );
    assert.equal(valid.errorCount, 0);
  });
}
for (const layer of ["web", "marketing"]) {
  test(`${layer} cannot import the other application's internals`, async () => {
    const lint = new ESLint({
      cwd: new URL(`apps/${layer}/`, root).pathname,
      overrideConfigFile: true,
      overrideConfig: workspaceConfig(layer),
    });
    const other = layer === "web" ? "marketing" : "web";
    for (const name of [
      `../../${other}/app/page`,
      "../../../packages/domain/src/index",
      "../../../packages/contracts/src/index",
      "@vowora/domain/internal",
      "@vowora/contracts/internal",
    ]) {
      const [result] = await lint.lintText(`import '${name}';`, {
        filePath: "app/probe.ts",
      });
      assert(
        result.messages.some((m) => m.ruleId === "no-restricted-imports"),
        name,
      );
    }
    for (const name of ["@vowora/domain", "@vowora/contracts"]) {
      const [result] = await lint.lintText(`import type {} from '${name}';`, {
        filePath: "app/probe.ts",
      });
      assert.equal(result.errorCount, 0, name);
    }
  });
}
test("database package can use infrastructure dependencies but not application internals", async () => {
  const lint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: workspaceConfig("database"),
  });
  const [valid] = await lint.lintText(
    "import { createHash } from 'node:crypto';\nimport type {} from '@vowora/domain';\nvoid createHash;",
    { filePath: "packages/database/src/probe.ts" },
  );
  assert.equal(valid.errorCount, 0);
  for (const name of [
    "../../../apps/web/app/page",
    "@vowora/domain/internal",
  ]) {
    const [invalid] = await lint.lintText(`import '${name}';`, {
      filePath: "packages/database/src/probe.ts",
    });
    assert(
      invalid.messages.some(
        (message) => message.ruleId === "no-restricted-imports",
      ),
      name,
    );
  }
});
test("web route handlers cannot bypass application services for database access", async () => {
  const lint = new ESLint({
    cwd: new URL("apps/web/", root).pathname,
    overrideConfigFile: true,
    overrideConfig: workspaceConfig("web"),
  });
  for (const [name, source] of [
    ["package import", "import '@vowora/database';"],
    ["testing subpath", "import '@vowora/database/testing';"],
    ["dynamic import", "void import('@vowora/database');"],
    [
      "named re-export",
      "export { createRuntimeDatabase } from '@vowora/database';",
    ],
    ["star re-export", "export * from '@vowora/database';"],
    [
      "relative database source",
      "import '../../../../../packages/database/src/client';",
    ],
  ]) {
    const [result] = await lint.lintText(source, {
      filePath: "app/api/v1/probe/route.ts",
    });
    assert(
      result.messages.some(
        (message) => message.ruleId === "no-restricted-syntax",
      ),
      name,
    );
  }
  const [service] = await lint.lintText(
    "import type {} from '@vowora/domain';",
    { filePath: "app/api/v1/probe/route.ts" },
  );
  assert.equal(service.errorCount, 0);
});
test("domain/contracts expose only their public compiled entrypoint", async () => {
  for (const name of ["domain", "contracts"]) {
    const manifest = JSON.parse(
      await readFile(new URL(`packages/${name}/package.json`, root)),
    );
    assert.deepEqual(Object.keys(manifest.exports), ["."]);
    const output = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        `await import('@vowora/${name}'); try { await import('@vowora/${name}/internal'); process.exit(1) } catch(e) { if (e.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw e }`,
      ],
      { cwd: new URL("apps/web/", root), encoding: "utf8" },
    );
    assert.equal(output, "");
  }
});
test("database keeps migration helpers behind its explicit testing entrypoint", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("packages/database/package.json", root)),
  );
  assert.deepEqual(Object.keys(manifest.exports), [
    ".",
    "./schema",
    "./testing",
  ]);
  const output = execFileSync(
    "node",
    [
      "--input-type=module",
      "-e",
      "const runtime = await import('@vowora/database'); if ('applyMigrations' in runtime || 'parseTestMigrationConfig' in runtime || 'withIsolatedTestSchema' in runtime) process.exit(1); const testing = await import('@vowora/database/testing'); if (typeof testing.applyMigrations !== 'function' || typeof testing.parseTestMigrationConfig !== 'function') process.exit(1);",
    ],
    { cwd: new URL("packages/database/", root), encoding: "utf8" },
  );
  assert.equal(output, "");
});
test("database integration task builds workspace dependencies on a clean checkout", () => {
  const run = JSON.parse(
    execFileSync(
      "pnpm",
      [
        "exec",
        "turbo",
        "run",
        "test:integration",
        "--filter=@vowora/database",
        "--dry=json",
      ],
      { cwd: root, encoding: "utf8" },
    ),
  );
  const integration = run.tasks.find(
    (task) => task.taskId === "@vowora/database#test:integration",
  );
  assert(integration, "database integration task is present");
  assert(
    integration.dependencies.includes("@vowora/domain#build"),
    "database integration depends on the domain build",
  );
});
test("Turbo app filters do not pull in the other deployable app", () => {
  for (const name of ["web", "marketing"]) {
    const run = JSON.parse(
      execFileSync(
        "pnpm",
        [
          "exec",
          "turbo",
          "run",
          "build",
          `--filter=@vowora/${name}`,
          "--dry=json",
        ],
        { cwd: root, encoding: "utf8" },
      ),
    );
    const other = name === "web" ? "marketing" : "web";
    assert(run.tasks.some((t) => t.package === `@vowora/${name}`));
    assert(!run.tasks.some((t) => t.package === `@vowora/${other}`));
  }
});
