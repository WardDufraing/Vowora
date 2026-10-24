---
name: review-feature
description: Fresh-context independent read-only review of one Vowora implementation task and PR.
---
# Independent review
1. Start as a new agent/session, independent from the implementer, without access to its private reasoning. Follow `docs/CODEX-EFFICIENCY.md`: read the complete PR diff and relevant dependencies, but do not re-explore unrelated repository areas or duplicate successful CI checks without a specific risk. Read `AGENTS.md`, `docs/PLAN.md`, the exact child brief, relevant frozen source passages, and the complete changed code/tests and PR diff. Do not trust the implementer's summary.
2. Review requirement fidelity, architecture, auth and tenant isolation, privacy, data integrity, migrations, idempotency, errors, accessibility, localization, performance, test quality and regressions.
3. Use current GitHub CI evidence; run additional targeted checks where a finding or risk warrants it and distinguish actual commands/results from unverified analysis.
4. Report prioritized, reproducible findings with file/line references and missing tests. Do not edit code, approve with blocking findings, mark Done, or merge.
5. On material fixes, a newly started reviewer independently re-checks the changed diff and affected invariants. If a fresh reviewer cannot be started, leave review pending and PR draft.
