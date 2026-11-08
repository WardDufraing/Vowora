# 06-c Workspace switching and deep links

## Delivered boundary

Normal sign-in now continues to `/weddings`. The server loads only the authenticated actor's memberships. When the most recently opened membership is still active and unexpired, normal entry opens that wedding's Dashboard. If the most recently opened membership has been revoked or expired while another wedding remains accessible, the server returns only the accessible weddings and shows an explicit chooser instead of silently opening a different wedding. The chooser uses the same personal recent order, wedding name/date/role details, name search, no-results state and clear action as the shell switcher. An explicit chooser link never mutates personal recency.

Opening an accessible Dashboard records only that actor-membership's `last_opened_at`, then renders the shell from active, exact-actor memberships. Revoked, expired and other-actor memberships never enter the shell or chooser projection. Switcher and navigation links preserve the selected EN/NL/FR/DE locale, including localized destination, role, date, search and empty-state labels. Selecting the current wedding still closes the switcher without navigation or an unsaved-edits prompt.

The merged application-shell guard now has explicit regression coverage for an exact record URL in another accessible wedding. Stay preserves the current wedding, URL, form values and focus; a failed Save stays in place; a successful Save or Discard continues to the exact linked record rather than the ordinary switched wedding Dashboard. Browser Back and refresh protection continue to use the same guard.

Authenticated deep links distinguish only the two approved privacy states. A missing, revoked or expired wedding shows “This wedding is unavailable” and links to an explicit accessible-wedding chooser. An accessible wedding whose linked record is deleted, absent or outside the member's permission shows the same “This item is unavailable” state and links to that wedding's Dashboard. No record name, existence fact, permission reason, wedding identity or inaccessible membership detail enters either response. Concrete record readers arrive with their owning feature milestones; until then the generic record route fails closed to the item-unavailable state.

This implements DEC-661–677 and DEC-688–689 and preserves DEC-678–687 from the merged shell. ARCH-027–029 remain untouched because notification inbox, email delivery and retention work are outside workspace navigation.

## Persistence, migration and rollback

The existing `wedding_memberships.last_opened_at`, status and expiry columns are sufficient. The entry query first reads only the newest exact-actor membership's ID/status/expiry to decide redirect versus chooser, then separately selects active, unexpired accessible wedding projections. It never selects an inaccessible wedding's name or date. Opening a wedding reuses the existing least-privilege recency update and cannot mutate membership authority fields.

There is no schema file, Drizzle migration, runtime-grant change, persistent migration command or external configuration. No Neon database or migration workflow was accessed. Rollback before merge is closing the PR; after merge, revert the code change. There is no data rollback.

## Verification

Executed locally with the repository's installed pinned binaries because the cloud fallback `pnpm` launcher attempted to create its own store under the unwritable `/home/agent` path. Hosted CI remains the canonical pnpm/Turbo gate.

- Prettier check, root/package ESLint, root/web/package TypeScript, the production smoke test, both Next.js production builds, 22 policy tests and 16 package-boundary tests passed.
- The unit/component suite passed 50 files and 290 tests. New coverage includes normal entry, safe sign-in continuation, explicit chooser, inaccessible-last-opened behavior, localized recency-ordered entries, exact cross-workspace record URLs, current-workspace no-op, Save failure/success, Discard, Stay and privacy-identical unavailable-record states.
- A fresh disposable PostgreSQL 17 container bound to loopback passed all 23 database integration tests. The enhanced recency test proves that a revoked/expired newest membership forces the chooser, other actors never enter the projection, and a subsequently opened accessible wedding becomes the personal most recent entry. The container was removed.
- A production web build passed, followed by 28/28 Chromium tests. The new browser case covers the localized desktop switcher and exact record link with dirty edits and Stay. Existing axe, keyboard/focus, narrow reflow, 200% text and 44px-target checks continue to pass.

## Review and owner gate

Fresh independent review is pending. The PR stays draft until findings are resolved and hosted checks pass. The owner alone may merge; no agent deploys or executes migrations.
