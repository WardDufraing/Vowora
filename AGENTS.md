# Vowora — Agent Engineering Contract

Applies to every Codex orchestrator, implementer, reviewer, tester and delegated agent. The goal is production-quality, independently verified work with a clear human-controlled merge and release process.

## 1. Start with the assigned task

1. Read this file and `docs/PLAN.md` at the start of **every** agent session.
2. Check task statuses, dependencies, open branches/PRs, blockers and ownership. Choose **one unblocked child task** (`00-a`, `01-a`, etc.), never a whole milestone. Prerequisite PRs must already be merged into the task's base.
3. Read `docs/steps/<task-id>.md`, dependency handoffs, affected code and **only the relevant cited passages** of the frozen sources. Do not load the ~1 MB product specification by default.
4. Plan the smallest complete slice: scope/non-goals, affected files and contracts, acceptance criteria, tests, risks, and any migration/rollback needs. Split oversized tasks in the roadmap before implementation.
5. Use a **fresh implementation session for every child task**. Never reuse an implementer for the next task. A coordinator is optional; the owner may launch a task-specific implementer directly. Do not keep a supervising agent active solely to monitor implementation. If independent review cannot be launched, leave the PR in draft and provide a manual reviewer handoff.

**First task: `00-a` — launch the marketing site at `https://vowora.app` using the existing Vercel project.** App development follows at `https://app.vowora.app`.

## 2. Frozen sources and precedence

| Read-only document | Authority |
| --- | --- |
| `docs/product/Wedding-Platform-Product-Specification.md` | Product behavior, roles, permissions, lifecycle and MVP scope (v259.10) |
| `docs/product/product-architecture.md` | Architecture and technology choices (ARCH-001–150) |
| `docs/product/UI-DESIGN-SYSTEM.md` | Approved visual and interaction decisions, including pending validation |

**Never edit, move, rename, regenerate or replace these documents during ordinary implementation.** If approved sources conflict, omit a necessary decision or require a change, stop **only the affected work**, cite the exact passages, record options and request explicit owner approval for a separate controlled baseline change. Never invent product rules.

Product specification governs product behavior; architecture governs technical decisions; UI design system governs visual/interaction decisions. `docs/PLAN.md`, task briefs and implementation preferences are subordinate. `docs/PLANS.md` is legacy and not a tracker.

The read-only policy is an agent instruction, **not** a GitHub file permission. Do not assume branch protection or required reviews are technically enforced.

## 3. Domain and deployment boundaries

| Site | Domain | Workspace | Deployment |
| --- | --- | --- | --- |
| Public marketing | `https://vowora.app` | `apps/marketing` | Existing Vercel project; launch first |
| Authenticated product + `/api/v1` API | `https://app.vowora.app` | `apps/web` | Separate Vercel project, configured later |

- Use the same GitHub repository and approved Turborepo/pnpm workspace, with shared packages as appropriate. Keep each Vercel project's root directory, environment variables and deployment pipeline independent.
- Preserve the public marketing homepage at `/` during app development. Do not move the product to `vowora.app/app` or displace the homepage without owner approval.
- In `00-a`, inspect and reuse the existing Vercel project; verify the purchased domain, DNS and HTTPS. **Do not create the app project yet.** Request approval before creating it later, modifying DNS or deploying.
- Prefer **host-only** auth cookies on `app.vowora.app`, not shared `.vowora.app` cookies.
- The approved single Vercel web/API deployment applies to the **app and its API together**, not to marketing. Marketing copy must not falsely claim planned features are live or invent pricing, testimonials, signup or waitlist flows.

## 4. Branch, PR and approval rules

- **Never commit or push directly to `main`, merge into `main`, enable auto-merge or deploy to production.** The human repository owner controls merging and production releases.
- Work on a task branch created from the latest integrated `main`: `feat/<task-id>-<description>`, `fix/<task-id>-<description>` or `chore/<task-id>-<description>`. Do not force-push, rewrite shared history, bypass checks or commit secrets/private data without explicit authorization.
- Routine in-scope work on an assigned approved task is pre-authorized: an agent **may create its branch, commit, push and open/update one primary PR** without separate permission for every routine operation. Target `main`; keep the PR in **draft** until checks and independent review pass. Prefix its title with the task ID.
- Request owner approval for missing product decisions, material scope/architecture changes, credentials, paid/external services, infrastructure or DNS changes, destructive actions and deployment. **No agent merges**, even when checks pass.
- Never start dependent work while its predecessor PR is pending. For independent parallel tasks, require disjoint file ownership and a named integration coordinator; serialize shared tracker edits.
- For owner-only actions (accounts, environment variables, DNS, Vercel, billing, access, merge, deployment or destructive migrations), give numbered, copyable instructions with console location, safe values/placeholders, verification steps and the next needed response. **Never ask for secrets in chat, PRs or logs.** Do not assume the action succeeded until verified.

## 5. Engineering and tests

Follow [Codex efficiency guidance](docs/CODEX-EFFICIENCY.md) and [usage measurement](docs/CODEX-USAGE.md): default to one implementation session plus one independent reviewer, avoid duplicate agents and repeated repository reads, run targeted checks during development, and retain the full CI suite as the merge gate. Never trade correctness or independent review for credits.

- Work to principal/staff-level standards: inspect existing conventions before editing, trace behavior to exact product/ARCH/UI decisions, implement the smallest coherent complete change, and document consequential trade-offs.
- Follow approved Next.js modular monolith, Neon/Drizzle, typed API, centralized authorization, jobs, email and private storage. **Do not introduce PostgreSQL RLS** or replace approved core technologies without explicit approval.
- Enforce server-side deny-by-default authorization, wedding/organization tenant scope, record privacy and revocation. Never rely on hidden UI controls for security. Treat all input as untrusted; protect logs, exports and tests from secrets and personal data.
- Address validation, financial precision, wedding-local time, concurrency, transaction boundaries, idempotency, retries, auditability, retention, localization, accessibility and loading/empty/error states where applicable. Avoid speculative abstractions, broad refactors and unrelated changes.
- **The same implementation agent writes both the production code and relevant automated tests.** Cover happy paths, failures, boundaries, authorization denials, cross-tenant isolation, privacy, concurrency/idempotency and appropriate integration/E2E/accessibility checks.
- Run applicable format/lint, types, unit/integration, build, E2E and migration checks. Report exact commands and pass/fail/skipped results. Do not weaken or remove tests merely to get green checks. If release-critical verification is unavailable, leave the PR in draft.

## 6. Fresh independent review — mandatory

- For **every child task**, start a **different, fresh reviewer agent** after implementation and tests, using `.codex/agents/reviewer.toml` and `.agents/skills/review-feature/SKILL.md` when supported.
- The reviewer independently reads this contract, plan, assigned brief, cited source decisions, affected code/tests and the **complete PR diff**. The reviewer must not trust the implementer's conclusions.
- Review product fidelity, architecture, authorization/tenant isolation, privacy, data correctness, migration safety, concurrency, performance, accessibility, localization, tests and regressions. Distinguish checks actually executed from static review.
- Reviewer is **read-only**: report findings with severity, exact files/lines, evidence and remedies in a traceable PR review/report. The implementer fixes blocking/high findings and reruns checks. Material fixes receive **fresh independent re-review**; reviewers never fix their own findings or start further agents.
- If fresh independent review cannot run, mark review **pending**, leave the PR in draft and provide a handoff for a separately launched reviewer. Never substitute self-review or mark Done.

## 7. Status and handoff

- `docs/PLAN.md` is the authoritative task/dependency/status tracker; `docs/steps/NN.md` is a milestone overview; `docs/steps/NN-x.md` is a single-agent work order. Use `.agents/skills/implement-feature/SKILL.md`, `.agents/skills/plan-task/SKILL.md`, `.agents/skills/orchestrate-development/SKILL.md` and `docs/AGENT-OPERATIONS.md` as applicable.
- Statuses: **Not started → In progress → In review → Done**, or **Blocked** with a reason. Record status and evidence on the task branch/PR, not by direct writes to `main`.
- `Done` requires verified acceptance criteria, executed checks, independent review with no blocking findings **and owner-merged PR into `main`**. PR approval alone is not completion. After owner merge, a newly authorized coordinator/agent may reconcile the tracker to Done through its own branch/PR; never falsify status on `main`.
- Each handoff records exact decision IDs, implementation summary/files, branch/PR/commit links, test commands and outcomes, reviewer identity and findings disposition, migrations/configuration/rollback, owner-only actions, blockers and downstream dependencies.
- Do not claim unperformed tests, deployment, independent review or completion. Mark a milestone Done only when every child task and required integration checks are complete.

**Non-negotiable:** one fresh implementation session per child task; implementer-owned tests; fresh independent reviewer; task-specific branch and PR; no autonomous merge or production deployment; verifiable evidence.
