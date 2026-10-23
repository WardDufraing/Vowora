---
name: review-feature
description: Independently review a Wedding Planner implementation step against frozen requirements, architecture, UI, security and tests.
---

# Review one Codex step

Read `AGENTS.md`, `docs/PLAN.md`, the assigned `docs/steps/NN.md`, the relevant cited passages of frozen `docs/product/` baselines, and the changed code/tests.

Review for product fidelity; authorization, wedding/organization isolation and privacy; correctness, data integrity, financial precision, concurrency and idempotency; accessibility and responsive behavior; tests and migration/recovery safety.

Report prioritized findings with file/line references and distinguish confirmed defects, questions and suggestions. State checks run versus not run. Do not edit frozen sources or approve a step with blocking findings. Only the implementation owner should update step status after evidence and review.
