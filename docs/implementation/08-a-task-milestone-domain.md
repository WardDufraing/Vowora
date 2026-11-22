# 08-a — Task and milestone domain

## Scope and decisions

Branch: `feat/08-a-task-milestone-domain`, based on owner-merged `main` `2885b5b`.

This slice implements the wedding-scoped task and milestone records needed before interactions, timeline views and templates: separate task/milestone phase vocabularies; task and milestone creation and optimistic updates; one accountable task owner or unassigned; manual statuses including completion/reopen; task archive/restore; milestone trash/restore; typed permission-filtered collection and mutation APIs; and audit/outbox facts in the same transaction.

Implemented source rules: Product §4.4; DEC-193–194, DEC-265–266, DEC-268, DEC-271, DEC-273, DEC-276, DEC-278–279, DEC-522–526, DEC-529, DEC-531, DEC-552, DEC-573–576, DEC-590–592 and DEC-596; ARCH-026 optimistic concurrency and ARCH-039 transactional outbox. The projection carries title, due/planned date, status and owner/unassigned data needed by DEC-282 and DEC-628–646. Dashboard selection/presentation, checklists, collaborators, dependencies, reminders, timeline UI and starter templates are intentionally left to 08-b, 08-c and 17-a rather than duplicating their roadmap scope.

## Implementation

- `packages/database/src/schema.ts` and `drizzle/0009_quiet_cyclops.sql`: additive UUIDv7 tables, checks, indexes and composite tenant-bound foreign keys. The final schema is one forward migration; an intermediate uncommitted second migration was consolidated before publication.
- `packages/database/src/planning.ts`: domain-owned repository/application operations, record-filtered reads, exact authorization capability consumption, validation, optimistic version checks, assignment and transactional audit/outbox events.
- `packages/database/src/weddings.ts`: authoritative record projections for central authorization.
- `packages/contracts/src/index.ts` and app routes/service: strict Zod contracts and versioned OpenAPI GET/POST/PATCH endpoints with safe problem responses and CSRF enforcement.
- `packages/database/src/planner-private.ts`: planner-exit previews now count active incomplete tasks assigned to exiting staff instead of returning an unknown placeholder.
- `packages/database/src/persistent-migrations.ts`: exact runtime table/column grant manifest for the four new tables.

## Verification

All database commands below used an ephemeral local PostgreSQL 17 container and a database named `vowora_test`. No persistent environment was accessed.

- `vitest run` — 381/381 unit/component tests passed after updating the OpenAPI path expectation.
- Focused planning route tests — 5/5 passed.
- `vitest run src/planning.integration.test.ts --config vitest.integration.config.ts` — 4/4 passed.
- Full database integration config — 41/41 passed after updating the pre-existing handover assertion from unknown to the now-computed zero count.
- Persistent workflow integration config — 8/8 passed, including exact runtime grant reconciliation.
- `drizzle-kit check`, `scripts/drizzle-drift.mjs`, and `scripts/migration-safety.mjs` — passed.
- Workspace ESLint passed; tooling/policy/boundary checks passed 38/38 (the cloud pnpm shim initially caused four infrastructure-only failures, then the same checks passed through a local command shim).
- Uncached Turbo workspace typecheck passed 8/8 tasks and production build passed 5/5 tasks, including both Next.js applications and the new planning routes.

## Migration and rollback

Migration `0009_quiet_cyclops.sql` is additive. It creates four tables and one composite uniqueness index on existing wedding memberships so PostgreSQL can enforce same-wedding task ownership. It neither rewrites nor deletes existing data. Application rollback is to revert the feature while leaving additive tables unused; destructive schema rollback requires a separate owner-approved migration. A separate migration agent owns all persistent staging/production apply and verify work.

## Review and owner actions

Fresh independent review: pending. PR: pending. Owner action after checks/review: inspect and merge the PR. No deploy, provider configuration or persistent migration is part of this task.
