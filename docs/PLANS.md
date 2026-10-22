# Wedding Planner — Development Plan

**Status:** Initial planning scaffold; milestones and technical choices require review and approval.

This is a work plan, not an additional product specification. The canonical product requirements and decision IDs live in `../Wedding-Platform-Product-Specification.md`. Consult the existing architecture document before selecting tools, libraries, infrastructure, or data models.

## Working rules
- One bounded feature or infrastructure task per Codex thread; keep follow-up fixes and review in that thread.
- Begin each task with a proposal and explicit acceptance criteria. Do not start significant implementation until approved.
- Prefer vertical slices with working tests over building entire modules in parallel.
- Record task status as Proposed, Approved, In progress, In review, Blocked, or Done.
- A task is Done only after relevant tests and review are completed; link its PR or commit when available.
- Mark unresolved decisions as **Decision required** instead of making assumptions.

## Milestone 0 — Foundations and decisions
- [ ] Locate, review, and confirm the architecture document and approved technology stack.
- [ ] Agree on repository structure, local setup, environment handling, and quality gates.
- [ ] Review product specification for MVP boundaries, critical dependencies, and unresolved decisions.
- [ ] Discuss and approve the design system separately; do not implement visual conventions prematurely.
- [ ] Define a small first vertical slice and its acceptance criteria.

## Milestone 1 — Application foundation
- [ ] Create the approved application structure and development scripts.
- [ ] Set up formatting, linting, type checking, and test tooling appropriate to the approved architecture.
- [ ] Set up CI and safe environment configuration.
- [ ] Establish authentication and authorization test strategy.

## Milestone 2 — Identity and wedding workspaces
- [ ] Implement approved account and invitation flows.
- [ ] Implement wedding creation and partner collaboration.
- [ ] Implement roles, memberships, and server-enforced workspace permissions.
- [ ] Verify isolation across weddings and planner organizations.

## Milestone 3 — Core planning vertical slices
Break these into separate, independently testable tasks based on the specification:
- [ ] Tasks and timeline
- [ ] Guest management and event-part attendance
- [ ] Wedding-day schedule and approved export/offline behavior
- [ ] Budget, quotes, payments, and due dates
- [ ] Vendors, comparisons, and decisions
- [ ] Contacts, documents, and notes

## Milestone 4 — Professional workflows and experience
- [ ] Couple dashboard and navigation
- [ ] Planner organization and team workflows
- [ ] Multi-wedding planner dashboard
- [ ] Organization vendor directory and reusable templates
- [ ] Basic inspiration scope, as approved

## Milestone 5 — Release readiness
- [ ] End-to-end critical journeys
- [ ] Permission and data-isolation audit
- [ ] Accessibility and responsive review against the approved design system
- [ ] Security, privacy, retention, backup/recovery, and migration review
- [ ] Performance, monitoring, and error handling
- [ ] Document known issues and obtain release approval

## Task template
**Task ID / title:**

**Status:** Proposed

**Product references:** Relevant specification sections and decision IDs

**Goal and user value:**

**In scope / out of scope:**

**Dependencies / decisions required:**

**Implementation proposal (after architecture review):**

**Acceptance criteria:**
- [ ]

**Tests and review evidence:**

**Files changed / PR:**

**Open risks / next task:**
