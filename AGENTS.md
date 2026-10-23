# Vowora — Agent Engineering Contract

Applies to every orchestrator, implementation, reviewer, tester and delegated agent working through Codex Web, CLI, IDE or another supported runtime. The objective is production-quality engineering with independently verified evidence, not merely plausible code.

## 1. Immutable sources of truth

Read these as the approved authority for their respective domains:
1. `docs/product/Wedding-Platform-Product-Specification.md` (v259.10): product behavior, roles, permissions, lifecycle, MVP scope.
2. `docs/product/product-architecture.md` (ARCH-001–150): architecture and technology choices.
3. `docs/product/UI-DESIGN-SYSTEM.md`: visual direction and approved design decisions, including explicitly pending validation.

**Never edit, move, regenerate or replace these three documents in ordinary implementation.** If specifications conflict, lack a necessary decision or would require changing the approved architecture, stop only the affected work, document the exact citations and options, and request explicit owner approval through a separate controlled change. Never fill gaps with invented product requirements. The legacy `docs/PLANS.md` is superseded and is not a work tracker.

## 2. Canonical planning and the one-step/one-agent rule

- `docs/PLAN.md` is the sole authoritative task index, dependency graph, statuses and progress tracker. `docs/steps/NN-x.md` is the focused child-task work order; `docs/steps/NN.md` is the milestone summary.
- **Every child task (e.g. `01-a`, `01-b`) must be assigned to a newly started implementation agent with a fresh context.** Never reuse an implementation agent for another child task. Milestones are not individually assignable.
- At the start of **every** session, including orchestrator and reviewer sessions, read this `AGENTS.md`, then `docs/PLAN.md`, then the exact assigned child brief, dependency handoffs, and relevant code. Read only relevant cited passages of frozen specifications; do not load the ~1 MB specification wholesale.
- Before choosing a task, check prerequisites, in-flight branches/PRs, existing task status, blockers, and ownership. Select only an unblocked task whose prerequisites are integrated into the task's base branch; never treat a pending PR as merged.
- An orchestrator/coordinator chooses and delegates steps, records ownership, tracks dependencies and PRs, and starts a **new** agent for each next eligible step. An implementation agent completes exactly one assigned child task, plus narrowly necessary fixes.
- If the runtime cannot actually start another fresh agent, explicitly report this limitation and request/manualize delegation; **do not pretend a new agent has run**, do not substitute self-review for independent review, and do not silently start the next task.
- Parallel agents are permitted only for independent tasks with disjoint changed-file ownership and a named integration coordinator. Avoid shared-file collisions on `docs/PLAN.md`; integrate status changes serially. Split oversized tasks explicitly in the roadmap before coding.

## 3. Branch and pull-request discipline

- **Never commit or push to `main`, never merge into `main`, never enable auto-merge, and never deploy to production.** All implementation work stays on a task-specific branch, normally created from the latest `main` after prerequisites have merged.
- Branch naming: `feat/<task-id>-<short-kebab-description>`, `fix/<task-id>-<short-kebab-description>`, or `chore/<task-id>-<short-kebab-description>`. Examples: `chore/01-a-monorepo-foundation`, `feat/06-b-partner-invitations`.
- A task agent **may create its task branch, commit, push and open/update a PR without asking permission for each routine action**. Keep commits focused and messages descriptive; never use destructive history rewrites or force-push unless the owner explicitly authorizes them. Never commit secrets, generated credentials or private user data.
- Create exactly one primary PR per task, targeting `main`; open as a draft while incomplete and mark ready only after the quality gates pass. PR title begins with the task ID.
- An implementation agent can update its own task branch and PR in response to review. Never bypass required checks, branch protections or human approval. Never merge a PR, even if all tests and reviews pass. The human repository owner controls merging.
- A next-step agent must not begin dependent work until its required predecessor PR is merged and the relevant plan/brief handoff is visible on the integration base. If owner approval or merge is pending, report the dependency rather than coding ahead.

## 4. Senior-plus engineering standard

- Behave as a meticulous principal/staff-level engineer: read before editing, trace requirements to exact decision/ARCH IDs, inspect existing interfaces and conventions, choose the smallest coherent complete solution, and optimize for correctness, maintainability, observability, security, accessibility and operational safety.
- Before substantial edits, create a brief actionable implementation plan identifying scope/non-goals, affected files and contracts, prerequisites, risks, acceptance criteria, tests and migration/rollback implications. Routine in-scope implementation is pre-authorized by the assigned approved step; **ask the owner only for missing product decisions, paid/external resources, credentials, infrastructure changes, irreversible/destructive actions or material scope/architecture deviations**.
- Follow approved modular monolith, Neon/Drizzle, Next.js, typed API, centralized permission engine, design tokens, jobs and storage decisions. Do not add PostgreSQL RLS or swap approved core technologies without explicit approval.
- Follow established patterns; avoid speculative abstractions, duplicate models, hidden side effects, brittle shortcuts, broad refactors and unrelated changes. Handle invalid states, retries, concurrency, partial failures, timezone/money precision, accessibility, localization, loading/empty/error states and audit/event delivery as applicable.
- Enforce authorization **server-side** at every boundary, including wedding/organization membership, private/shared visibility and record permissions. Treat all client input as untrusted. Never leak data between tenants, users or weddings; do not put secrets or personal data in logs, snapshots or tests.
- Explain consequential technical trade-offs in the handoff. Do not claim functionality or performance without verification.

## 5. Tests are written by the implementing agent

- The **same fresh implementation agent** that writes production code must also author relevant automated tests for its step. The test suite must not be outsourced as a substitute for implementation accountability.
- Cover meaningful happy paths; error and validation paths; authorization denials; negative cross-wedding/organization/tenant isolation; privacy; boundary values; concurrency/idempotency; and relevant integration, accessibility and UI flows. For security-sensitive and financial workflows, include regression tests for established invariants.
- Run applicable formatting/lint, types, unit/integration tests, build, E2E and migration verification based on what exists. Never fabricate commands or results; note any checks unavailable because of environment limitations and leave the PR in draft if release-critical verification is missing.
- Tests should validate behavior and requirements, not merely code structure or mocked implementation details. Do not weaken, skip, delete or change tests just to pass a failing check without clear justification and owner review.

## 6. Mandatory fresh independent reviewer agent

- **For every implementation task, the implementation agent must initiate a different, freshly started reviewer agent** after implementation and tests, using `.codex/agents/reviewer.toml` and `.agents/skills/review-feature/SKILL.md` if the runtime supports this delegation. The reviewer must not be the implementation agent or retain its unshared reasoning/context.
- The reviewer independently reads `AGENTS.md`, `docs/PLAN.md`, the child brief, referenced approved decisions, relevant code/tests, and the complete PR diff. It must investigate the change as if encountering it for the first time, not trust the implementer's claims or explanation.
- Review against product fidelity, architecture, security, server-side authorization, isolation, privacy, correctness, data consistency, migration safety, concurrency, performance, accessibility, localization, tests and regression risks. Reproduce relevant checks when practical; clearly separate executed evidence from static assessment.
- Report findings by severity (blocking/high, medium, low) with exact paths/lines, evidence, missing tests and recommended remedies. The reviewer is **read-only**: it must not edit implementation code, resolve its own findings or change task status. Post the review/findings to the PR or attach a traceable review report.
- The implementer addresses all blocking/high findings, reruns relevant checks, and requests **a fresh independent re-review of material fixes** until blocking issues are cleared. No self-approval, rubber-stamp or infinite agent-recursion loop: reviewers review, implementers fix, orchestrator starts the next implementation agent only at the next task.
- If true fresh-agent delegation is unavailable, flag independent review as **pending**, leave the PR in draft and provide precise handoff instructions for a separately launched reviewer. Never mark the task Done.

## 7. Owner-required actions: exact step-by-step guidance

- When only the repository owner can act (accounts, credentials, environment variables, cloud services, domain/DNS, access permissions, billing, approvals, merge, destructive migrations or deployment), explain **why** the action is needed and give numbered, copyable steps with the exact console/location, safe values or placeholders, verification method and what the agent needs next.
- Never ask owners to paste secrets into chat, issues, PRs, logs or commits. Use the intended secret manager and describe only variable names and destinations.
- Do not ask the owner for routine coding decisions already covered by the approved specs. If access is missing, prepare all safe work possible and document the precise blocker; never assume an owner action succeeded until confirmed.
- Do not execute irreversible operations, live data deletion, production migrations or externally billable actions without explicit separate owner approval. Do not create or use unsupported credentials.

## 8. Task status, PR evidence and handoff

- Allowed statuses in `docs/PLAN.md`: Not started → In progress → In review → Done, or Blocked with reason. `Done` means independently reviewed, all blocking findings resolved, checks and acceptance criteria met, **and PR merged into the integration branch (`main`) by the owner**. PR approval alone is not Done.
- On starting a task, record the agent/branch/PR (as available) and set In progress on the task branch. Before requesting review set In review. Plan/brief changes are committed on the task branch with the code; **never update `main` directly**. While a PR is unmerged, `main` may legitimately still show the previous status; coordinate post-merge reconciliation without violating branch rules.
- Handoff in the child brief and PR must contain: exact requirements/decision IDs; implementation summary and touched files; actual branch, commits and PR URL; tests/commands with pass/fail/skipped evidence; reviewer identity/independence and findings disposition; migrations/configuration/rollbacks; owner actions with steps; blockers/limitations; follow-on dependency notes.
- A task may be marked In review in its PR branch when ready; only after the owner merges, a **newly authorized coordinator or next task agent** may reconcile the merged roadmap to Done on its own branch/PR. Never falsely change unmerged work to Done or rewrite frozen baselines.
- Do not begin the next dependent task because the prior task looks finished locally. Verify actual merge and fresh base first. Milestone Done only after all its children are Done and required integration checks are satisfied.

## 9. Instruction precedence and skills

Approved product behavior > approved architecture and UI design in their domains > `docs/PLAN.md` and task briefs > implementation choices. Report any material contradiction instead of choosing silently.

Use `.agents/skills/implement-feature/SKILL.md` for implementation and `.agents/skills/review-feature/SKILL.md` for fresh independent review. Use `.agents/skills/plan-task/SKILL.md` for task planning and `.agents/skills/orchestrate-development/SKILL.md` with `.codex/agents/orchestrator.toml` for coordination. See `docs/AGENT-OPERATIONS.md` for startup and GitHub setup.

GitHub enforcement caveat: private-repository rulesets may require an upgraded plan; when unavailable, report this explicitly and never treat CI instructions as enforced branch protection.\n\n**Non-negotiable:** one new implementer per child step; independent fresh reviewer per step; implementer-owned tests; descriptive task branch; PR to `main`; no autonomous merge or production deployment; honest evidence.
# Vowora — Codex Agent Instructions

These rules apply to Codex Web, CLI, IDE and delegated agents.

## Frozen sources of truth — READ ONLY
1. `docs/product/Wedding-Platform-Product-Specification.md` — approved product behavior, roles, permissions, lifecycle and MVP scope (v259.10).
2. `docs/product/product-architecture.md` — approved technical baseline (ARCH-001–150).
3. `docs/product/UI-DESIGN-SYSTEM.md` — approved visual direction and design decisions, including its explicitly pending validation work.

**Never edit, move, regenerate or replace these three files during ordinary development.** They are frozen working baselines. If a genuine contradiction or necessary change arises, stop that part of work, record it as a blocker and obtain explicit owner approval for a separate controlled source change. Do not quietly change requirements or interpret unapproved proposals as approved.

## Approved deployment and domain boundaries
- `https://vowora.app`: public marketing site, existing Vercel project, `apps/marketing`; preserve its root homepage during app development.
- `https://app.vowora.app`: authenticated wedding platform plus its versioned REST API, separate Vercel project, `apps/web`, same Turborepo repository.
- Each Vercel project has independent root directory, environment variables and deployment pipeline. Do not create/modify Vercel projects, DNS or production releases without the required approval. Keep authentication cookies host-only on the app origin by default; do not assume shared subdomain cookies.
- Frozen architecture's single Vercel web/API deployment applies to the app plus API; it does not require combining marketing and app deployments. Escalate any genuine baseline conflict.

## Execution
- `docs/PLAN.md` is the authoritative execution tracker; `docs/steps/NN.md` is the agent's focused work order. Neither overrides the three frozen baselines.
- Start with one unblocked step. Read this file, the plan, the selected step, and **only relevant cited portions** of the frozen sources, plus dependent handoffs and affected code. Do not ingest the entire 1 MB specification by default.
- Before nontrivial edits, present scope, dependencies, affected files, risks, acceptance criteria and tests, and request approval. One agent owns one bounded step; coordinate file ownership for parallel work.
- Follow approved modular monolith, Neon/Drizzle, Next.js, typed API, centralized permission engine, design tokens, jobs and storage patterns. Do not add PostgreSQL RLS or change approved core technologies without explicit approval.
- Enforce server-side permissions, wedding/organization scope, private/shared record visibility, validation, accessibility, localization, financial correctness, idempotency and audit where applicable.
- Add meaningful tests including negative tenant-isolation tests; run available checks and report exact results. Request independent review. Never claim Done without verified acceptance criteria.
- Do not commit, push, merge, deploy, delete data or run destructive migrations without explicit approval for that action.
- At handoff, update the step's implementation log and `docs/PLAN.md` status, link actual PR/commit/test/review evidence, and list blockers. Never mark a source baseline modified as a routine step.
- Use `.agents/skills/implement-feature/SKILL.md` and `.agents/skills/review-feature/SKILL.md` where applicable.

## Instruction precedence
Approved product behavior > approved architecture and design within their domains > agent plan and step summaries > implementation preferences. Flag material conflicts; do not invent resolutions.
