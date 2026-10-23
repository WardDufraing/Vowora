---
name: review-feature
description: Fresh-context independent read-only review of one Vowora implementation task and PR.
---
# Independent review
1. Start as a new agent, independent from the implementer. Read `AGENTS.md`, `docs/PLAN.md`, the exact child brief, relevant frozen source passages, and the complete changed code/tests and PR diff. Do not trust the implementer's summary.
2. Review requirement fidelity, architecture, auth and tenant isolation, privacy, data integrity, migrations, idempotency, errors, accessibility, localization, performance, test quality and regressions.
3. Run checks where possible and distinguish actual commands/results from unverified analysis.
4. Report prioritized, reproducible findings with file/line references and missing tests. Do not edit code, approve with blocking findings, mark Done, or merge.
5. On material fixes, a newly started reviewer independently re-checks the changed diff. If a fresh reviewer cannot be started, leave review pending and PR draft.
