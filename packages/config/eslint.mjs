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
const importNodes = [
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportAllDeclaration",
  "ImportExpression",
];
function importRestrictions(pattern, message) {
  return importNodes.map((nodeType) => ({
    selector: `${nodeType}[source.value=${pattern}]`,
    message,
  }));
}
const applicationDatabaseSourceRestrictions = importRestrictions(
  "/(?:^|\\/)packages\\/.*database(?:\\/|$)/",
  "Database source and compiled internals are unreachable from application files, including tests.",
);
const applicationDatabaseSubpathRestrictions = importRestrictions(
  "/^@vowora\\/database\\//",
  "Application services may import the public database package only; database subpaths are internal.",
);
const applicationComputedImportRestrictions = [
  {
    selector: 'ImportExpression[source.type!="Literal"]',
    message:
      "Application dynamic imports require a literal public module specifier so package boundaries remain enforceable.",
  },
];
const applicationTestModuleRestrictions = importRestrictions(
  "/^\\..*(?:\\/tests?(?:\\/|$)|(?:\\.test|\\.spec)(?:\\.[^/]*)?$)/",
  "Production application modules cannot import or re-export test modules.",
);
const applicationDatabaseInternalRestrictions = [
  ...applicationDatabaseSourceRestrictions,
  ...applicationDatabaseSubpathRestrictions,
  ...applicationComputedImportRestrictions,
  ...applicationTestModuleRestrictions,
];
// withTenantTransaction takes no AuthorizedServerOperation. Feature code must
// use withAuthorizedTenantTransaction. The defining module, the database
// package tests, and that package's test helpers stay allowlisted.
const bareTenantTransactionMessage =
  "Feature code must use withAuthorizedTenantTransaction. withTenantTransaction is infrastructure-only and takes no AuthorizedServerOperation.";
const bareTenantTransactionRestrictions = [
  {
    selector: "Identifier[name='withTenantTransaction']",
    message: bareTenantTransactionMessage,
  },
  {
    selector: "MemberExpression[property.value='withTenantTransaction']",
    message: bareTenantTransactionMessage,
  },
  {
    selector: "Property[key.value='withTenantTransaction']",
    message: bareTenantTransactionMessage,
  },
];
const databaseBareTenantTransactionAllowlist = [
  "src/tenant.ts",
  "src/*.test.ts",
  "src/*.test.tsx",
  "src/**/*.test.ts",
  "src/**/*.test.tsx",
  "src/test/**/*.ts",
  "src/test/**/*.tsx",
  "**/packages/database/src/tenant.ts",
  "**/packages/database/src/*.test.ts",
  "**/packages/database/src/*.test.tsx",
  "**/packages/database/src/**/*.test.ts",
  "**/packages/database/src/**/*.test.tsx",
  "**/packages/database/src/test/**/*.ts",
  "**/packages/database/src/test/**/*.tsx",
];

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
                ...bareTenantTransactionRestrictions,
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
              "no-restricted-syntax": [
                "error",
                ...bareTenantTransactionRestrictions,
                ...applicationDatabaseSourceRestrictions,
                ...applicationComputedImportRestrictions,
              ],
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
                ...bareTenantTransactionRestrictions,
                ...applicationDatabaseInternalRestrictions,
                ...routeDatabaseRestrictions,
              ],
            },
          },
        ]
      : []),
    ...(layer === "database"
      ? [
          {
            files: ["**/*.{ts,tsx}"],
            ignores: databaseBareTenantTransactionAllowlist,
            rules: {
              "no-restricted-syntax": [
                "error",
                ...bareTenantTransactionRestrictions,
              ],
            },
          },
        ]
      : []),
    ...(layer === "domain" || layer === "contracts"
      ? [
          {
            files: ["**/*.{ts,tsx}"],
            rules: {
              "no-restricted-syntax": [
                "error",
                ...bareTenantTransactionRestrictions,
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
