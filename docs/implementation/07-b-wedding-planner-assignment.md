# 07-b Wedding planner assignment and fallback

## Delivered boundary

Either partner can invite one specific planner organization to a wedding with a deny-by-default, per-area `view`, `edit` and `download_export` ceiling. Invitations expire exactly 14 days after issuance. A UUID request key is bound to the normalized organization, ceiling and explicit reissue target: exact retries replay without duplicate audit/outbox facts, changed payloads conflict, and replacing a pending invitation is explicit. Partners can list and revoke their wedding's pending invitations. Organization owners and managers can list invitations addressed to their organization and accept or reject them. Cross-wedding, cross-organization and wrong-role operations fail without disclosing tenant data.

Acceptance atomically creates the active organization-to-wedding relationship, marks the invitation accepted and writes audit/outbox facts. A partial unique database invariant and serialized application checks enforce at most one active planner organization per wedding. Organization owners and managers may assign only active organization staff. Staff permissions are explicit and must be a subset of the couple ceiling; the organization can narrow access but cannot widen it. Assigning the same staff member again updates and reactivates the existing assignment and derived wedding membership, while explicit removal revokes both. Changing the lead clears the prior lead in the same transaction. The derived wedding membership carries those exact overrides and uses the central organization and wedding authorization boundaries.

At most one active staff assignment is the optional lead. The fallback eligibility resolver accepts a one-use central authorization capability for the authenticated current actor and the exact requested wedding area and action; it never accepts or returns an actor identifier. It reports lead eligibility only for the active, non-absent lead whose assignment grants the operation, then manager-fallback eligibility only for an active assigned organization owner or manager who grants the operation, whose organization and wedding memberships remain active and whose couple restriction is not blocked. It never authorizes inactive, revoked, blocked or wrong-organization staff and never changes their permission set. A partner restriction immediately revokes the matching assignment and derived wedding membership; lifting the block permits a later explicit organization reassignment but does not silently restore access. Revoking organization access immediately revokes all assignments and derived memberships and increments permission-scope versions, so cached authorization facts stop authorizing them. Deactivating organization staff locks the organization membership in the same access-then-membership order used by assignment and performs the same derived revocation across every wedding in that organization, so a racing assignment cannot survive deactivation.

Typed `/api/v1` contracts and OpenAPI describe partner invitation/list/revoke, organization accept/reject, privacy-minimized active-access projections, staff assignment/update/removal, couple restriction, lead absence and access revocation routes. The wedding settings panel exposes localized invitation ceilings, assigned staff, block/lift-block and organization revocation controls. The organization screen exposes localized assignment, permission narrowing, lead transfer and removal controls. Every route returns explicit response DTOs rather than database rows or internal token, fingerprint, account or scope-version fields. Milestone 16 delivery and 07-c private notes/handover are deliberately absent.

## Owner-approved controlled policy

The frozen source leaves several workflow choices open. The owner explicitly approved this task policy before implementation:

1. One active planner organization is allowed per wedding.
2. Either partner may invite a specific organization.
3. Invitations expire after 14 days; active organization owners and managers may accept or reject.
4. Partners may revoke or explicitly reissue pending invitations with stable idempotency.
5. Planner access begins deny-by-default. The couple explicitly grants per-area View, Edit and Download ceilings; the organization may narrow but never widen them.
6. There is at most one optional lead planner. When absent, fallback is limited to active eligible staff within the couple ceiling.

This approval is recorded here, in the task brief and in the pull request. `docs/product/*` was not edited.

## Migration and runtime grants

Additive migration `0006_cynical_hannibal_king.sql` creates wedding organization invitations, active accesses, staff assignments and couple restrictions. Partial unique indexes enforce one pending invitation per wedding, one active organization per wedding and one active lead per access. Lifecycle, expiry and absence checks fail closed. Foreign keys are search-path relative so isolated disposable-schema verification resolves the intended schema.

The runtime manifest grants only exact table and column operations needed by the domain services. Immutable tenant, actor, invitation, ceiling and issuance identity columns cannot be rewritten through runtime grants. The migration journal advances through the existing Drizzle migration runner; builds do not run migrations.

No Neon or persistent database was accessed. Do not run `pnpm test:database` against persistent databases. After owner merge, the separate migration agent may run the protected workflow against staging with the direct migration connection, then separately verify journal state and runtime grants. Production requires the workflow's additional production confirmation and separate authorization.

Rollback before persistent apply is reverting or closing the PR. After additive apply, stop using the routes and retain the tables; do not destructively drop wedding access history during incident response.

## Verification

The implementation was verified with pinned local binaries:

- Prettier, workspace ESLint, package/web TypeScript, policy/quality (22/22), package boundaries (16/16), production builds and API smoke passed.
- The corrected unit/component suite passed 70 files and 352 tests. Route regressions cover CSRF, authenticated tenant scope, validation, stable request identity, conflict privacy, privacy-minimized active-access reads, access revocation, staff restrictions, absence/return, assignment update and removal. Component and contract tests cover payload-bound retry identity, pending invitation revoke and explicit reissue, authoritative block and lead-transfer reconciliation, lead-only absence controls, localized area/action labels and the complete couple and organization management controls.
- A fresh disposable PostgreSQL instance passed eight integration files and 33 tests, covering 14-day expiry, stable replay, accept/reject authority, invitation lifecycle constraints, wrong-organization restriction denial, permission narrowing, lead transfer, current-actor and operation-aware fallback, forged cross-tenant identities, absence, couple block, a deterministic assignment/deactivation race, organization staff deactivation across weddings, immediate derived membership revocation, access revocation and atomic audit/outbox facts.
- A separate clean disposable PostgreSQL instance passed seven migration journal and least-privilege grant tests. Drizzle metadata, generated schema drift and seven-file additive migration safety passed.
- The production web and marketing builds and production API/OpenAPI smoke passed.
- Playwright started the production server and discovered all 28 Chromium cases, but this runtime had no browser binary; the pinned browser CDN had previously returned HTTP 403. No browser case executed locally. This limitation is recorded rather than reported as a pass.

All PostgreSQL use was local and disposable. The local container was removed after verification.

## Review and owner gate

The initial fresh reviewer blocked draft PR #67 because organization deactivation did not revoke derived wedding access, assignment/removal/lead lifecycle and management UI were incomplete, APIs exposed persistence fields, fallback ignored the requested area/action, restrictions did not validate exact-organization staff, route coverage and payload-bound UI idempotency were incomplete, runtime grants were broader than required, area labels were untranslated and hosted TypeScript exposed an incomplete database test schema boundary.

The first corrected implementation closed each initial finding. A fresh corrected-head review then found that the fallback interface still accepted raw database/access/actor identity, organization deactivation did not lock membership against a racing assignment, invitation and lead-absence lifecycle controls were missing from the UI, block and lead-transfer state could remain stale, invitation lifecycle states lacked a database check and several OpenAPI responses had drifted from runtime behavior.

This correction replaces fallback enumeration with a one-use central current-actor authorization capability, proves privacy-safe cross-tenant failure, and serializes assignment with organization deactivation in a deterministic two-connection regression. It adds pending invitation revoke/explicit reissue, lead-only absence/return and authoritative access reconciliation, a fail-closed invitation lifecycle database check, and runtime-aligned response contracts. A different fresh read-only reviewer must inspect the complete corrected diff. Hosted checks must be green before marking the PR ready. Only the owner may approve and merge; no agent deploys, runs a persistent migration or changes external configuration.
