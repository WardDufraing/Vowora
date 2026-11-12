# 07-b Wedding planner assignment and fallback

## Delivered boundary

Either partner can invite one specific planner organization to a wedding with a deny-by-default, per-area `view`, `edit` and `download_export` ceiling. Invitations expire exactly 14 days after issuance. A UUID request key is bound to the normalized organization, ceiling and explicit reissue target: exact retries replay without duplicate audit/outbox facts, changed payloads conflict, and replacing a pending invitation is explicit. Partners can list and revoke their wedding's pending invitations. Organization owners and managers can list invitations addressed to their organization and accept or reject them. Cross-wedding, cross-organization and wrong-role operations fail without disclosing tenant data.

Acceptance atomically creates the active organization-to-wedding relationship, marks the invitation accepted and writes audit/outbox facts. A partial unique database invariant and serialized application checks enforce at most one active planner organization per wedding. Organization owners and managers may assign only active organization staff. Staff permissions are explicit and must be a subset of the couple ceiling; the organization can narrow access but cannot widen it. The derived wedding membership carries those exact overrides and uses the central organization and wedding authorization boundaries.

At most one active staff assignment is the optional lead. The fallback resolver returns the active, non-absent lead when eligible, then only active assigned organization owners or managers whose organization and wedding memberships remain active and whose couple restriction is not blocked. It never selects inactive, revoked, blocked or wrong-organization staff and never changes their permission set. A partner restriction immediately revokes the matching assignment and derived wedding membership. Revoking organization access immediately revokes all assignments and derived memberships and increments permission-scope versions, so cached authorization facts stop authorizing them.

Typed `/api/v1` contracts and OpenAPI describe partner invitation/list/revoke, organization accept/reject, staff assignment, couple restriction, lead absence and access revocation routes. The wedding settings invitation panel exposes all ceiling actions in English, Dutch, French and German with associated controls, live status and stable retry identity. The organization invitation screen provides localized accept/reject states. Milestone 16 delivery and 07-c private notes/handover are deliberately absent.

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
- The unit/component suite passed 62 files and 323 tests; focused contract and localized permission UI tests passed after final contract alignment.
- A disposable PostgreSQL instance passed eight integration files and 33 tests, covering 14-day expiry, stable replay, accept/reject authority, wrong organization denial, permission narrowing, lead fallback, absence, couple block and immediate derived membership revocation, access revocation and atomic audit/outbox facts.
- A separate clean disposable PostgreSQL instance passed seven migration journal and least-privilege grant tests. Drizzle metadata, generated schema drift and seven-file additive migration safety passed.
- The production web and marketing builds and production API/OpenAPI smoke passed.
- Playwright discovered all 28 Chromium cases, but this runtime had no browser binary and the pinned browser CDN returned HTTP 403. Hosted CI must run the existing responsive, keyboard, focus, axe, reflow, forced-color, large-text and target-size suite before owner approval.

All PostgreSQL use was local and disposable. The local container was removed after verification.

## Review and owner gate

A fresh read-only reviewer must inspect the complete draft PR head. Blocking, high or material-medium findings are fixed before requesting another fresh review where required. Hosted checks must be green before marking the PR ready. Only the owner may approve and merge; no agent deploys or changes external configuration.
