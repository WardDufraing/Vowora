# 03-a operational follow-up: persistent database migrations

## Scope and verified schema

This owner-requested follow-up implements the controlled persistent migration step required by ARCH-017, ARCH-051, ARCH-061, ARCH-065, ARCH-097, ARCH-101, ARCH-127 and ARCH-145. Before implementation, the merged Better Auth 1.7.13 adapter and Drizzle schema were traced together: Better Auth needs read/write/delete access to `auth_user`, `auth_account`, `auth_session` and `auth_verification`; the current audit and outbox repositories only append to `audit_events` and `outbox_events`; application code does not use `schema_metadata`. The committed Drizzle journal contains exactly migrations `0000_dear_surge`, `0001_brief_iron_lad` and `0002_cool_junta`, with matching snapshots.

The workflow has no Vercel, build, import or application-startup hook. It is invoked only by the dedicated CLI or the manual `Persistent database migration` GitHub Actions workflow. Ordinary `pnpm test:database` remains the disposable isolated-schema suite and must never receive a persistent Neon credential. The separate `pnpm test:persistent-migrations` command hard-requires `DATABASE_MIGRATION_TARGET=test`, a loopback host and a database name ending `_test`; it fails before SQL otherwise.

## Security and execution model

Both `--target staging|production` and `--mode apply|verify` are mandatory. A production apply additionally requires the exact non-secret phrase `APPLY_VOWORA_PRODUCTION_MIGRATIONS`. The configuration requires a password-bearing direct migration URL and a separate password-bearing runtime URL for the same database. It rejects pooled migration hosts, unsafe or duplicate TLS modes on managed hosts, malformed or residual encoded identities, matching migration/runtime users and host/database mismatches. Errors name only configuration fields or safe failure categories.

The connected server must report the migration username and database encoded in the direct URL. The runtime role must exist, allow login, have no privileged role attributes and have no memberships. A session advisory lock serializes apply and verify operations. Apply uses Drizzle's persistent `drizzle.__drizzle_migrations` journal, so a completed migration is not reapplied. Runtime-grant reconciliation is transactional and repeatable; a failed run is retried forward after its cause is corrected. There is no down migration.

The workflow revokes database/schema/table/sequence/function access from `PUBLIC` and the runtime role before granting the exact current runtime permissions:

- `auth_user`, `auth_account`, `auth_session`, `auth_verification`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`;
- `audit_events`, `outbox_events`: `INSERT` only;
- `public` schema: `USAGE` only;
- database: `CONNECT` only.

It grants no `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, future-table, `schema_metadata` or migration-journal access. New tables receive no automatic runtime grant: each schema change must update and review the explicit manifest. Database triggers retain the audit table's database-level update/delete/truncate protection.

## Owner setup and exact commands

Create the runtime role once using the migration owner in each Neon database, substituting a password generated and stored outside Git, logs and chat:

```sql
CREATE ROLE vowora_runtime LOGIN PASSWORD '<generated-secret>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
  NOREPLICATION NOBYPASSRLS;
```

The migration URL must be Neon's **direct** connection for the dedicated migration identity. `DATABASE_URL` must use `vowora_runtime`; it may use Neon's pooler. Both managed URLs must contain exactly one `sslmode=require` or `sslmode=verify-full`. Never place `DATABASE_MIGRATION_URL` in Vercel.

Preferred execution is GitHub **Settings → Environments**:

1. Create `staging` and `production` environments.
2. In each environment add secret `DATABASE_MIGRATION_URL` and secret `DATABASE_URL` for that environment only.
3. Add required reviewers to `production` and prevent self-review where the GitHub plan supports it.
4. Open **Actions → Persistent database migration → Run workflow**.
5. Select the exact target and `verify` or `apply`. For production `apply`, enter `APPLY_VOWORA_PRODUCTION_MIGRATIONS` exactly.
6. After apply succeeds, run `verify` separately and inspect the safe one-line result.

For an audited local execution, load both values from a password manager into the process environment without putting them in shell history, then run:

```sh
pnpm db:migrate:persistent --target staging --mode apply
pnpm db:migrate:persistent --target staging --mode verify
pnpm db:migrate:persistent --target production --mode apply --confirm-production APPLY_VOWORA_PRODUCTION_MIGRATIONS
pnpm db:migrate:persistent --target production --mode verify
```

Never run the production commands until staging verification, compatibility checks, backup/recovery readiness and owner release approval are complete. Production rollback is a compatible application rollback plus a reviewed corrective forward migration.

## Verification and handoff

Implementation branch: `chore/03-a-persistent-migrations`. PR and final review evidence are recorded when available. Local automated migration execution used only a digest-pinned disposable PostgreSQL 17 container with synthetic credentials; no Neon, Vercel, Resend, DNS, staging or production resource was contacted or changed. The container was removed after each validation run.

Executed validation:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --force --concurrency=2
pnpm test
pnpm test:database
pnpm test:persistent-migrations
pnpm audit --prod --audit-level high
```

The full non-database suite passed 88 unit/component tests, four tooling tests, twelve boundary tests, one production smoke test and 30 Chromium tests. The existing database suite passed migration metadata, drift and safety, nine database tests and one Better Auth PostgreSQL integration test. The new disposable-only suite passed three real PostgreSQL tests covering preflight before schema changes, idempotent three-entry journal application, exact grants/denials including no future-table access, and concurrent-lock rejection. The production audit passed its high-severity gate and reports the existing moderate optional development-server `esbuild` advisory. Independent review is pending.
