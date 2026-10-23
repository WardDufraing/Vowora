---
name: implement-feature
description: Implement one approved Vowora step with traceable requirements, tests and a review handoff.
---

# Implement one Codex step

1. Read root `AGENTS.md`, `docs/PLAN.md` and the assigned `docs/steps/NN.md`. Read only the relevant cited sections of the three frozen `docs/product/` documents; never edit them.
2. Check dependencies and existing code; identify exact product decisions, roles, permissions and tenant boundaries.
3. Propose a bounded change: goal, non-goals, dependencies, affected files, acceptance criteria, tests and risks. Obtain approval before nontrivial edits.
4. Implement the vertical slice within approved architecture and design; never invent missing behavior.
5. Test happy paths, validation, authorization failures, cross-tenant isolation and relevant edge cases.
6. Run actual checks, request independent review and resolve blockers.
7. Update the assigned step log and plan status with PR/commit links, test evidence, risks and handoff.

Do not commit, push, merge, deploy or modify frozen sources without explicit owner approval.
