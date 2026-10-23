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
