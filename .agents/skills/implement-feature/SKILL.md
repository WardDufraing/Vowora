---
name: implement-feature
description: Implement exactly one approved Vowora child task on a named branch, with authored tests, independent review and PR handoff.
---
# Implement one Vowora child task
1. In a fresh session read `AGENTS.md`, `docs/PLAN.md`, the assigned `docs/steps/NN-x.md`, prerequisite merged handoffs and relevant source code. Consult only cited frozen product/architecture/UI passages.
2. Verify prerequisite PRs are merged, no other agent owns the task, and the branch starts from current main. If not, stop and report the blocker.
3. Follow `docs/CODEX-EFFICIENCY.md`: no standing coordinator or extra subagents by default; run targeted checks while iterating, preserve full PR CI and record usage using `docs/CODEX-USAGE.md`. Prepare a concise implementation plan: requirements, scope, files, contracts, risks, acceptance criteria, tests and rollback. Routine scoped work is authorized; ask the owner for missing decisions or sensitive external actions only.
4. Create `feat|fix|chore/<task-id>-<description>`; implement one complete coherent slice without unrelated changes. Protect tenant boundaries and server permissions.
5. Personally write and execute meaningful tests, including failures, permission denial, cross-tenant isolation and relevant integration/accessibility cases. Record commands and real outcomes.
6. Start a **new** read-only reviewer agent using `.codex/agents/reviewer.toml`; provide task ID, branch, PR diff and specification pointers, not private reasoning. Fix blocking findings and request fresh re-review. If delegation is unavailable, leave review pending and PR draft.
7. Commit and push on the task branch; open a draft PR into main. Mark ready only with completed verification and independent review. Record evidence, review, blockers and owner actions in PR and task handoff; never claim merged/Done before owner merge.
8. Never merge, deploy, alter frozen sources, force-push, or perform destructive actions without explicit authorization.
