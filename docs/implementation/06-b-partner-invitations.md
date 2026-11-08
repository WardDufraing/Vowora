# 06-b Partner invitations and claim lifecycle

## Delivered boundary

An authorized wedding administrator can create one pending second-partner invitation from Workspace Settings. The server derives the actor and wedding from the authenticated session and central `settings:edit` authorization. The client submits the recipient email and one of the four supported presentation locales. A wedding cannot have more than two active partners, cannot invite an email that already belongs to an active wedding member, and cannot have multiple pending partner invitations.

Each invitation receives a random 256-bit bearer token. Only its SHA-256 digest is stored in `wedding_invitations`; the raw token is returned once as a same-origin secure link. The durable outbox handoff uses a separate non-secret invitation-ID path with the chosen locale. That path still requires an authenticated account with the verified exact invited email and explicit acceptance, so the email link alone grants no access. The bearer token is absent from the invitation row, audit metadata and outbox payload. Invitations expire exactly 14 days after issuance and record one email-reminder deadline three days before expiry. Issuance, expiry/reminder facts, audit history and outbox capture commit atomically. Task 16 owns outbox dispatch and task 16-c owns Resend delivery, so request handling never performs an external email call or a migration.

Acceptance requires an authenticated account, an explicit confirmation request, and an authoritative `auth_user` row whose verified normalized email exactly matches the invited address. The transaction locks the invitation and wedding, rejects expired/revoked/replaced/wrong-account tokens, enforces the two-partner limit, inserts an active non-expiring `partner` membership and records audit/outbox facts. Exact retries by the accepting actor are idempotent; concurrent acceptance serializes under the invitation row lock. Wrong-email and invalid-token responses are intentionally indistinguishable.

An authorized administrator can reload the pending invitation without recovering its bearer token, inspect the invited address and exact deadline, and revoke it immediately. A replacement share link therefore requires revoke-and-create. An expired invitation can be renewed only to its original authorized email; renewal atomically marks the old token replaced and gives the new invitation its own 14-day validity and reminder deadline. These transitions preserve equal partner authority and never let either partner remove an existing partner.

The issue, revoke and claim screens are responsive semantic forms with busy, success, exact-deadline, expired/replacement and privacy-safe error states in English, Dutch, French and German. Invitation continuations survive sign-up verification and sign-in through a validated same-origin path. The OpenAPI document covers listing, issue, revoke, bearer acceptance and verified-email acceptance.

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
pnpm --filter @vowora/web test
pnpm --filter @vowora/web test:e2e
```

Results after the initial review fixes: all eight type/build dependency tasks, six lint tasks, 46 unit/component files with 276 tests, 22 quality/agent-policy tests, 16 boundary tests, the production smoke test, 27 Chromium web tests, migration drift and five-file additive safety, and both Next.js production builds passed. The build used synthetic local public app values and the canonical `https://vowora.app` marketing URL; no credentials or external provider calls were used. The web browser suite used a temporary untracked port override because stale cloud-runner servers occupied its standard port; the override was removed after the run.

A disposable loopback PostgreSQL 17 container named `vowora-06b-postgres` ran:

```bash
DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:55432/vowora_test \
../../node_modules/.bin/vitest run --config vitest.integration.config.ts

DATABASE_MIGRATION_TARGET=test \
DATABASE_MIGRATION_URL=postgresql://vowora_migrator:<synthetic-password>@127.0.0.1:55432/vowora_test \
../../node_modules/.bin/vitest run --config vitest.persistent.config.ts
```

All 23 integration tests and seven persistent workflow/grant tests passed after the review corrections. Coverage includes both verified-email and bearer acceptance under concurrency, token-free outbox storage, exact deadlines, replay/expiry, equal second-partner settings authority, operation-specific denial and cross-wedding revocation isolation. The container was removed. No Neon or persistent database was accessed.

## Independent review

The first fresh reviewer `/root/implement_06_b/review_06_b` reviewed pushed head `355469a` and found two high and two medium gaps: auth continuation was dropped, the outbox lacked a usable privacy-safe delivery path and sender management disappeared after reload, exact expiry/localization states were incomplete, and equal-control/isolation/revocation coverage was missing. The corrections above address every finding. The same review also identified a hosted workspace failure; the production smoke test still expected the pre-06-b OpenAPI path list. That assertion now includes all invitation endpoints and passes locally. A different fresh independent re-review is required on the corrected head before the PR can leave draft.

## Approved limits and follow-up

The 90-day unclaimed-wedding renewal/deletion flow in DEC-012–017 is unreachable because the merged 06-a boundary deliberately has no authoritative professional identity persistence and cannot create a planner-owned unclaimed wedding. This task does not expose a client-declared planner mode. Once milestone 07 supplies trusted professional/organization identity, that path can reuse the same verified-email, replacement and claim primitives without weakening the current boundary.

Email delivery retries, shared delivery-failure issues, personal inbox state and snoozing from DEC-021–036 require the database-backed notification inbox, Trigger.dev dispatcher and Resend delivery tracking owned by milestone 16. This task emits the durable, privacy-minimized invitation facts and exact reminder deadline required by those workers; it does not duplicate that future infrastructure.

Rollback before persistent apply is branch/PR reversion. After apply, keep the additive table and stop using the routes; do not drop data in a rollback migration. No environment, DNS, Vercel, Resend or other external configuration changed.
