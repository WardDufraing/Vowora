# 04-c permission changes, audit and regression suite

Task 04-c completes the authorization foundation without creating membership tables owned by tasks 06 and 07. `@vowora/domain` now creates a strict pair of runtime-provenance-checked events after an authoritative permission-scope mutation: an append-only audit entry and a durable outbox invalidation hook. The input accepts only a wedding or organization membership identifier, exact old/new opaque policy versions, a bounded change kind, effective-access direction, two UUIDv7 event identifiers and one UTC occurrence time. It rejects unchanged versions, reused event identifiers, over-posted fields and cross-tenant capture without reflecting submitted values.

The audit event `authorization.permission_scope_changed` records the membership subject, change category, access direction and version transition. The outbox event `authorization.permission_scope_invalidated` carries only the exact scope, membership identifier and new version required for downstream cache/session refresh and member notification work. Neither envelope accepts names, email addresses, access details, secrets or arbitrary metadata. The existing audit/outbox writers bind both envelopes to the authenticated actor, correlation ID and exact tenant from the opaque 04-b authorization context. Feature repositories in tasks 06/07 must update the authoritative membership and version using compare-and-swap, then append both envelopes inside the same caller-owned authorized database transaction. Any stale version, duplicate event or writer failure rolls the version and both captures back. Authorization remains fail-closed independently of outbox delivery because 04-b reloads authoritative membership, record state and policy version inside every protected transaction.

The permission regression matrix evaluates all 675 combinations of the five default roles, nine wedding areas, three actions and five record relationships. It independently encodes the approved presets and proves that denials outnumber grants, partners remain structurally equal, planners remain deny-by-default until delegated, coordinator/helper/read-only scopes stay bounded, View never implies Download/Export, and new-record access requires Edit. Separate assertions cover exact-expiry revocation, cross-wedding, cross-organization and independent-planner private-owner boundaries.

This implementation traces ARCH-008, ARCH-037, ARCH-047 and ARCH-148; DEC-001–011; the detailed permission decisions DEC-411–415 and DEC-447–457; and the directly required immediate-reduction behavior in DEC-472–476. It intentionally excludes individual record-share activity events because DEC-463 says those changes do not enter workspace activity history. Existing record state and attribution remain untouched. Tasks 06/07 own real membership mutation, affected-task flagging and authoritative loaders; task 16-a owns outbox dispatch, retries and delivery. No route or UI is introduced before its owning feature task.

## Verification

The implementation agent ran:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:tooling
pnpm test:boundaries
pnpm exec turbo run build --force --concurrency=2
DATABASE_MIGRATION_URL=<disposable-loopback-postgres> \
  DATABASE_MIGRATION_TARGET=test \
  AUTH_ABUSE_REDIS_URL=<disposable-loopback-redis> \
  pnpm test:database
```

Formatting, lint and workspace type checks passed. The unit/component suite passed 183 tests in 27 files; the new focused permission-change and matrix files passed seven tests, including the 675-case matrix. Four tooling checks and all workspace boundary checks passed. All packages and both Next.js applications completed an uncached production build.

Migration metadata, drift and safety checks passed unchanged. Four database integration files passed 12 tests against a disposable PostgreSQL 17 container. The new tests prove atomic version/audit/outbox commit, rollback after a duplicate invalidation event and a deterministic optimistic-concurrency race in which exactly one stale-version competitor commits. Both Better Auth PostgreSQL scenarios and both exact Redis abuse-policy scenarios also passed. The PostgreSQL and Redis containers used only synthetic loopback credentials and were removed afterward. `pnpm test:database` never received a persistent Neon URL.

Browser/accessibility tests are not applicable because this task adds no route, page or UI behavior. Persistent-migration tests are not applicable because there is no schema, SQL migration or database grant change.

## Review, configuration and rollback

Branch `feat/04-c-permission-change-audit`, based on owner-merged main `ab548059a9daedb6b1d611456730b1deff332dd3`. Draft PR and independent review evidence will be linked after creation. Rollback is a reviewed code revert; there is no data rollback. No Neon, Vercel, Cloudflare, Upstash, DNS, environment, staging or production resource was contacted or changed.
