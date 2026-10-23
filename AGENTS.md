# Vowora — Codex Agent Instructions

These rules apply to Codex Web, CLI, IDE and delegated agents.

## Frozen sources of truth — READ ONLY
1. `docs/product/Wedding-Platform-Product-Specification.md` — approved product behavior, roles, permissions, lifecycle and MVP scope (v259.10).
2. `docs/product/product-architecture.md` — approved technical baseline (ARCH-001–150).
3. `docs/product/UI-DESIGN-SYSTEM.md` — approved visual direction and design decisions, including its explicitly pending validation work.

**Never edit, move, regenerate or replace these three files during ordinary development.** They are frozen working baselines. If a genuine contradiction or necessary change arises, stop that part of work, record it as a blocker and obtain explicit owner approval for a separate controlled source change. Do not quietly change requirements or interpret unapproved proposals as approved.

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
