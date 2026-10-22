---
name: implement-feature
description: Plan and implement one approved Wedding Planner feature with traceable requirements, tests, and a review handoff.
---

# Implement a feature

1. Read the root `AGENTS.md`, the relevant portions of `Wedding-Platform-Product-Specification.md`, and the existing architecture document.
2. Identify exact product decision IDs, roles, permissions, cross-workspace boundaries, and any unresolved requirements.
3. Write a small proposal: goal, scope, non-goals, dependencies, files likely to change, acceptance criteria, tests, and risks. Ask for approval before nontrivial edits.
4. Implement only the approved slice, following the established architecture. Never invent missing behavior.
5. Add tests for happy paths, validation, authorization failures, tenant isolation, and relevant edge cases.
6. Run relevant checks. If tools or infrastructure are unavailable, say so explicitly.
7. Request independent review when practical, resolve findings within scope, and report any unresolved concerns.
8. Hand off a concise summary: changes, specification references, test commands/results, risks, and suggested next task.

Do not commit, push, merge, deploy, or modify canonical requirements without explicit approval.
