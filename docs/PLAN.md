# Vowora — Codex Development Plan

**Status:** Implementation roadmap; 65 independently assignable tasks grouped into 22 milestones. All tasks are initially Not started.  
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
| 00-a | Public marketing website at vowora.app on existing Vercel | None | Not started | [Brief](steps/00-a.md) |
| 01-a | Monorepo and package boundaries | 00-a | Not started | [Brief](steps/01-a.md) |
| 01-b | Code quality and test harness | 01-a | Not started | [Brief](steps/01-b.md) |
| 01-c | CI, environment validation and API skeleton | 01-b | Not started | [Brief](steps/01-c.md) |
| 02-a | Neon, Drizzle and migration harness | 01-c | Not started | [Brief](steps/02-a.md) |
| 02-b | Tenant-scoped repository and transaction primitives | 02-a | Not started | [Brief](steps/02-b.md) |
| 02-c | Audit events and transactional outbox | 02-b | Not started | [Brief](steps/02-c.md) |
| 03-a | Authentication integration | 02-c | Not started | [Brief](steps/03-a.md) |
| 03-b | Session management and account recovery | 03-a | Not started | [Brief](steps/03-b.md) |
| 03-c | Authentication abuse protections and tests | 03-b | Not started | [Brief](steps/03-c.md) |
| 04-a | Permission vocabulary and role model | 03-c | Not started | [Brief](steps/04-a.md) |
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
