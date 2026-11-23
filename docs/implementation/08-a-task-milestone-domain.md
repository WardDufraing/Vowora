# 08-a — Task and milestone domain

## Scope and decisions

Branch: `feat/08-a-task-milestone-domain`, based on owner-merged `main` `2885b5b`.

This slice implements the wedding-scoped task and milestone records needed before interactions, timeline views and templates: separate task/milestone phase vocabularies; task and milestone creation and optimistic updates; one accountable task owner or unassigned; manual statuses including completion/reopen; task archive/restore; milestone trash/restore; typed permission-filtered collection and mutation APIs; and audit/outbox facts in the same transaction.

Implemented source rules: Product §4.4; DEC-193–194, DEC-265–266, DEC-268, DEC-271, DEC-273–274, DEC-276–279, DEC-522–526, DEC-529, DEC-531, DEC-552, DEC-566–568, DEC-573–582, DEC-588–592 and DEC-596; ARCH-026 optimistic concurrency and ARCH-039 transactional outbox. The projection carries title, due/planned date, status and owner/unassigned data needed by DEC-282 and DEC-628–646. Dashboard selection/presentation, checklists, collaborators, dependencies, reminders, timeline UI and starter templates are intentionally left to 08-b, 08-c and 17-a rather than duplicating their roadmap scope.

## Implementation

- `packages/database/src/schema.ts` and `drizzle/0009_cheerful_surge.sql`: additive UUIDv7 tables, checks, indexes and composite tenant-bound foreign keys. The final schema is one forward migration; the earlier feature-branch-only draft migration was regenerated before merge because no persistent environment or `main` journal had applied it.
- `packages/database/src/planning.ts`: domain-owned repository/application operations, SQL-filtered cursor reads, exact authorization capability consumption, validation, optimistic version checks, assigned-scope enforcement, assignment, immutable archive/trash transitions, custom-phase trash/restore with assignment recovery, distinct activity facts, and transactional audit/outbox events.
- `packages/database/src/weddings.ts`: authoritative record projections for central authorization.
- `packages/contracts/src/index.ts` and app routes/service: strict Zod contracts and versioned OpenAPI GET/POST/PATCH endpoints with safe problem responses, CSRF enforcement, and versioned HMAC-signed cursors bound to actor, wedding, permission-scope version, sort and limit.
- `packages/database/src/planner-private.ts`: planner-exit previews now count active incomplete tasks assigned to exiting staff instead of returning an unknown placeholder.
- `packages/database/src/persistent-migrations.ts`: exact runtime table/column grant manifest for the four new tables.

## Verification

All database commands below used an ephemeral local PostgreSQL 17 container and a database named `vowora_test`. No persistent environment was accessed.

- `vitest run` — 384/384 unit/component tests passed after updating the OpenAPI path expectation and adding invalid-pagination and signed-cursor coverage.
- Focused planning route tests — 6/6 passed.
- Production app/API smoke — 1/1 passed with the two planning OpenAPI paths included in the exact route inventory.
- `vitest run src/planning.integration.test.ts --config vitest.integration.config.ts` — 9/9 passed, including assigned scope, immutable milestone restore, both milestone/phase trash orderings, phase activity and a deterministic two-connection phase-trash/stale-edit race.
- Full database integration config — 46/46 passed after updating the pre-existing handover assertion from unknown to the now-computed zero count.
- Persistent workflow integration config — 9/9 passed, including exact runtime grant/guard reconciliation, raw runtime lifecycle regressions and deliberate guard drift detection.
- `drizzle-kit check`, `scripts/drizzle-drift.mjs`, and `scripts/migration-safety.mjs` — passed.
- Workspace ESLint passed; tooling/policy/boundary checks passed 38/38 (the cloud pnpm shim initially caused four infrastructure-only failures, then the same checks passed through a local command shim).
- Uncached Turbo workspace typecheck passed 8/8 tasks and production build passed 5/5 tasks, including both Next.js applications and the new planning routes.
- Production-build Chromium suites passed 31/31 for the product and 26/26 for marketing using system Chromium.

## Migration and rollback

Migration `0009_cheerful_surge.sql` is additive. It creates four tables and one composite uniqueness index on existing wedding memberships so PostgreSQL can enforce same-wedding task ownership. Lifecycle triggers preserve archived/trashed contents and atomically unassign/restore milestones even for raw runtime SQL; their exact invoker security, fixed search paths, bodies and trigger shapes are part of persistent verification. It neither rewrites nor deletes existing data. 08-c owns exact early-delete confirmation UX (DEC-569, DEC-584–585); 20-a owns automatic/requested deletion, linked-record cleanup, recipient resolution and final-notice facts (DEC-535, DEC-569–571, DEC-583–587); milestone 16 owns delivery. Application rollback is to revert the feature while leaving additive tables unused; destructive schema rollback requires a separate owner-approved migration. A separate migration agent owns all persistent staging/production apply and verify work.

## Review and owner actions

Initial independent reviewer `/root/finalize_08_a/review_08_a_final` blocked head `45603fd` on the red hosted test gate, raw lifecycle invariants, trashed-milestone mutation, raw cursors, incomplete phase activity facts and ambiguous ownership of deferred deletion decisions. The first corrected-head reviewer `/root/continue_finalize_08_a/rereview_08_a_corrected` verified those fixes at `7f996c8`, then reproduced a material nested-trigger conflict between phase trash/restore and already-trashed milestones. The guard now permits only content-preserving bookkeeping from the nested phase trigger while continuing to reject direct runtime mutation; application and raw-runtime regressions cover both trash orderings. Different fresh final reviewer `/root/continue_finalize_08_a/final_rereview_08_a` found no remaining blocking, high or material-medium code findings at `cf75c5d` and independently passed planning 9/9 plus persistent workflow 9/9 on disposable PostgreSQL 17. The remaining hosted failure was reproduced as a stale production-smoke inventory and corrected with the exact two planning paths; the same reviewer confirmed the clean conclusion applies to exact executable head `7b8d23a`. Policy, secret scan, database migrations, the complete marketing/workspace job and both Vercel previews pass on that head. Draft PR: [#84](https://github.com/WardDufraing/Vowora/pull/84). Owner action: inspect and merge the PR. No deploy, provider configuration or persistent migration is part of this task.
