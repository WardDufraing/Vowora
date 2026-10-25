# 02-a database and migration harness

## Scope and architecture

Task 02-a implements ARCH-001, ARCH-006, ARCH-008, ARCH-017, ARCH-036, ARCH-048, ARCH-061, ARCH-065, ARCH-086, ARCH-097, ARCH-101, ARCH-107, ARCH-127, ARCH-137, ARCH-145 and ARCH-148. `@vowora/database` owns the Drizzle schema, reviewed SQL migrations, application UUIDv7 generation, the Neon serverless runtime pool factory and isolated PostgreSQL migration-test helpers. It contains no wedding, organization, user, authorization, audit or outbox model; those remain 02-b/02-c work. PostgreSQL RLS is not enabled.

The only initial table is infrastructure-only `schema_metadata`. Its UUID primary key is generated in the application with UUIDv7, SQL names are snake_case and its instant is PostgreSQL `timestamptz`. Drizzle Kit generates the committed forward SQL and snapshot. A quote-aware static gate rejects drops, truncation, data deletion, table/column/constraint/index/type/domain renames, column type and nullability changes, and enum value renames so an expand-and-contract change cannot pass unnoticed. Quoted strings and identifiers are ignored by the gate, with PostgreSQL backslash escapes applied only to explicit `E'…'` strings and dollar quotes recognized only at valid token boundaries. Production rollback remains application rollback plus a reviewed corrective forward migration; the harness does not manufacture unsafe down migrations.

`createRuntimeDatabase` uses Drizzle's Neon serverless adapter and a bounded pool. Defaults are four local, three preview and five production connections, capped at ten. Connection, idle, statement and idle-transaction timeouts are bounded. Every non-loopback URL requires managed TLS, regardless of its deployment label. Configuration errors contain variable names only. Runtime and migration identities are distinct: test migrations require `DATABASE_MIGRATION_URL` plus `DATABASE_MIGRATION_TARGET=test`, an explicit migration username and database, reject a matching runtime URL/username after one standards-based URI percent-decoding pass, and require TLS for non-local hosts. Malformed encoded identities fail without value reflection. Migration configuration and schema lifecycle helpers are available only from the explicit `@vowora/database/testing` subpath; the production root exports no migration or schema-drop API. Merely importing or building the package never reads environment variables or opens a connection.

Each integration run hashes its untrusted run identifier into a validated `vowora_test_<digest>` schema. It creates that exact schema, applies committed migrations with a schema-local Drizzle migration journal, supplies one connection with the matching `search_path`, and drops only the schema that this invocation successfully created in `finally`. Tests exercise idempotent replay, transaction rollback, simultaneous run isolation, UUIDv7 persistence and cleanup after success and failure with synthetic data.

## Commands

From the repository root with Node 24.15+ or 22.22.2+ and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --concurrency=2
pnpm test
pnpm audit --prod --audit-level high
```

Migration integration tests additionally require a dedicated non-production PostgreSQL database and migration identity:

```sh
pnpm test:database
```

Provide `DATABASE_MIGRATION_TARGET=test` and `DATABASE_MIGRATION_URL` through the test runner's environment. Never put the URL or credential value in chat, source, logs or a pull request. The checked-in CI job uses a digest-pinned disposable PostgreSQL 17 service and synthetic credentials; no GitHub or Neon secret is required. Local validation used the same pinned image on an explicit loopback port with an explicit unique container name and removed that container afterward. The architecture's future persistent shared Neon test database remains an owner-managed requirement for repository/tenant suites beginning in later tasks; this task neither creates a Neon project nor binds a credential.

`pnpm --filter @vowora/database db:generate` creates a reviewed forward migration after a schema edit. `db:check` validates Drizzle migration metadata, generating again reports no drift, and `db:safety` rejects destructive SQL. Production migration execution is intentionally absent until a separately approved controlled workflow and dedicated production migration identity exist.

## Evidence and handoff

The merged implementation passed frozen installation, formatting, lint, production and test typechecks, Drizzle metadata/drift/destructive-SQL gates, both production builds, 39 unit tests, four tooling tests, eight boundary tests, one application/API smoke test, 28 browser tests, three real PostgreSQL migration tests and the production dependency audit. Post-merge review found encoded-identity and destructive-rename bypasses; the corrective branch adds two unit regressions and the missing migration-safety cases. Its focused validation passed formatting, lint, all typechecks, forced builds, 41 unit tests, four tooling tests, eight boundary tests, three real PostgreSQL migration tests and the production dependency audit. Initial corrective review found that ordinary SQL strings incorrectly inherited escape-string backslash behavior; the parser now distinguishes ordinary and `E` strings with structural, quoted and multiline regressions. The integration harness was exercised against real PostgreSQL 17: fresh migration replay, repeated replay, committed writes, transaction rollback, two concurrent isolated schemas and cleanup after thrown failures passed. “Rollback” in this task means application transaction rollback and isolated test-schema cleanup. Approved production rollback uses backward-compatible application rollback plus a reviewed corrective forward migration, never an unreviewed down migration.

While the task was in review, merged dependency PRs advanced `main`. The branch merged that history without rebasing or force-pushing and retained the latest GitHub Actions releases. The grouped dependency update had also selected TypeScript 7.0.2, which the locked `typescript-eslint` 8.72.0 explicitly rejects; this branch restores the last supported TypeScript 5.9.3 and matching Node 24 types across all workspaces. The complete lint/type/build/test suite above passed after that compatibility correction. No external database, Vercel setting, DNS record or deployment was changed.

PR #20 was owner-merged as `3be683e`. A post-merge review found two remaining validation bypasses; the corrective PR recorded in the task brief must merge before 02-b starts. Revert either change through a reviewed corrective PR. There is no production data or external infrastructure rollback.
