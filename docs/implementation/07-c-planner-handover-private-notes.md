# 07-c Planner handover and private notes

## Delivered boundary

Active organization staff can list and create organization-private notes. A note contains a title and body and may link to a wedding only while the actor has active access to that wedding. The link remains as a private historical reference after access ends. Response DTOs omit organization and creator identifiers and expose only the current actor's `editable` decision. Couples, other organizations and former staff cannot discover note existence or content. A note's creator may edit or archive it; an active owner or manager may edit or archive any note in the organization. Notes have no hard-delete route, and note title/body are excluded from audit and outbox payloads.

An active organization owner or manager who also has current organization access to a wedding can preview and complete voluntary exit. A designated lead without owner/manager authority is denied. Guided preview is generated from authoritative current assignments, lead state, pending invitations and unresolved responsibility count; it is not persisted. Immediate exit skips that checklist but presents the same shared-data retention, private-note separation and access-revocation consequences. Completion locks the access, binds a UUID request to the exact access, actor and mode, atomically revokes access and assignments, preserves shared wedding data and activity history, retains private notes, and emits one idempotent audit/outbox pair without note content. Exact retries replay; changed payloads conflict; stale preview does not authorize completion after access revocation.

Typed `/api/v1` contracts and OpenAPI cover private-note list/create/update/archive and handover preview/completion. Localized EN/NL/FR/DE organization navigation, note states and handover controls explicitly state that notes are never shared with the couple. The synthetic `/planner-private-review` accessibility fixture is no-index and returns 404 when `VOWORA_ENV=production`.

## Owner-approved controlled policy

The owner approved these choices before implementation:

1. Only an active organization owner or manager with current wedding access may initiate organization-wide guided handover or immediate exit. Lead designation alone is insufficient.
2. Guided handover is optional and generated from current state. It confirms assignments, unresolved responsibilities, pending invitations, shared-data retention and private-note separation; no draft is persisted in MVP. Immediate exit skips the checklist and states the consequences.
3. Either exit mode atomically revokes organization access and staff assignments, preserves shared couple data and history, retains organization-private notes, and emits idempotent partner-notification audit/outbox facts.
4. Active organization staff may create and view private notes. The creator may edit/archive their note; an owner or manager may edit/archive any note. There is no hard delete or automatic retention rule in this task.
5. A wedding link is optional and may be created only with active access. It remains as a private historical reference after exit. A separate client link is not included.
6. Private notes are never shared with couples in 07-c.

This approval is recorded here, in the task brief and in the pull request. `docs/product/*` was not edited. The implementation traces Product §4.11, DEC-005–011 and the applicable DEC-038–049 assignment/lead boundaries through centralized ARCH-037 authorization.

## Migration and runtime grants

Additive migration `0007_simple_true_believers.sql` creates `organization_private_notes` and `wedding_organization_handovers` with restrictive foreign keys, lifecycle checks, length limits and request/access uniqueness. The Drizzle journal and snapshot advance normally; application and Vercel builds do not run migrations.

The runtime role receives `SELECT, INSERT` on both new tables. Only `organization_private_notes` receives narrow `UPDATE` on `title`, `body`, `status`, `archived_at` and `updated_at`; runtime receives no `DELETE` and cannot rewrite tenant, creator or wedding identity. Handover rows are append-only to runtime SQL. Clean disposable grant tests verify these boundaries.

No Neon or persistent database was accessed. Never run `pnpm test:database` against persistent databases. After owner merge, the separate migration agent may use the protected persistent-migration workflow with a direct staging migration connection, then verify the Drizzle journal and runtime grants. Production remains a separate, additionally confirmed owner-authorized action.

Rollback before persistent apply is closing or reverting the pull request. After additive apply, stop using the new routes and retain both tables and their history; do not destructively drop private notes or handover/audit history during incident response. A later reviewed forward migration is required for schema removal.

## Verification

- Prettier, workspace ESLint, root TypeScript, policy/quality (22/22), workspace boundaries (16/16), production web and marketing builds, a post-fix production web build and production API smoke (1/1) passed.
- The post-fix unit/component suite passed 78 files and 376 tests. Focused domain, database-service, API, contract and component coverage verifies exact note capabilities, creator/manager edit/archive rules, cross-organization/former-staff/couple privacy, omitted content in event facts, no delete, guided/immediate authority, pending invitation counts, changed-payload conflict, retry after revocation, concurrent/idempotent exit and preservation of shared wedding data/history.
- A fresh disposable PostgreSQL instance passed nine integration files and 35 tests. A separate clean instance passed seven persistent migration/grant tests. Drizzle metadata checking, generated-schema drift and eight-file additive migration safety passed. All PostgreSQL use was local and disposable.
- The dedicated planner-private production-build Chromium case passed 1/1 using `/usr/bin/chromium`; the full web production-build suite passed 31/31. The suite verifies four-language copy, immediate-exit consequences, note privacy language, responsive behavior and axe accessibility. Its first run found an isolated-fixture heading-order violation; the fixture now supplies the correct heading level while the real nested handover UI retains its correct level.

## Review and owner gate

Fresh independent read-only review, hosted pull-request checks and the final reviewed commit are recorded here after publication. Only the repository owner may approve and merge. No agent deploys, runs a persistent migration or changes external configuration.
