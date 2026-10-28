# Vowora — Codex Development Plan

**Status:** Implementation roadmap; 66 independently assignable tasks grouped into 22 milestones. Original roadmap tasks were initially Not started.
**Frozen sources:** `docs/product/Wedding-Platform-Product-Specification.md` (v259.10), `docs/product/product-architecture.md` (ARCH-001–150), `docs/product/UI-DESIGN-SYSTEM.md`.  
**Rules:** `AGENTS.md`. **Milestone overview:** `docs/steps/NN.md`. **Agent work order:** `docs/steps/NN-a.md` etc.

## Operating rules
1. Assign **one child task** (e.g. `02-b`), not an entire milestone, to one Codex agent. Dependencies must be complete; independent tasks may run concurrently only with disjoint file ownership and an integration owner.
2. Agent reads `AGENTS.md`, this roadmap, its own task brief, dependent handoffs and relevant existing code. Consult **only referenced passages** of frozen baselines for exact rules, not all ~1 MB by default. Task briefs are scoped instructions, not copies or replacements for canonical decisions.
3. Before substantial implementation, propose affected files, API/schema/UI scope, acceptance criteria, tests and risks; obtain approval as required by `AGENTS.md`.
4. Implement and verify the slice with server authorization, tenant isolation, validation, accessible responsive states, tests and review. Record exact checks run; never invent results.
5. Update this plan and the selected child brief's handoff log after acceptance and review. Never edit frozen `docs/product/*` in routine implementation.
6. Mark a parent milestone Done only when every child task and relevant integration test is Done. On a discovered oversized task, split it further before coding and update dependencies/links.
7. Escalate actual contradictions or missing approved product rules; don't turn the development process into a new broad questionnaire.

**Statuses:** Not started · In progress · In review · Blocked · Done.  
**Important:** "Read-only" is an agent instruction, not GitHub ACL enforcement. Protect frozen paths with repository rules if needed.

## Launch-first routing policy

**Task 00-a is the first implementation task and first production release.** Reuse the existing Vercel project and confirmed production domain **vowora.app** to publish a lightweight marketing website at `/` immediately, before building authentication or the app. Keep `/` as the marketing homepage throughout development. **Approved application domain: `app.vowora.app`.** The marketing website stays at `https://vowora.app` on the owner's **existing Vercel project**; the authenticated app will use a **separate Vercel project** connected to the same GitHub monorepo when application development starts. Use `apps/marketing` and `apps/web` (app) as the intended Turborepo application boundaries, with shared packages where justified. Configure the two Vercel projects with distinct root directories, environment variables, deployments and production domains. Do not create the app Vercel project or change DNS during 00-a; do so at the appropriate app setup step with owner approval and verified settings. Prefer host-only authentication cookies scoped to `app.vowora.app`, not a shared `.vowora.app` cookie. Marketing login/launch CTAs may link to the app **only when their destinations actually work**. The frozen architecture's single web/API deployment refers to the **authenticated app and its API together**, not a requirement to co-host the marketing site. Do not invent signup, pricing or waitlist behavior. Once 00-a is live, app development continues under milestone 01 without disrupting the marketing site.

## Milestones and task index

| Task | Single-agent deliverable | Prerequisite | Status | Brief |
| --- | --- | --- | --- | --- |
| 00-a | Public marketing website at vowora.app on existing Vercel | None | In review | [Brief](steps/00-a.md) |
| 00-b | Marketing footer preferences and four-language localization | 00-a (merged PR #5) | In review | [Brief](steps/00-b.md) |
| 01-a | Monorepo and package boundaries | 00-a (merged and live) | Done | [Brief](steps/01-a.md) |
| 01-b | Code quality and test harness | 01-a (merged PR #7) | Done | [Brief](steps/01-b.md) |
| 01-c | CI, environment validation and API skeleton | 01-b (merged PR #8) | Done | [Brief](steps/01-c.md) |
| 02-a | Neon, Drizzle and migration harness | 01-c (merged corrective PR #17) | Done | [Brief](steps/02-a.md) |
| 02-b | Tenant-scoped repository and transaction primitives | 02-a | Done | [Brief](steps/02-b.md) |
| 02-c | Audit events and transactional outbox | 02-b | In review | [Brief](steps/02-c.md) |
| 03-a | Authentication integration | 02-c | In review | [Brief](steps/03-a.md) |
| 03-b | Session management and account recovery | 03-a | In review | [Brief](steps/03-b.md) |
| 03-c | Authentication abuse protections and tests | 03-b | In review | [Brief](steps/03-c.md) |
| 04-a | Permission vocabulary and role model | 03-c | In review | [Brief](steps/04-a.md) |
| 04-b | Server authorization enforcement | 04-a | Not started | [Brief](steps/04-b.md) |
| 04-c | Permission changes, audit and regression suite | 04-b | Not started | [Brief](steps/04-c.md) |
| 05-a | Semantic tokens and themes | 04-c | Not started | [Brief](steps/05-a.md) |
| 05-b | Responsive app shell and navigation | 05-a | Not started | [Brief](steps/05-b.md) |
| 05-c | Shared forms, tables and localization | 05-b | Not started | [Brief](steps/05-c.md) |
| 06-a | Wedding creation and workspace settings | 05-c | Not started | [Brief](steps/06-a.md) |
| 06-b | Partner invitations and claim lifecycle | 06-a | Not started | [Brief](steps/06-b.md) |
| 06-c | Workspace switching and deep links | 06-b | Not started | [Brief](steps/06-c.md) |
| 07-a | Organization and staff memberships | 06-c | Not started | [Brief](steps/07-a.md) |
| 07-b | Wedding planner assignment and fallback | 07-a | Not started | [Brief](steps/07-b.md) |
| 07-c | Planner handover and private notes | 07-b | Not started | [Brief](steps/07-c.md) |
| 08-a | Task and milestone domain | 07-c | Not started | [Brief](steps/08-a.md) |
| 08-b | Task interactions and dependencies | 08-a | Not started | [Brief](steps/08-b.md) |
| 08-c | Timeline views and reusable templates | 08-b | Not started | [Brief](steps/08-c.md) |
| 09-a | Contact records and visibility | 08-c | Not started | [Brief](steps/09-a.md) |
| 09-b | Emergency and linked contacts | 09-a | Not started | [Brief](steps/09-b.md) |
| 09-c | Contact screens and permission tests | 09-b | Not started | [Brief](steps/09-c.md) |
| 10-a | Guest groups and confirmation | 09-c | Not started | [Brief](steps/10-a.md) |
| 10-b | Event-part attendance and labels | 10-a | Not started | [Brief](steps/10-b.md) |
| 10-c | Guest list UX and filters | 10-b | Not started | [Brief](steps/10-c.md) |
| 11-a | Decision records and lifecycle | 10-c | Not started | [Brief](steps/11-a.md) |
| 11-b | Decision board and dashboard selectors | 11-a | Not started | [Brief](steps/11-b.md) |
| 11-c | MVP inspiration board | 11-b | Not started | [Brief](steps/11-c.md) |
| 12-a | Wedding vendor profiles and service categories | 11-c | Not started | [Brief](steps/12-a.md) |
| 12-b | Service booking states and comparison | 12-a | Not started | [Brief](steps/12-b.md) |
| 12-c | Vendor archive and relationship lifecycle | 12-b | Not started | [Brief](steps/12-c.md) |
| 13-a | Budget structure and calculations | 12-c | Not started | [Brief](steps/13-a.md) |
| 13-b | Quotes, invoices and installments | 13-a | Not started | [Brief](steps/13-b.md) |
| 13-c | Payments, refunds and credits | 13-b | Not started | [Brief](steps/13-c.md) |
| 13-d | Vendor-service cost allocation and financial UI | 13-c | Not started | [Brief](steps/13-d.md) |
| 14-a | Private file upload and metadata | 13-d | Not started | [Brief](steps/14-a.md) |
| 14-b | Malware scanning and secure access | 14-a | Not started | [Brief](steps/14-b.md) |
| 14-c | Documents, notes and linked records | 14-b | Not started | [Brief](steps/14-c.md) |
| 15-a | Schedule events and wedding-local time | 14-c | Not started | [Brief](steps/15-a.md) |
| 15-b | Run sheet and PDF output | 15-a | Not started | [Brief](steps/15-b.md) |
| 15-c | Offline PWA snapshot and revocation | 15-b | Not started | [Brief](steps/15-c.md) |
| 16-a | Outbox dispatcher and Trigger.dev execution | 15-c | Not started | [Brief](steps/16-a.md) |
| 16-b | In-app notification inbox and policy | 16-a | Not started | [Brief](steps/16-b.md) |
| 16-c | Resend email and delivery tracking | 16-b | Not started | [Brief](steps/16-c.md) |
| 17-a | Dashboard summaries and empty states | 16-c | Not started | [Brief](steps/17-a.md) |
| 17-b | Personal dashboard ordering and quick actions | 17-a | Not started | [Brief](steps/17-b.md) |
| 17-c | Global workspace search | 17-b | Not started | [Brief](steps/17-c.md) |
| 18-a | Multi-wedding planner dashboard | 17-c | Not started | [Brief](steps/18-a.md) |
| 18-b | Organization vendor directory | 18-a | Not started | [Brief](steps/18-b.md) |
| 18-c | Planner templates and team workflows | 18-b | Not started | [Brief](steps/18-c.md) |
| 19-a | Report models and on-demand PDF/XLSX | 18-c | Not started | [Brief](steps/19-a.md) |
| 19-b | Scheduled reports and delivery state | 19-a | Not started | [Brief](steps/19-b.md) |
| 19-c | Snapshots, revocation and retention | 19-b | Not started | [Brief](steps/19-c.md) |
| 20-a | Retention and deletion orchestration | 19-c | Not started | [Brief](steps/20-a.md) |
| 20-b | GDPR data subject workflows | 20-a | Not started | [Brief](steps/20-b.md) |
| 20-c | Observability, rate limits and security hardening | 20-b | Not started | [Brief](steps/20-c.md) |
| 21-a | Critical journey and accessibility verification | 20-c | Not started | [Brief](steps/21-a.md) |
| 21-b | Production migration, backup and recovery rehearsal | 21-a | Not started | [Brief](steps/21-b.md) |
| 21-c | Release gates, smoke tests and launch approval | 21-b | Not started | [Brief](steps/21-c.md) |

## Integration and release gates
At every task boundary verify authorization, cross-tenant isolation, applicable record privacy, correct money/date semantics, accessibility, localization and test coverage. Complex integrations (reports, financial allocation, scheduled notifications, offline access and lifecycle deletion) require cross-module regression tests. Launch additionally requires ARCH-146–150 gates and approved recovery objectives.

## Progress log
Record dated PR/commit links, tests actually run, reviewer outcome, blockers and handoff for each completed task. Do not mark work complete based solely on code presence.

- 2026-10-28 — Fresh implementer `/root/implement_04_a` started 04-a from owner-merged 03-c main `214dc1d` with no competing open PR. The framework-independent permission model covers exact wedding/organization membership scope, equal partners, delegated planner access, coordinator/helper/read-only presets, per-area grants, record relationships, separate Download/Export and planner-private data. Initial review found one high runtime-visibility bypass and three medium lifecycle/private-owner/contact-scope gaps; all are corrected with 14 focused regressions and await fresh re-review. Corrected format, lint, types, 151 unit/component tests, four tooling tests, 12 boundary tests and both builds pass. [Draft PR #32](https://github.com/WardDufraing/Vowora/pull/32); [implementation evidence](implementation/04-a-permission-model.md). Fresh re-review and hosted checks remain pending; no schema, migration, external configuration or deployment changed.

- 2026-10-28 — Task 03-c [PR #31](https://github.com/WardDufraing/Vowora/pull/31) implements exact-origin CSRF defenses and managed distributed authentication abuse protection from merged 03-b main `69af5c4`. The inherited draft PostgreSQL counter was removed because frozen ARCH-046/102 require a managed Redis-compatible limiter; no schema, migration or grant change remains. Initial review found a high targeted-email lockout because unsolved identity challenges advanced into a block. Corrected head `dfe57c8` caps identity dimensions at a solvable challenge, reserves progressive blocks for the trusted Vercel network dimension, and adds exact-Lua sequential/concurrent Redis regressions. New fresh reviewer `/root/continue_03_c/rereview_03_c` passed the complete corrected diff with no findings; all hosted workspace/database/security checks and both automatic Vercel previews passed. Evidence and owner setup are in [the 03-c handoff](implementation/03-c-auth-abuse.md). No provider setting, persistent database, production deployment or migration was changed; 04-a awaits owner merge.

- 2026-10-27 — Owner verified merged 03-a authentication end to end on the isolated staging environment and kept production disabled. Fresh implementer `/root/implement_03_b` started session management and password recovery from integrated main `f47058d`; continuation `/root/continue_03_b` preserved the same branch after usage exhaustion. Review found an old-password sign-in/reset race and four API/UI contract gaps; all are fixed with deterministic PostgreSQL and focused regressions. Final fresh reviewer `/root/continue_03_b/final_review_03_b` found no remaining issues on `ae622a6`. [PR #30](https://github.com/WardDufraing/Vowora/pull/30) awaits owner merge; evidence is in [the 03-b handoff](implementation/03-b-session-recovery.md). No persistent migration or external configuration was performed.

- 2026-10-26 — Owner requested a controlled persistent Neon migration workflow after merging 03-a. Fresh implementer `/root/implement_persistent_migrations` started the operational follow-up from merged main `5e0d2f3`; scope and evidence are recorded in [the persistent migration handoff](implementation/03-a-persistent-migrations.md). Review found target binding, workflow secret/ref, runtime authentication, session-marker override, connection-parameter, complete privilege-verification, procedure/`MAINTAIN`, and global default-ACL gaps. All are fixed with disposable PostgreSQL regressions. Final fresh reviewer `/root/finalize_persistent_migrations/global_defaults_final_review` found no remaining issues on `4c45379`; owner merge of PR #26 remains required before any execution. No Neon, Vercel, staging or production migration was performed.

- 2026-10-23 — 00-a implementation on `feat/00-a-marketing-site`; [handoff and executed checks](implementation/00-a-marketing.md). Fresh foundation and final independent code reviews passed; [draft PR #5](https://github.com/WardDufraing/Vowora/pull/5) is open. GitHub hosted checks cannot start because of owner billing/spending limits; the automatic existing Vercel preview failed with cause unverified. Owner merge, existing Vercel/domain verification and owner-controlled launch remain pending; 00-a is not Done and 01-a remains blocked.

- 2026-10-23 — 00-b owner-requested marketing footer/theme and EN/NL/FR/DE localization on `feat/00-b-marketing-localization`, based on merged PR #5. Local lint/types/build, 26 Chromium tests and six configured metadata checks passed; [handoff](implementation/00-b-marketing-localization.md). Fresh independent reviewer `/root/implement_00_b/review_00_b` passed full diff with no findings and independently reran lint/types/fresh build and 26 tests. [PR #6](https://github.com/WardDufraing/Vowora/pull/6) awaits owner review/merge; hosted outcomes tracked there. No agent merge/deployment command.

- 2026-10-23 — 01-a started by fresh implementer `/root/implement_01_a` from integrated main `64f5d93`. PRs #5/#6 are owner-merged; coordinator verified HTTPS responses for marketing `/`, `/nl`, `/fr`, `/de` all 200 with corresponding language/title. Earlier pending/blocked notes above are historical, superseded for 01-a eligibility. No open competing PR was found. [Workspace scope/handoff](implementation/01-a-workspace.md).

- 2026-10-23 — 01-a [PR #7](https://github.com/WardDufraing/Vowora/pull/7), reviewed code `e695111`: both app builds, shared config/boundaries, six boundary tests, one app HTTP smoke and26 marketing browser regressions pass. Initial review's two medium findings fixed; a new fresh reviewer passed the full diff and independently reran frozen install/uncached checks/all tests. Owner merge pending;01-b/c not started. Hosted results tracked in PR. Both existing Vercel projects currently target marketing; app root/domain setup is owner-controlled.

- 2026-10-23 — 01-b fresh implementer `/root/implement_01_b`, based on verified owner merge of [PR #7](https://github.com/WardDufraing/Vowora/pull/7) at `39b27b0`; no competing open PR. 01-a code/tests/re-review and hosted checks passed before owner merge; external app Vercel root/domain setup remains owner-controlled. [01-b harness scope and commands](implementation/01-b-test-harness.md); review/check evidence follows on task branch/PR. 01-c not started.

- 2026-10-23 — 01-b [PR #8](https://github.com/WardDufraing/Vowora/pull/8), reviewed code `73e050f`: pinned source formatting, tooling/workspace ESLint, Vitest/React Testing Library and both-app Playwright pass. All59 tests and both builds pass. Initial engine minimum and future package-test typecheck findings fixed; fresh independent reviewer `/root/implement_01_b/review_01_b_fresh` passed the full diff and independently reran frozen install/uncached builds/checks/all tests. Owner merge pending; 01-c not started. Hosted outcomes tracked in PR.

- 2026-10-24 — Owner merged 01-b [PR #8](https://github.com/WardDufraing/Vowora/pull/8) as `42a0b10`; all final hosted checks passed. Fresh implementer `/root/implement_01_c` started 01-c from that integrated main with no competing open PR. Scope and executed evidence are recorded in [the 01-c handoff](implementation/01-c-ci-env-api.md); 02-a remains blocked until owner merge.

- 2026-10-24 — Owner merged 01-c [PR #9](https://github.com/WardDufraing/Vowora/pull/9) as `6ea2875`; hosted workspace, policy, secret-scan, and both Vercel preview checks passed. A required post-merge independent review found incomplete OpenAPI error-response linkage. Fresh corrective implementer `/root/fix_01_c_postmerge` is addressing that contract gap and a duplicate workflow concurrency key on `fix/01-c-postmerge-review`; 02-a remains blocked until the corrective PR is independently reviewed and owner-merged.

- 2026-10-25 — Owner merged 02-a [PR #20](https://github.com/WardDufraing/Vowora/pull/20) as `3be683e` after database integration, hosted checks and iterative review. A required final merged review found percent-encoded database identities could bypass runtime/migration separation and several destructive rename forms escaped the migration gate. Fresh corrective implementer `/root/fix_02_a_postmerge` is addressing both with regression coverage; 02-b remains blocked until that corrective PR is independently reviewed and owner-merged.

- 2026-10-24 — Owner merged corrective 01-c [PR #17](https://github.com/WardDufraing/Vowora/pull/17) as `44532f2` after fresh independent re-review and all hosted checks passed. Fresh implementer `/root/implement_02_a` started 02-a from current integrated main (including subsequently merged dependency PR #16); scoped database design and evidence are in [the 02-a handoff](implementation/02-a-database.md). No external Neon, Vercel, DNS or deployment changes were made; 02-b remains blocked until 02-a owner merge.

- 2026-10-25 — Owner merged the final 02-a corrective [PR #22](https://github.com/WardDufraing/Vowora/pull/22) as `9e48d69` after independent review and all hosted checks passed. Fresh implementer `/root/implement_02_b` started tenant-scoped repository and transaction primitives from that integrated main with no competing open PR. Scope and evidence are recorded in [the 02-b handoff](implementation/02-b-tenant-repositories.md); 02-c remains blocked until owner merge.

- 2026-10-26 — Owner merged 02-b [PR #23](https://github.com/WardDufraing/Vowora/pull/23) as `530aba8`. Fresh implementer `/root/implement_02_c` started typed audit events and transactional outbox capture from that integrated main with no competing open PR. Scope, validation and review evidence are recorded in [the 02-c handoff](implementation/02-c-audit-outbox.md); 03-a remains blocked until owner merge.

- 2026-10-26 — Owner merged 02-c [PR #24](https://github.com/WardDufraing/Vowora/pull/24) as `02e9a3c`. Fresh implementer `/root/implement_03_a` started authentication integration from that integrated main; continuation implementers preserved the same task branch after session usage limits. Scope and executed evidence are recorded in [the 03-a handoff](implementation/03-a-authentication.md). Final fresh reviewer `/root/finalize_03_a/verify_03_a_final` found no remaining issues on `f03ddeb` and independently passed focused auth/contract, clean-checkout type, migration, and all ten real-PostgreSQL integration checks. [PR #25](https://github.com/WardDufraing/Vowora/pull/25) awaits owner merge; 03-b remains blocked until that merge.
