# Wedding Planner — Agent Instructions

These instructions apply to all work in this repository, including Codex Web, CLI, IDE, and delegated agents.

## Source of truth
1. `Wedding-Platform-Product-Specification.md` is the canonical, living product specification. Read relevant sections before proposing or implementing product behavior. Preserve its decision IDs and terminology.
2. Locate and read the existing architecture document before selecting technologies or changing system structure. If it cannot be located, stop and ask; do not invent an architecture.
3. A design system has **not yet been approved**. Do not create one or present visual design preferences as established requirements.
4. `docs/PLANS.md` is a development planning aid, not an authority that overrides the product specification or architecture.
5. When instructions conflict, explain the conflict and ask for a decision before implementation.

## Working agreement
- Work on one bounded task at a time. Start by stating scope, affected files, dependencies, risks, and acceptance criteria.
- For nontrivial changes, propose a plan and wait for approval before editing implementation files.
- Do not invent or silently resolve missing product requirements, permission rules, data-retention rules, or architecture decisions.
- Do not change the product specification or architecture without explicit approval. Record approved decisions in the appropriate canonical file, not in parallel copies.
- Prefer the smallest coherent change; avoid unrelated refactors and speculative abstractions.
- Never expose secrets, credentials, personal information, or production data in code, logs, examples, or commits.
- Treat authentication, tenant/workspace isolation, authorization, and privacy as critical: enforce access server-side and test cross-wedding and cross-organization boundaries.
- Include loading, empty, error, validation, accessibility, and responsive states where relevant; defer visual styling decisions until the design system is agreed.
- Add or update relevant automated tests. Run available checks; clearly distinguish checks actually run from checks not run.
- Do not commit, push, merge, deploy, delete data, or run destructive migrations without explicit approval for that action.
- Do not report a feature complete unless its acceptance criteria have been verified. Document unresolved gaps and risks.

## Collaboration and review
- Separate implementation and review when practical. Reviewers should challenge assumptions and identify correctness, authorization, privacy, accessibility, and regression issues.
- Delegated agents must follow this file and the same source-of-truth rules.
- Do not let multiple agents edit the same files concurrently without a clear integration owner.
- Use `.agents/skills/implement-feature/SKILL.md` for feature delivery and `.agents/skills/review-feature/SKILL.md` for independent review.
- At handoff, summarize changed files, decisions required, tests executed, outstanding issues, and the next suggested task.
