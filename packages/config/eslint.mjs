import { builtinModules } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const databaseSourcePattern =
  "/(?:^@vowora\\/database(?:\\/|$)|\\/packages\\/database(?:\\/|$))/";
const routeDatabaseRestrictions = [
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportAllDeclaration",
  "ImportExpression",
].map((nodeType) => ({
  selector: `${nodeType}[source.value=${databaseSourcePattern}]`,
  message:
    "Route handlers must call application services, never database repositories directly.",
}));
const applicationDatabaseInternalPattern =
  "/(?:^@vowora\\/database\\/|\\/packages\\/database\\/(?:src|dist)(?:\\/|$))/";
const applicationDatabaseInternalRestrictions = [
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportAllDeclaration",
  "ImportExpression",
].map((nodeType) => ({
  selector: `${nodeType}[source.value=${applicationDatabaseInternalPattern}]`,
  message:
    "Application services may import the public database package only; database source, dist and subpaths are internal.",
}));

// Keep transport/domain packages independent of application/framework internals.
export function workspaceConfig(layer) {
  const isApplication = layer === "web" || layer === "marketing";
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
  if (layer === "database") {
    restricted.push("@vowora/domain/**");
  }
  return defineConfig([
    ...(isApplication ? nextVitals : []),
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
        ...(isApplication
          ? {
              "no-restricted-syntax": [
                "error",
                ...applicationDatabaseInternalRestrictions,
              ],
            }
          : {}),
      },
    },
    ...(isApplication
      ? [
          {
            files: [
              "**/*.unit.test.{ts,tsx}",
              "**/*.integration.test.{ts,tsx}",
              "**/*.component.test.{ts,tsx}",
              "**/tests/**/*.{ts,tsx}",
            ],
            rules: {
              "no-restricted-syntax": "off",
            },
          },
        ]
      : []),
    ...(layer === "web"
      ? [
          {
            files: ["app/api/**/*.{ts,tsx}"],
            rules: {
              "no-restricted-syntax": [
                "error",
                ...applicationDatabaseInternalRestrictions,
                ...routeDatabaseRestrictions,
              ],
            },
          },
        ]
      : []),
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
