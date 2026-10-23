# Vowora — Codex Development Plan

**Status:** Execution roadmap; approved product/architecture/UI baselines are frozen for ordinary implementation.  
**Authority:** `docs/product/Wedding-Platform-Product-Specification.md` (v259.10), `docs/product/product-architecture.md` (ARCH-001–150), `docs/product/UI-DESIGN-SYSTEM.md` (UI/VIS/FINAL approvals).  
**Agent instructions:** `AGENTS.md`. **Task briefs:** `docs/steps/`.

## How Codex should work

1. Pick the **first unblocked, not-yet-complete** step below. One implementation agent owns one step at a time. Parallel steps are allowed only if dependencies are satisfied and file ownership does not overlap.
2. Read `AGENTS.md`, **this plan**, and **only the selected step brief**. Read the specifically referenced sections/decision IDs of the frozen source documents as needed, not their entire contents by default. A brief is a navigation and execution contract, not a substitute for binding source requirements.
3. Inspect the existing code and tests, write a short implementation proposal with changed files and acceptance criteria, and obtain approval as required by `AGENTS.md`. Do not silently choose unapproved product behavior.
4. Implement a complete, testable vertical slice with migration/API/UI/authorization/tests where applicable. Prefer integration through existing domain services; avoid unrelated refactoring.
5. Run lint, types, relevant unit/integration/security tests and end-to-end checks where applicable. Request independent review; record actual evidence and blockers.
6. Update **only** this plan's status and the chosen step's implementation log, plus normal source/test files. Never modify `docs/product/*` in routine development. Explicit owner approval and a separate controlled change are required to change a frozen baseline.
7. Mark Done only after acceptance criteria pass and review is resolved. Record PR/commit, test evidence, and next unblocked step. Never assume a checkbox is done because code was written.

**Status legend:** Not started → In progress → In review → Done; Blocked when a required dependency or product decision is missing.  
**Scope rule:** One step is intended for one Codex agent/session; if it proves too large, split it into numbered substeps with explicit ownership and dependency links **before** implementation, without changing approved requirements.  
**GitHub read-only note:** Frozen means agent policy, not file-system ACL. Enforce technically with repository rules/CODEOWNERS if desired; agents cannot bypass this policy.

## Ordered implementation steps

| Step | Agent-sized deliverable | Depends on | Status | Brief |
| --- | --- | --- | --- | --- |
| 01 | Repository and CI foundation | None | Not started | [01](steps/01.md) |
| 02 | Database and domain foundations | 01 | Not started | [02](steps/02.md) |
| 03 | Authentication and sessions | 01, 02 | Not started | [03](steps/03.md) |
| 04 | Authorization and membership engine | 02, 03 | Not started | [04](steps/04.md) |
| 05 | Design tokens and application shell | 01, 03, 04 | Not started | [05](steps/05.md) |
| 06 | Wedding creation and partner onboarding | 03, 04, 05 | Not started | [06](steps/06.md) |
| 07 | Planner organizations and team access | 04, 06 | Not started | [07](steps/07.md) |
| 08 | Tasks and planning timeline | 05, 06 | Not started | [08](steps/08.md) |
| 09 | Contacts and emergency contacts | 05, 06 | Not started | [09](steps/09.md) |
| 10 | Guest management and attendance | 05, 06 | Not started | [10](steps/10.md) |
| 11 | Wedding decisions and inspiration | 05, 06 | Not started | [11](steps/11.md) |
| 12 | Vendors and service lifecycle | 06, 09 | Not started | [12](steps/12.md) |
| 13 | Budget and financial records | 06, 12 | Not started | [13](steps/13.md) |
| 14 | Documents, notes and secure files | 06, 09 | Not started | [14](steps/14.md) |
| 15 | Wedding-day schedule and offline snapshot | 08, 09, 14 | Not started | [15](steps/15.md) |
| 16 | Notifications, email and jobs | 02, 04, 06 | Not started | [16](steps/16.md) |
| 17 | Couple dashboard and global search | 08, 10, 11, 12, 13, 15 | Not started | [17](steps/17.md) |
| 18 | Planner dashboard, directory and templates | 07, 08, 12 | Not started | [18](steps/18.md) |
| 19 | Reports and exports | 13, 14, 16, 17 | Not started | [19](steps/19.md) |
| 20 | Privacy, retention and operational hardening | All prior applicable steps | Not started | [20](steps/20.md) |
| 21 | Release readiness and production launch | 01–20 | Not started | [21](steps/21.md) |

## Cross-cutting completion gate

Every step must preserve tenant isolation, authorization, approved private/shared scopes, accessibility, localization, data integrity, and auditability wherever relevant. Never claim release readiness merely because individual steps are checked. All nontrivial product conflicts are **Blocked — approval required**, not guessed.

## Implementation progress log

Add dated entries here for completed steps with PR/commit links, checks actually run, reviewer outcome and outstanding risks. Avoid copying the frozen product specifications into this file.

## Step-file contract

Each `docs/steps/NN.md` is a compact, self-contained work order with objective, approved behavior summary, dependencies, source pointers, in/out scope, deliverables, acceptance criteria, tests and a handoff log. It deliberately does **not** reproduce hundreds of detailed approved requirements. The agent must open only the relevant canonical source passages for exact rules. When a step touches multiple independently deliverable product areas, create child files `NN-a.md`, `NN-b.md` and link them here before assigning agents.
