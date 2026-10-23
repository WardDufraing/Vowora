# Vowora — Agent Instructions

These instructions apply to Codex Web, CLI, IDE and delegated implementation/review agents working in this repository.

## 1. Start here

1. Read this file, then `docs/PLAN.md`.
2. Select **one unblocked child task** from the plan (for example, `00-a` or `01-a`), not an entire milestone.
3. Read its work order at `docs/steps/<task-id>.md`, the completed dependency handoffs, and only the relevant existing code.
4. Consult the **specific cited sections and decision IDs** in the frozen source documents below. Do not load the full product specification by default. Work orders summarize scope; they never replace approved requirements.
5. Before substantial changes, present scope, affected files/interfaces, dependencies, risks, acceptance criteria and test approach; obtain the required approval. If a task is too large for one agent, split it into smaller tracked work orders **before implementation**.

The first task is **`00-a`: publish the public marketing site at `https://vowora.app`** using the existing Vercel project. The authenticated app is developed later at `https://app.vowora.app`.

## 2. Frozen sources of truth — read only

| Document | Authority |
| --- | --- |
| `docs/product/Wedding-Platform-Product-Specification.md` | Approved product behavior, roles, permissions, lifecycle and MVP scope (v259.10) |
| `docs/product/product-architecture.md` | Approved technical architecture (ARCH-001–150) |
| `docs/product/UI-DESIGN-SYSTEM.md` | Approved visual direction and UI decisions, including explicitly pending validation |

**Never edit, move, rename, regenerate or replace these three files during ordinary implementation.** If a genuine contradiction, missing decision or necessary change arises, document the blocker and obtain explicit owner approval for a separate, controlled baseline change. Do not silently resolve conflicts or treat proposals as approvals.

**Precedence:** Product specification governs product behavior; architecture governs technical design; UI design system governs visual and interaction design. The plan, task briefs and implementation preferences are subordinate. Escalate material conflicts between approved sources rather than inventing a resolution.

This read-only rule is an **agent policy**, not GitHub-enforced access control. Repository protection must be configured separately if needed.

## 3. Domains, apps and deployment

| Purpose | Domain | Workspace | Vercel |
| --- | --- | --- | --- |
| Public marketing website | `https://vowora.app` | `apps/marketing` | **Existing** project; deploy first |
| Authenticated SaaS app and `/api/v1` REST API | `https://app.vowora.app` | `apps/web` | **Separate** project, configured during app foundation work |

- Use one GitHub repository with the approved Turborepo/pnpm setup and shared packages where appropriate. Keep each Vercel project's root directory, environment variables and deployment pipeline separate.
- Keep the public marketing homepage at `/` throughout application development. Do not move the product onto `vowora.app/app` or replace the marketing homepage without owner approval.
- For task `00-a`, reuse and verify the existing Vercel project, purchased domain, DNS and HTTPS. **Do not create the app Vercel project yet.** When its setup is due, verify configuration and obtain approval before creating it or changing DNS.
- Prefer **host-only authentication cookies** for `app.vowora.app`, not shared cookies scoped to `.vowora.app`.
- The approved architecture's single web/API deployment applies to the **authenticated app and its API together**; the marketing site is deployed independently.
- Do not present unfinished app features as live, invent pricing or testimonials, or create unapproved signup/waitlist/email capture flows.

## 4. Engineering and security requirements

- Follow the approved modular-monolith architecture: Next.js App Router, versioned REST API, Neon PostgreSQL, Drizzle ORM, typed contracts, centralized authorization, and the documented background jobs, email and private-file patterns where relevant.
- **Deny by default on the server.** Enforce wedding/organization tenant boundaries, roles and permissions, record-level shared/private visibility and revocation in APIs and services. Never rely on client-side hiding as security.
- Do **not** introduce PostgreSQL RLS or change approved core technologies without explicit architecture approval.
- Preserve data integrity, financial precision, wedding-local time semantics, transaction boundaries, idempotency, auditability, retention and privacy wherever applicable.
- Implement accessible responsive interfaces consistent with the approved design system, localization, validation, and meaningful loading/empty/error states.
- Add focused unit/integration/E2E tests as applicable, including **negative cross-tenant and permission tests** for protected features. Run available lint, type, test and build checks; report actual results, not assumed success.
- Request independent review and resolve blocking findings before marking a task Done.

## 5. Approvals, ownership and handoff

- **Do not commit, push, merge, deploy, change DNS/Vercel configuration, delete data or run destructive migrations without explicit owner approval for the action.** Preparing a proposal or local code is not approval to release it.
- One implementation agent owns one bounded task at a time. Parallel work is permitted only after dependencies are satisfied and overlapping file ownership/integration is coordinated.
- Use `.agents/skills/implement-feature/SKILL.md` and `.agents/skills/review-feature/SKILL.md` when applicable.
- Track status in `docs/PLAN.md` and evidence in the assigned `docs/steps/<task-id>.md`. Record actual files, PR/commit links, checks run, review result, limitations and next dependency.
- Statuses are **Not started → In progress → In review → Done**; use **Blocked** when a dependency, conflict or approval prevents progress. Mark a milestone Done only when all its child tasks and integration checks are complete.
- Never claim deployment, test success, independent review or completion without evidence. Keep unrelated changes out of the task and never update frozen baselines as a routine handoff.
