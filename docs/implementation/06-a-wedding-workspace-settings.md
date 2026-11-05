# 06-a Wedding workspace creation and core settings

## Delivered boundary

An authenticated account can create a wedding through the couple self-service path at `/weddings/new`. Creation accepts only a name, optional date-only wedding date and IANA time zone. The actor always comes from the Better Auth server session. The browser cannot submit a tenant ID, role or creation mode.

The transaction inserts the wedding, an active non-expiring `partner` membership for the creator, one append-only audit event and one outbox event. `(creator_actor_id, creation_request_id)` is unique. Exact retries with the same `Idempotency-Key` return the existing wedding; reusing the key for another payload returns `409`. The stored fingerprint describes the original payload, so an old creation retry remains valid after later settings edits. A database uniqueness conflict serializes concurrent retries.

Partners can update the wedding name, date and time zone at `/weddings/{weddingId}/settings`. The server loads the authoritative membership, checks the `settings:edit` permission, then revalidates membership status, expiry, tenant and permission-scope version inside the write transaction. `settings_version` provides optimistic concurrency; stale writes return `409`. The update and its audit/outbox facts commit or roll back together. Cross-wedding, revoked and expired membership failures use privacy-safe access responses.

Product decisions allow professional planners to create a workspace before the partners register, but the current model has no authoritative professional or organization identity source. The public request therefore has no planner creation mode and cannot mint a planner membership. That path remains fail closed until its owning persistence can issue a trusted server capability. Invitation, email verification, partner claim and ownership transfer belong to 06-b.

The settings form is available in English, Dutch, French and German. It uses the persisted application shell and exposes associated descriptions, inline errors, an error summary, busy state and live success/error status.

## Migration and grants

Migration `0003_real_joystick.sql` adds `weddings` and `wedding_memberships`, with the Drizzle snapshot and journal entry. The persistent migration manifest grants the runtime role `SELECT`, `INSERT` and `UPDATE` on `weddings`, and only `SELECT` and `INSERT` on `wedding_memberships`. It grants no membership update, `DELETE`, `TRUNCATE`, schema mutation, journal access or future-object privilege. Partner removal remains unavailable to runtime SQL and protected by the domain membership policy.

Vercel builds must never run migrations. After this PR is merged, the owner applies the migration manually with the direct migration connection and the established workflow:

```bash
pnpm db:migrate:persistent --target staging --mode apply
pnpm db:migrate:persistent --target staging --mode verify
```

Only after staging creation, settings, retry and authorization checks pass and the production application is ready:

```bash
pnpm db:migrate:persistent --target production --mode apply --confirm-production APPLY_VOWORA_PRODUCTION_MIGRATIONS
pnpm db:migrate:persistent --target production --mode verify
```

Do not run `pnpm test:database` against Neon or any other persistent database. Local database validation uses a disposable PostgreSQL 17 instance bound to loopback:

```bash
DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:<port>/vowora_test \
pnpm --filter @vowora/database test:integration

DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:<port>/vowora_test \
pnpm --filter @vowora/database test:persistent-migrations
```

Migration metadata and safety can be checked without applying to a persistent target:

```bash
pnpm --filter @vowora/database db:check
pnpm --filter @vowora/database db:drift
pnpm --filter @vowora/database db:safety
```
