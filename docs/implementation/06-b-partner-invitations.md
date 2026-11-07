# 06-b Partner invitations and claim lifecycle

## Delivered boundary

An authorized wedding administrator can create one pending second-partner invitation from Workspace Settings. The server derives the actor and wedding from the authenticated session and central `settings:edit` authorization. The client submits only the normalized recipient email. A wedding cannot have more than two active partners, cannot invite an email that already belongs to an active wedding member, and cannot have multiple pending partner invitations.

Each invitation receives a random 256-bit bearer token. Only its SHA-256 digest is stored in `wedding_invitations`; the raw token is returned once as a same-origin secure link. Invitations expire exactly 14 days after issuance and record one email-reminder deadline three days before expiry. Issuance, expiry/reminder facts, audit history and outbox capture commit atomically. Task 16 owns outbox dispatch and task 16-c owns Resend delivery, so request handling never performs an external email call or a migration.

Acceptance requires an authenticated account, an explicit confirmation request, and an authoritative `auth_user` row whose verified normalized email exactly matches the invited address. The transaction locks the invitation and wedding, rejects expired/revoked/replaced/wrong-account tokens, enforces the two-partner limit, inserts an active non-expiring `partner` membership and records audit/outbox facts. Exact retries by the accepting actor are idempotent; concurrent acceptance serializes under the invitation row lock. Wrong-email and invalid-token responses are intentionally indistinguishable.

An authorized administrator can revoke a pending invitation immediately. An expired invitation can be renewed only to its original authorized email; renewal atomically marks the old token replaced and gives the new invitation its own 14-day validity and reminder deadline. These transitions preserve equal partner authority and never let either partner remove an existing partner.

The issue, revoke and claim screens are responsive semantic forms with busy, success and privacy-safe error states in English, Dutch, French and German. The OpenAPI document covers issue, revoke and explicit acceptance.

## Migration and runtime grants

Migration `0004_strong_union_jack.sql` adds `wedding_invitations` with normalized-email, role, state, token-digest, deadline and acceptance consistency checks; token and pending-partner uniqueness; tenant/reminder indexes; and restrictive foreign keys. The runtime role receives `SELECT` and `INSERT`, plus column-level update only for lifecycle state, acceptance/revocation/replacement links and `updated_at`. It cannot update the invited email, token digest, wedding, role, issuer or deadlines and cannot delete/truncate or access the Drizzle journal.

Vercel builds do not run migrations. After owner merge, apply and verify staging through the reviewed GitHub Actions persistent-migration workflow. Never run `pnpm test:database` against Neon or another persistent database.

## Verification

Executed against this branch:

```bash
pnpm typecheck
pnpm lint
node_modules/.bin/vitest run --config vitest.config.ts
node --test scripts/quality.test.mjs scripts/agent-policy.test.mjs
node --test scripts/workspace.test.mjs
node scripts/migration-safety.mjs packages/database/drizzle
pnpm build
```

Results: all eight type/build dependency tasks, six lint tasks, 43 unit/component files with 259 tests, 22 quality/agent-policy tests, 16 boundary tests, migration drift and five-file additive safety, and both Next.js production builds passed. The build used synthetic local public app/Turnstile values and the canonical `https://vowora.app` marketing URL; no credentials or external provider calls were used.

A disposable loopback PostgreSQL 17 container named `vowora-06b-postgres` ran:

```bash
DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:55432/vowora_test \
../../node_modules/.bin/vitest run --config vitest.integration.config.ts

DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:55432/vowora_test \
../../node_modules/.bin/vitest run --config vitest.persistent.config.ts
```

All 23 integration tests and seven persistent workflow/grant tests passed. A final focused invitation run passed all three lifecycle tests after revocation was added. The container was removed. No Neon or persistent database was accessed.

## Approved limits and follow-up

The 90-day unclaimed-wedding renewal/deletion flow in DEC-012–017 is unreachable because the merged 06-a boundary deliberately has no authoritative professional identity persistence and cannot create a planner-owned unclaimed wedding. This task does not expose a client-declared planner mode. Once milestone 07 supplies trusted professional/organization identity, that path can reuse the same verified-email, replacement and claim primitives without weakening the current boundary.

Email delivery retries, shared delivery-failure issues, personal inbox state and snoozing from DEC-021–036 require the database-backed notification inbox, Trigger.dev dispatcher and Resend delivery tracking owned by milestone 16. This task emits the durable, privacy-minimized invitation facts and exact reminder deadline required by those workers; it does not duplicate that future infrastructure.

Rollback before persistent apply is branch/PR reversion. After apply, keep the additive table and stop using the routes; do not drop data in a rollback migration. No environment, DNS, Vercel, Resend or other external configuration changed.
