import { builtinModules } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Keep transport/domain packages independent of application/framework internals.
export function workspaceConfig(layer) {
  const restricted = [
    "**/domain/**",
    "**/contracts/**",
    "**/marketing",
    "**/marketing/**",
    "**/web",
    "**/web/**",
    "@vowora/marketing",
    "@vowora/marketing/**",
    "@vowora/web",
    "@vowora/web/**",
  ];
  if (layer === "domain" || layer === "contracts") {
    restricted.push(
      "next",
      "next/**",
      "react",
      "react/**",
      "react-dom",
      "react-dom/**",
      "node:*",
      ...builtinModules,
      "@vowora/*",
      "**/domain/**",
      "**/contracts/**",
    );
  }
  return defineConfig([
    ...(layer === "domain" || layer === "contracts" ? [] : nextVitals),
    ...nextTs,
    globalIgnores([
      ".next/**",
      "dist/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ]),
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [...new Set(restricted)],
                message:
                  "Import a public package entrypoint in the permitted layer; never application or framework internals.",
              },
            ],
          },
        ],
      },
    },
  ]);
}

// Node test runners and shared tooling need lint coverage too, independent of
// framework rules. App/package source remains checked from each workspace.
export function toolingConfig() {
  return defineConfig([
    ...nextTs,
    globalIgnores([
      "apps/**",
      "packages/**",
      "docs/**",
      ".agents/**",
      ".codex/**",
      "node_modules/**",
    ]),
    {
      files: ["**/*.{mjs,ts}"],
      languageOptions: {
        globals: { process: "readonly", console: "readonly", URL: "readonly" },
      },
    },
  ]);
}
