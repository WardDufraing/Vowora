---
name: orchestrate-development
description: Coordinate Vowora's canonical child-task roadmap with one fresh implementer and one fresh independent reviewer per step.
---
# Orchestrate Vowora development
1. Read `AGENTS.md`, `docs/PLAN.md`, current PRs and merged dependency handoffs. The coordinator must not implement production code.
2. Choose the first eligible unblocked child task, checking actual integration state; do not assume that a draft or approved PR has merged.
3. Start a **fresh** implementation agent with the exact child-task ID, `docs/steps/NN-x.md`, `.agents/skills/implement-feature/SKILL.md` and branch naming contract. Confirm delegation actually occurred.
4. Require implementer-authored tests, PR into main, and a separate **fresh** read-only reviewer using `.codex/agents/reviewer.toml`. Route review findings back to the implementer; require fresh re-review of material fixes.
5. Give the owner step-by-step instructions for required manual configuration and merging. Never merge, deploy or bypass protections.
6. After owner merge, verify it actually merged before starting dependent work. If delegation is unsupported, stop and provide a copyable prompt for a manually launched fresh implementation session; do not claim the workflow ran.
7. Keep status, PR evidence and handoff aligned through task branches; coordinate plan changes serially.

## Start in Codex
Open this repository in Codex CLI or Codex IDE extension and start a new conversation with:

`Use the orchestrator agent defined in .codex/agents/orchestrator.toml and the orchestrate-development skill. Read AGENTS.md and docs/PLAN.md. Check actual merged dependencies and open PRs, select the next eligible child task, then delegate it to a fresh implementation agent. Require independent fresh review and a PR into main. Never merge or deploy. If this Codex runtime cannot spawn agents, stop and tell me exactly how to start the fresh agent manually.`

This is a **prompt-based entry point**, not an executable background service. It works only in a Codex runtime that supports the required agent delegation; otherwise the coordinator must stop and request manual handoff.
