# Starting and governing Vowora agents

## Prerequisites
1. Review and manually merge the agent workflow PR into `main` after approval. No agent is authorized to merge it.
2. Use Codex CLI or Codex IDE with this repository checked out and refreshed to the latest `main`. The runtime must support spawning subagents to fully automate delegation; instructions alone cannot enable that capability.
3. In GitHub: **Settings → Rules → Rulesets → New branch ruleset** (or Settings → Branches → Add branch protection rule, if that is the available interface). Target `main`; require pull requests before merging, required approvals (when supported), require status checks after the Agent policy workflow has run, block force pushes/deletions, and disable bypasses where your plan and permissions allow. Save and verify on a test PR. Rulesets and required approvals depend on your GitHub plan/private-repository eligibility; if enforcement is unavailable, keep merges manual and treat the limitation as a blocker for guaranteed protection.
4. Set required checks to the exact GitHub-reported names after the workflow runs (currently the job is `policy` in workflow `Agent policy`). Add build/test checks when the monorepo test harness exists. CI policy alone does not prevent merges without branch protection.

## Cost-efficient default

For each eligible child task, launch one fresh implementation Codex session directly using its brief and `.agents/skills/implement-feature/SKILL.md`. After its draft PR and CI, launch a separate fresh read-only review session with `.agents/skills/review-feature/SKILL.md`. A coordinator is **optional** for complex multi-task planning; it must not run concurrently solely to supervise a small task. See `docs/CODEX-EFFICIENCY.md` and `docs/CODEX-USAGE.md`. Full PR CI and independent review remain mandatory.

## Optional coordinator
From the local repository, start Codex CLI (`codex`) or open the repository in the Codex IDE extension. In a **new** conversation, send:

> Use the orchestrator agent defined in `.codex/agents/orchestrator.toml` and the `orchestrate-development` skill. Read `AGENTS.md` and `docs/PLAN.md`. Inspect actual merged dependencies and open PRs. Choose the next eligible child task and start a fresh implementation agent for that task. Require the implementer to write and run tests, start a separate fresh reviewer, fix findings, and create a PR into main. Stop at owner merge approval; never merge or deploy. If this runtime cannot start agents, tell me exactly how to launch the implementation and reviewer in fresh sessions.

A named agent config file is **not** by itself a universally supported `codex --agent orchestrator` CLI command. Use the prompt above; confirm the installed Codex version supports custom subagent roles before assuming automatic delegation. The coordinator runs while the Codex session is active, not as an unattended GitHub service.

## Task lifecycle
A coordinator may select a child task only after all prerequisites are actually merged. The implementation agent uses a named task branch, writes code and tests, and opens a draft PR. A new read-only reviewer checks the full diff. The implementer resolves blockers; re-review follows. Owner manually merges after required checks and review. Only then may the next dependent task begin.

## Owner-required actions
The agent must provide exact step-by-step console paths, safe placeholders and verification for credentials, paid services, GitHub rules, infrastructure and merge decisions. Never put secrets in a PR or chat.
