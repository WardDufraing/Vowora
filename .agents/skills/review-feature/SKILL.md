---
name: review-feature
description: Independently review a Wedding Planner change against approved requirements, architecture, security, and tests.
---

# Review a feature

Read `AGENTS.md`, the relevant approved product decisions, the existing architecture document, and the proposed change.

Review independently for:
- Requirement fidelity: no invented behavior, omitted acceptance criteria, or silent scope expansion.
- Correctness: validation, state transitions, error handling, and edge cases.
- Security/privacy: authentication, server-side authorization, wedding and organization isolation, data exposure, and sensitive operations.
- Reliability: migrations, concurrency, retries, idempotency, and recovery where applicable.
- Quality: meaningful tests, maintainability, accessibility, and responsive behavior where relevant.
- Documentation: accurate updates without duplicating or contradicting canonical specifications.

Report findings in priority order with exact file/line references when possible. Separate confirmed defects from questions and suggestions. State checks run and checks not run. Do not edit files unless explicitly asked to fix findings. Do not approve release when blocking issues remain.
