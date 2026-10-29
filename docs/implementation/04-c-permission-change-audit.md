# 04-c permission changes, audit and regression suite

Task 04-c completes the authorization foundation without creating membership tables owned by tasks 06 and 07. `@vowora/domain` now issues a dedicated, single-use wedding access-management capability after loading the exact actor membership, target membership and policy version through trusted persistence. Active partners may manage non-partner access. An assigned lead planner may manage coordinator/helper/read-only access only when the couple's authoritative restrictions allow it. Helpers, coordinators, guests, unrelated planners and cross-wedding actors are denied. Every change to a partner membership is denied, preserving equal partner control. The capability is revalidated inside the mutation transaction before use.

`@vowora/database` provides one permission-change transaction coordinator. It consumes the capability, gives the membership repository access to the transaction only after the repository asserts the exact wedding, target membership, change, next membership and expected version, and requires compare-and-swap persistence. Audit facts cannot be supplied independently: the coordinator accepts only the authoritative mutation result, verifies it against the capability, then derives and writes both envelopes before commit. Missing assertions, stale state, result mismatches, duplicate events or writer failures roll back the mutation and both captures. An ordinary Tasks Edit capability cannot enter this boundary.

The audit event `authorization.permission_scope_changed` records the membership subject, computed change category, computed effective-access direction and authoritative version transition. The outbox event `authorization.permission_scope_invalidated` carries only the exact wedding scope, membership identifier and new version required for downstream cache/session refresh and member notification work. Effective access is derived by comparing the before/after policy across every area/action/relationship combination. Revocation is always a reduction. Under DEC-436, only coordinator/helper restoration is supported, it atomically requires a new future expiry, and it is rejected unless the actual matrix expands access. A future active expiry change remains `unchanged`, preserving DEC-446's no-notification behavior while still invalidating the policy version. Neither envelope accepts names, email addresses, access details, secrets or arbitrary metadata. Authorization remains fail-closed independently of outbox delivery because 04-b reloads authoritative membership, record state and policy version inside every protected transaction.

The permission regression matrix evaluates all 675 combinations of the five default roles, nine wedding areas, three actions and five record relationships. It independently encodes the approved presets and proves that denials outnumber grants, partners remain structurally equal, planners remain deny-by-default until delegated, coordinator/helper/read-only scopes stay bounded, View never implies Download/Export, and new-record access requires Edit. Separate assertions cover exact-expiry revocation, cross-wedding, cross-organization and independent-planner private-owner boundaries.

This implementation traces ARCH-008, ARCH-037, ARCH-047 and ARCH-148; DEC-001–011; the detailed permission decisions DEC-411–415, DEC-436 and DEC-447–457; and the directly required immediate-reduction behavior in DEC-472–476. It intentionally excludes individual record-share activity events because DEC-463 says those changes do not enter workspace activity history. Existing record state and attribution remain untouched. Task 06 owns the concrete wedding membership table/repository; task 07 owns organization membership and its approved manager/staff authority model. Those tasks must implement the provided compare-and-swap contract rather than exposing direct membership writes. Task 16-a owns outbox dispatch, retries and delivery. No route or UI is introduced before its owning feature task.

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

Formatting, lint and workspace type checks passed. The corrected unit/component suite passed 189 tests in 27 files; the focused permission-change and matrix files passed 13 tests, including the 675-case matrix, partner/lead-planner authority denials and DEC-436 restoration edges. Four tooling checks and all 13 workspace boundary tests passed. All packages and both Next.js applications completed an uncached production build.

Migration metadata, drift and safety checks passed unchanged. Four database integration files passed 15 tests against a disposable PostgreSQL 17 container. The new tests prove atomic version/audit/outbox commit, rollback after a duplicate invalidation event, mandatory repository capability assertion, rejection of an ordinary Tasks Edit capability, DEC-436 restoration with persisted expansion facts, and a deterministic optimistic-concurrency race in which exactly one stale-version competitor commits. Both Better Auth PostgreSQL scenarios and both exact Redis abuse-policy scenarios also passed. The PostgreSQL and Redis containers used only synthetic loopback credentials and were removed afterward. `pnpm test:database` never received a persistent Neon URL.

Browser/accessibility tests are not applicable because this task adds no route, page or UI behavior. Persistent-migration tests are not applicable because there is no schema, SQL migration or database grant change.

## Review, configuration and rollback

Branch `feat/04-c-permission-change-audit`, based on owner-merged main `ab548059a9daedb6b1d611456730b1deff332dd3`. [PR #34](https://github.com/WardDufraing/Vowora/pull/34) remains draft. Initial fresh reviewer `/root/implement_04_c/review_04_c` found two high gaps—no dedicated access-management capability and optional caller-supplied audit facts—and one medium contradictory access-direction gap at `5612726`. The correction at `7d26c82` added the exact capability and mandatory authoritative transaction coordinator and computed direction from before/after state. Fresh re-reviewer `/root/implement_04_c/rereview_04_c` confirmed both high findings resolved and found one remaining medium expired-restoration inconsistency; DEC-436 restoration now requires a future expiry and actual expansion, with unit and persisted audit/outbox regressions. Another fresh re-review is required. Rollback is a reviewed code revert; there is no data rollback. No Neon, Vercel, Cloudflare, Upstash, DNS, environment, staging or production resource was contacted or changed.
