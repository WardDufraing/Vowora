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
test("application services cannot import database internals", async () => {
  for (const layer of ["web", "marketing"]) {
    const lint = new ESLint({
      cwd: new URL(`apps/${layer}/`, root).pathname,
      overrideConfigFile: true,
      overrideConfig: workspaceConfig(layer),
    });
    for (const source of [
      "import '../../../packages/database/src/tenant';",
      "import '../../../packages/database/./src/tenant';",
      "import '../../../packages/./database/src/tenant';",
      "import '../../../packages/config/../database/src/tenant';",
      "import '../../../packages/database/dist/../src/tenant';",
      "import '../../../packages/database/src/test/authorization';",
      "void import('../../../packages/database/dist/tenant.js');",
      "const target = '../../../packages/database'; void import(target + '/src/tenant');",
      "export * from '@vowora/database/testing';",
      "import './database-bridge.unit.test';",
      "void import('./database-bridge.unit.test');",
      "export * from './database-bridge.unit.test';",
    ]) {
      const [result] = await lint.lintText(source, {
        filePath: "lib/feature-service.ts",
      });
      assert(
        result.messages.some(
          (message) => message.ruleId === "no-restricted-syntax",
        ),
        `${layer}: ${source}`,
      );
    }
    const [publicRoot] = await lint.lintText(
      "import type { TransactionHost } from '@vowora/database';",
      { filePath: "lib/feature-service.ts" },
    );
    assert.equal(publicRoot.errorCount, 0, layer);

    const [testBridge] = await lint.lintText(
      "export { withTenantTransaction } from '../../../packages/database/src/tenant';",
      { filePath: "lib/database-bridge.unit.test.ts" },
    );
    assert(
      testBridge.messages.some(
        (message) => message.ruleId === "no-restricted-syntax",
      ),
      `${layer}: test files cannot bridge database internals`,
    );
    const [testEntrypoint] = await lint.lintText(
      "import type {} from '@vowora/database/testing';",
      { filePath: "lib/database-fixture.unit.test.ts" },
    );
    assert.equal(testEntrypoint.errorCount, 0, `${layer}: test entrypoint`);
  }
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
  const domainOutput = execFileSync(
    "node",
    [
      "--input-type=module",
      "-e",
      "const runtime = await import('@vowora/domain'); if ('resolveAuthorizationContext' in runtime || 'parseAuthorizationContextInput' in runtime) process.exit(1);",
    ],
    { cwd: new URL("apps/web/", root), encoding: "utf8" },
  );
  assert.equal(domainOutput, "");
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
      "const runtime = await import('@vowora/database'); if ('applyMigrations' in runtime || 'parseTestMigrationConfig' in runtime || 'withIsolatedTestSchema' in runtime || 'withTenantTransaction' in runtime) process.exit(1); const testing = await import('@vowora/database/testing'); if (typeof testing.applyMigrations !== 'function' || typeof testing.parseTestMigrationConfig !== 'function') process.exit(1);",
    ],
    { cwd: new URL("packages/database/", root), encoding: "utf8" },
  );
  assert.equal(output, "");
});
test("feature code cannot import or call the infrastructure-only tenant transaction", async () => {
  const imported =
    "import { withTenantTransaction } from '@vowora/database';\nvoid withTenantTransaction;\n";
  const authorized =
    "import { withAuthorizedTenantTransaction } from '@vowora/database';\nvoid withAuthorizedTenantTransaction;\n";
  const called =
    "export async function save(): Promise<void> {\n  await withTenantTransaction();\n}\ndeclare function withTenantTransaction(): Promise<void>;\n";
  const computed =
    "import * as database from '@vowora/database';\nvoid database['withTenantTransaction'];\n";
  const isBareTenantTransaction = (result) =>
    result.messages.some(
      (message) =>
        message.ruleId === "no-restricted-syntax" &&
        message.message.includes("withAuthorizedTenantTransaction"),
    );

  for (const layer of ["web", "marketing"]) {
    const lint = new ESLint({
      cwd: new URL(`apps/${layer}/`, root).pathname,
      overrideConfigFile: true,
      overrideConfig: workspaceConfig(layer),
    });
    for (const [filePath, source] of [
      ["lib/feature-service.ts", imported],
      ["lib/feature-service.ts", called],
      ["lib/feature-service.ts", computed],
      ["lib/feature-service.unit.test.ts", imported],
      ["app/api/v1/probe/route.ts", called],
    ]) {
      const [result] = await lint.lintText(source, { filePath });
      assert(
        isBareTenantTransaction(result),
        `${layer} ${filePath} accepted infrastructure transaction`,
      );
    }
    const [allowed] = await lint.lintText(authorized, {
      filePath: "lib/feature-service.ts",
    });
    assert.equal(allowed.errorCount, 0, `${layer} authorized boundary`);
  }

  const databaseLint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: workspaceConfig("database"),
  });
  const relativeImport =
    "import { withTenantTransaction } from './tenant.js';\nvoid withTenantTransaction;\n";
  for (const filePath of [
    "src/feature-repository.ts",
    "packages/database/src/feature-repository.ts",
    "src/repositories/wedding.ts",
    "packages/database/src/repositories/wedding.ts",
    "vitest.integration.config.ts",
    "packages/database/vitest.integration.config.ts",
    "packages/domain/src/tenant.unit.test.ts",
  ]) {
    const [result] = await databaseLint.lintText(relativeImport, { filePath });
    assert(
      isBareTenantTransaction(result),
      `${filePath} accepted infrastructure transaction`,
    );
  }
  const [databaseCall] = await databaseLint.lintText(called, {
    filePath: "src/feature-repository.ts",
  });
  assert(isBareTenantTransaction(databaseCall), "database call");
  const definition =
    "export function withTenantTransaction(): Promise<void> {\n  return Promise.resolve();\n}\n";
  const authorizedRelative =
    "import { withAuthorizedTenantTransaction } from './tenant.js';\nvoid withAuthorizedTenantTransaction;\n";
  for (const [filePath, source] of [
    ["src/tenant.ts", definition],
    ["packages/database/src/tenant.ts", definition],
    ["src/tenant.unit.test.ts", relativeImport],
    ["packages/database/src/tenant.unit.test.ts", relativeImport],
    ["src/tenant-repository.integration.test.ts", relativeImport],
    [
      "packages/database/src/tenant-repository.integration.test.ts",
      relativeImport,
    ],
    ["src/test/authorization.ts", relativeImport],
    ["packages/database/src/test/authorization.ts", relativeImport],
    ["src/feature-repository.ts", authorizedRelative],
    ["packages/database/src/feature-repository.ts", authorizedRelative],
  ]) {
    const [result] = await databaseLint.lintText(source, { filePath });
    assert.equal(
      result.errorCount,
      0,
      `${filePath}\n${result.messages.map((message) => message.message).join("\n")}`,
    );
  }

  for (const layer of ["domain", "contracts"]) {
    const lint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: workspaceConfig(layer),
    });
    for (const filePath of [
      "src/feature.ts",
      `packages/${layer}/src/feature.ts`,
    ]) {
      const [result] = await lint.lintText(called, { filePath });
      assert(
        isBareTenantTransaction(result),
        `${layer} ${filePath} accepted infrastructure transaction`,
      );
    }
    const [allowed] = await lint.lintText(
      'export const boundary = "withTenantTransaction";\n',
      { filePath: "src/feature.ts" },
    );
    assert.equal(allowed.errorCount, 0, `${layer} string mention`);
  }
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
test("shared TypeScript configs name Node ambient types explicitly", async () => {
  const library = JSON.parse(
    await readFile(new URL("packages/config/library.json", root), "utf8"),
  );
  const next = JSON.parse(
    await readFile(new URL("packages/config/next.json", root), "utf8"),
  );
  assert.deepEqual(library.compilerOptions.lib, ["ES2022"]);
  assert.deepEqual(library.compilerOptions.types, ["node"]);
  assert.equal(
    library.compilerOptions.lib.some((name) => /dom/i.test(name)),
    false,
  );
  assert.deepEqual(next.compilerOptions.types, ["node"]);
  for (const file of [
    "packages/domain/tsconfig.json",
    "packages/database/tsconfig.json",
    "packages/contracts/tsconfig.json",
    "apps/web/tsconfig.json",
    "apps/marketing/tsconfig.json",
    "tsconfig.test.json",
  ]) {
    const config = JSON.parse(await readFile(new URL(file, root), "utf8"));
    assert.equal(
      Object.hasOwn(config.compilerOptions ?? {}, "types"),
      false,
      file,
    );
  }
});
test("root test typecheck resolves integration imports without compiled package output", async () => {
  const config = JSON.parse(
    await readFile(new URL("tsconfig.test.json", root)),
  );
  assert.deepEqual(config.compilerOptions.paths, {
    "@vowora/contracts": ["./packages/contracts/src/index.ts"],
    "@vowora/database": ["./packages/database/src/index.ts"],
    "@vowora/database/testing": ["./packages/database/src/testing.ts"],
    "@vowora/domain": ["./packages/domain/src/index.ts"],
  });
  assert.equal(
    Object.hasOwn(config.compilerOptions, "baseUrl"),
    false,
    "TypeScript 7 rejects baseUrl; paths are relative to this config file",
  );
});
test("TypeScript 7 compiles while eslint still loads the TypeScript 6 API", async () => {
  const nativeAlias = "npm:typescript@7.0.2";
  const apiAlias = "npm:@typescript/typescript6@6.0.2";
  const compilerManifests = [
    "package.json",
    "apps/web/package.json",
    "apps/marketing/package.json",
    "packages/domain/package.json",
    "packages/contracts/package.json",
    "packages/database/package.json",
  ];
  for (const file of compilerManifests) {
    const manifest = JSON.parse(await readFile(new URL(file, root), "utf8"));
    const deps = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    };
    assert.equal(deps["@typescript/native"], nativeAlias, file);
    assert.equal(deps.typescript, apiAlias, file);
  }
  const rootManifest = JSON.parse(
    await readFile(new URL("package.json", root), "utf8"),
  );
  const engineCeiling = Math.max(
    ...rootManifest.engines.node.split("||").map((range) => {
      const match = range.match(/(\d+)\.\d+\.\d+/);
      assert.ok(match, rootManifest.engines.node);
      return Number(match[1]);
    }),
  );
  const nodeTypeManifests = [
    "package.json",
    "apps/web/package.json",
    "apps/marketing/package.json",
    "packages/domain/package.json",
    "packages/contracts/package.json",
    "packages/database/package.json",
    "packages/config/package.json",
  ];
  const mustDeclareNodeTypes = new Set([
    "package.json",
    "apps/web/package.json",
    "apps/marketing/package.json",
  ]);
  for (const file of nodeTypeManifests) {
    const manifest = JSON.parse(await readFile(new URL(file, root), "utf8"));
    const declared = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    }["@types/node"];
    if (declared === undefined) {
      assert.equal(mustDeclareNodeTypes.has(file), false, file);
      continue;
    }
    assert.equal(
      Number(String(declared).split(".")[0]),
      engineCeiling,
      `${file} @types/node must track the engines Node major ceiling`,
    );
  }
  const configManifest = JSON.parse(
    await readFile(new URL("packages/config/package.json", root), "utf8"),
  );
  assert.equal(configManifest.dependencies.typescript, apiAlias);
  assert.equal(configManifest.dependencies["@typescript/native"], undefined);
  const configRequire = createRequire(
    new URL("../packages/config/package.json", import.meta.url),
  );
  const apiPackage = configRequire("typescript/package.json");
  assert.equal(apiPackage.name, "@typescript/typescript6");
  assert.equal(apiPackage.version, "6.0.2");
  assert.equal(apiPackage.bin.tsc, undefined);
  assert.equal(typeof apiPackage.bin.tsc6, "string");
  assert.match(configRequire("typescript").version, /^6\.0\./);
  const eslintConfigRequire = createRequire(
    configRequire.resolve("eslint-config-next"),
  );
  assert.equal(
    eslintConfigRequire("typescript-eslint/package.json").version,
    "8.72.1",
  );
  assert.equal(
    eslintConfigRequire("typescript/package.json").name,
    "@typescript/typescript6",
  );
  assert.match(eslintConfigRequire("typescript").version, /^6\.0\./);
  const eslintConfigPackage = JSON.parse(
    await readFile(
      new URL(
        "packages/config/node_modules/eslint-config-next/package.json",
        root,
      ),
      "utf8",
    ),
  );
  assert.equal(eslintConfigPackage.version, "16.4.3");
  const nativePackage = createRequire(
    new URL("../package.json", import.meta.url),
  )("@typescript/native/package.json");
  assert.equal(nativePackage.name, "typescript");
  assert.equal(nativePackage.version, "7.0.2");
  assert.equal(typeof nativePackage.bin.tsc, "string");
  for (const directory of [
    root,
    new URL("apps/web/", root),
    new URL("apps/marketing/", root),
    new URL("packages/domain/", root),
    new URL("packages/contracts/", root),
    new URL("packages/database/", root),
  ]) {
    const cwd = directory.pathname;
    assert.equal(
      execFileSync("pnpm", ["exec", "tsc", "--version"], {
        cwd,
        encoding: "utf8",
      }).trim(),
      "Version 7.0.2",
      cwd,
    );
    assert.match(
      execFileSync("pnpm", ["exec", "tsc6", "--version"], {
        cwd,
        encoding: "utf8",
      }).trim(),
      /^Version 6\.0\.\d+$/,
      cwd,
    );
  }
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

test("persistent migrations cannot run from builds, Vercel, or ordinary CI", async () => {
  const rootManifest = JSON.parse(
    await readFile(new URL("package.json", root)),
  );
  const databaseManifest = JSON.parse(
    await readFile(new URL("packages/database/package.json", root)),
  );
  const turbo = JSON.parse(await readFile(new URL("turbo.json", root)));
  const marketingWorkflow = await readFile(
    new URL(".github/workflows/marketing.yml", root),
    "utf8",
  );
  const migrationWorkflow = await readFile(
    new URL(".github/workflows/persistent-migrations.yml", root),
    "utf8",
  );
  for (const script of [
    rootManifest.scripts.build,
    rootManifest.scripts["build:web"],
    rootManifest.scripts["build:marketing"],
    databaseManifest.scripts.build,
  ]) {
    assert.doesNotMatch(script, /migrate:persistent|persistent-migrate-cli/);
  }
  assert(!turbo.tasks.build.dependsOn?.includes("db:migrate:persistent"));
  assert.doesNotMatch(marketingWorkflow, /db:migrate:persistent/);
  assert.match(migrationWorkflow, /workflow_dispatch:/);
  assert.doesNotMatch(migrationWorkflow, /\b(push|pull_request|schedule):/);
  assert.match(migrationWorkflow, /cancel-in-progress: false/);
  assert.match(migrationWorkflow, /refs\/heads\/main/);
  assert.match(migrationWorkflow, /refs\/heads\/production/);
  assert.match(migrationWorkflow, /ref:.*production.*main/);
  const migrationStep = migrationWorkflow.indexOf(
    "- name: Run controlled persistent migration",
  );
  assert(migrationStep > 0);
  assert(
    migrationWorkflow.indexOf("DATABASE_MIGRATION_URL") > migrationStep,
    "database secrets are scoped to the final migration step",
  );
  assert.match(
    migrationWorkflow.slice(migrationStep),
    /node packages\/database\/dist\/persistent-migrate-cli\.js/,
  );
});
