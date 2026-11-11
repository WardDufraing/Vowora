# 07-a Organization and staff memberships

## Delivered boundary

An authenticated account with a verified Better Auth email can create a planner organization. The server derives the actor from the session, requires a UUID idempotency key, rechecks the authoritative verified identity inside the transaction and creates an immutable first `owner` membership. The same actor may own multiple organizations. Exact retries return the original organization, while reusing a key for another name returns a conflict. Organization creation, owner membership, audit history and outbox capture commit atomically.

Organization memberships use the owner-approved `owner`, `manager` and `employee` roles. Owners and managers receive the centralized organization-private settings permission needed to list staff, issue or revoke invitations and deactivate non-owner staff. Employees receive only the approved organization-private view default. Every management operation resolves the authenticated actor's authoritative organization membership and permission-scope version through the central deny-by-default authorization boundary, then revalidates it inside the tenant transaction. Revoked memberships, forged organization IDs, stale scope versions and cross-organization records fail without exposing tenant data. The immutable owner cannot be deactivated; a manager also cannot deactivate themselves through the staff management flow.

Owners and managers can invite a verified-email recipient as a manager or employee. Each invitation receives a random 256-bit bearer token, but only its SHA-256 digest is stored. The durable outbox handoff contains a separate non-secret pending-invitation path, never the bearer token. Invitations expire exactly 14 days after issuance and record one reminder deadline three days before expiry. Reissue atomically replaces a pending token for the same email; revoke ends it immediately. An active or revoked organization member cannot be invited again through this flow.

Issuance requires a UUID idempotency key bound to the issuing actor, organization and normalized email/role/locale/reissue payload. Exact sequential and concurrent retries return the existing invitation without another audit or outbox event. Because raw bearer tokens are never persisted, a replay exposes only the verified-email pending path; a manager must choose the explicit reissue action to replace a token and receive a new one-time share link. Reusing a key for different input conflicts, and an ordinary new request cannot implicitly replace a pending invitation.

Acceptance requires an authenticated account, authoritative verified exact-email ownership and explicit confirmation. Bearer and pending-ID acceptance serialize under the invitation row lock, produce one membership under concurrent use and return an idempotent replay only to the same accepting actor. Expired, revoked, replaced, wrong-email and invalid capabilities use privacy-safe responses. Membership insertion, invitation acceptance, audit and outbox facts are atomic.

Typed `/api/v1` contracts and OpenAPI cover organization creation, staff listing and deactivation, invitation list/issue/revoke and bearer or verified-email pending acceptance. The creation, staff management and acceptance screens provide associated labels, deadlines, busy, success, empty and error states in English, Dutch, French and German. External email delivery is intentionally absent: milestone 16 owns Trigger.dev/Resend dispatch, retries and delivery tracking.

## Owner-approved onboarding policy

DEC-336 approves manager-controlled staff management but explicitly leaves detailed onboarding, manager roles and default permissions open. During 07-a the owner approved this controlled task policy:

1. Any authenticated email-verified account may create a planner organization and becomes its immutable first owner.
2. One actor may own multiple organizations.
3. Staff invitations expire 14 days after issue.
4. Owners and managers may revoke and reissue pending invitations.
5. One reminder is scheduled three days before expiry.

This approval is recorded in the task handoff and pull request. The frozen product sources were not edited.

## Migration, grants and rollback

Additive migration `0005_smooth_blur.sql` creates `organizations`, `organization_memberships` and `organization_invitations`, with UUIDv7 identities, exact actor/tenant uniqueness, lifecycle checks, digest uniqueness, idempotent creation and invitation-issuance keys, and reminder indexes. Foreign keys remain search-path relative so disposable isolated-schema verification and persistent targets resolve the intended schema.

The runtime role receives `SELECT`/`INSERT` on all three tables. It receives column-level membership updates only for status, permission-scope version, deactivation time and update time; invitation updates only for lifecycle status, accepted actor/time, revocation, replacement link and update time. It cannot change an organization, actor, role, permission overrides, invited email, token digest or deadlines, and receives no delete, truncate, schema mutation, journal or future-object privileges.

No persistent migration workflow, Neon database, provider configuration or deployment was accessed. After owner merge, the separate migration agent may apply and then separately verify `0005` on staging through the established protected workflow. Production remains untouched unless separately authorized. Do not run `pnpm test:database` against a persistent database.

Rollback before persistent apply is reverting or closing the pull request. After additive apply, leave the tables in place and stop using the routes; do not drop organization data in an emergency rollback.

## Verification

Executed locally with installed pinned binaries. The cloud fallback `pnpm` launcher attempted to create its store below the unwritable `/home/agent` path, so subprocess-based policy/boundary checks used a scoped `/tmp` command shim that called the already-installed pinned binaries. Hosted CI remains the canonical pnpm/Turbo gate.

- Prettier, workspace ESLint, root/package/web TypeScript, the production smoke test and both Next.js production builds passed.
- The final unit/component suite passed 60 files and 321 tests. Focused route coverage proves CSRF/session enforcement, explicit acceptance, actor/capability binding, replay, privacy-safe denial, tenant-scoped revocation, stable creation and invitation retry keys and protected self-actions.
- Quality/agent-policy passed 22/22 and package-boundary checks passed 16/16.
- A fresh disposable PostgreSQL 17 instance passed seven integration files and 31 tests, including verified bootstrap/idempotency, multiple ownership, exact deadlines, digest-only/token-free delivery, sequential/concurrent invitation-issuance idempotency, role boundaries, owner protection, cross-organization denial, explicit revoke/reissue, concurrent bearer/pending-ID acceptance and deterministic acceptance-versus-reissue serialization. A separate clean disposable instance passed all seven persistent journal and least-privilege grant tests. Both were removed.
- Drizzle metadata check, generated-schema drift and six-file additive migration safety passed.
- A production web build passed the OpenAPI smoke test. After rebuilding without an intentionally synthetic public Turnstile build key, all 28 Chromium tests passed, including existing keyboard, focus, axe, reflow, forced-colors, large-text and target-size coverage.

## Independent review and owner gate

Fresh read-only reviewer `/root/finalize_07_a/review_07_a` reviewed the complete first PR head `489592e`. It found no blocking or high issue and identified four material medium gaps: reissue could race acceptance, the creation UI changed its idempotency key after an ambiguous response, owner immutability was not a database invariant, and OpenAPI omitted required headers and implemented errors. It also found one low self-deactivation affordance.

The corrected implementation serializes acceptance and reissue on the organization lock, requires a successful pending-to-replaced transition, and includes a deterministic real-connection race regression. The creation UI keeps one key for an unchanged normalized payload. Migration `0005` now enforces one active immutable owner, with runtime-grant tests proving owner mutation and a second owner fail while manager deactivation succeeds. OpenAPI and contract assertions cover the header and errors, and the UI labels the current actor without offering a rejected self-action.

A subsequent fresh review confirmed those fixes and found three material medium gaps: invitation retries could invalidate the first token and duplicate delivery, the join audit subject used the actor ID, and 07-a granted an unapproved organization-vendor edit default. Invitation issue is now idempotent with explicit reissue separated from retry, join audit targets the inserted membership, and vendor editing fails closed for every 07-a role while the approved organization-private vendor view remains. Sequential/concurrent request, outbox-count, audit-subject, changed-payload and explicit-reissue regressions pass. A later delayed retry after acceptance, revocation or replacement now returns a conflict instead of manufacturing a stale action path; the client refreshes the authoritative pending list, including a concurrently reissued invitation.

The latest fresh review found that a definitive stale-retry conflict refreshed the pending list but retained the rejected request key, and that localized acceptance dropped the locale on its success destination. A `409` now retires the key after the authoritative refresh, so a later explicit submission receives a new key while ambiguous failures still retain their key. The acceptance destination now preserves the validated locale. Component regressions cover both corrections.

Different fresh final reviewer `/root/fix_07_a_stale_retry/review_07_a_retry_locale` independently reviewed corrected code head `13ee482` and found no blocking, high, material-medium or low findings. It passed diff integrity and 18 focused tests, confirmed every prior remedy remained intact, and observed passing policy, secret-scan, database-migration and Vercel checks; the combined workspace job was still running at review time. The owner alone may merge after final hosted checks. No agent executes the migration, deploys or changes external configuration.
