# Codex efficiency without quality shortcuts

This guide supplements [AGENTS.md](../AGENTS.md). Mandatory independent review, complete PR CI, security checks, frozen product decisions, and human-only merge remain unchanged.

## Default execution path
1. One **fresh implementation session** per approved child task. A coordinator is optional, not a prerequisite: the owner can launch the implementer directly. Never run an idle coordinator alongside the implementer just to observe it.
2. Before coding, read AGENTS.md, PLAN.md, the assigned child brief, dependency handoff, and affected files. Read only cited passages from frozen specifications. Keep a concise scope/acceptance/test plan; do not generate repetitive planning documents.
3. Implementer owns code and relevant automated tests. During development run targeted tests and type/lint checks for affected workspaces; inspect concise error output. Do not rerun unchanged successful checks without cause.
4. Open **one draft PR**. GitHub CI runs the complete format/lint/typecheck/build/test suite. Its passing results are required regardless of local targeted checks.
5. Start **one separate fresh, read-only reviewer session** with the complete PR diff, child brief, relevant contracts and CI evidence. The reviewer independently checks all changed files and traces risky dependencies, but avoids unrelated repository exploration. A reviewer must not inherit the implementer's private reasoning or accept its claims as proof.
6. Implementer addresses actionable findings. Reviewer independently verifies material fixes and impacted invariants; require another complete independent review only if the scope/risk materially changed. No review can be self-certified.
7. Owner alone marks final merge decision. No automatic merge or production deploy.

## Resource discipline
- Default to one agent at a time; delegate only disjoint, substantial work with explicit benefit. Do not spin up parallel implementers, testers, architects and reviewers for a single small child task.
- Choose a cost-efficient available Codex model and moderate reasoning for routine implementation. Escalate model/reasoning for security-critical changes, architectural ambiguity, complex bugs and independent review. Model names and billing vary by plan; do not hardcode them here.
- Avoid unbounded searches, whole-repo dumps, repeated summaries, and lengthy command logs. Preserve complete diagnostics when a failure needs investigation.
- Stop after two unsuccessful attempts at the same approach and report the blocker, evidence, and options rather than loop.
- Never skip tests, threat analysis, access controls, or independent review to meet a token/credit target.

## Evidence and merge gates
PR handoff must include: task and decision references; files and behavior changed; commands and results; CI links; independent reviewer identity/session and findings disposition; known limitations and owner-only actions. A self-review or automated test suite does **not** substitute for the required fresh reviewer.

## Measuring usage
Use [Codex usage log](CODEX-USAGE.md). Record approximate credits for implementation, review and rework separately from the Codex usage interface when available. Missing metrics remain `unknown`; never invent them. Compare credit consumption **per owner-approved PR** and review defects over multiple tasks, not wall-clock minutes. Usage data is manual: GitHub Actions does not have access to personal Codex credits.
