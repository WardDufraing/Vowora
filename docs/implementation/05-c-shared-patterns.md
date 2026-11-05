# 05-c shared forms, tables and localization

Task 05-c adds reusable interaction and localization foundations without adding
milestone 06 workflows. The product application now has complete English,
Dutch, French and German message catalogs, strict formatting contracts, shared
form feedback and confirmation primitives, and a responsive record view.

## Localization and date contracts

`apps/web/i18n/messages.ts` provides one typed `SharedPatterns` catalog for
each supported locale. `apps/web/lib/localization.ts` accepts only the exact
supported BCP 47 locale tags, validates IANA wedding timezones, keeps
`YYYY-MM-DD` calendar dates distinct from ISO instants, and formats instants in
an explicit wedding timezone. Request-level fallback is English. Invalid
locale, timezone, calendar date and instant values fail before formatting.

The next-intl request foundation deliberately defaults to English and
`Etc/UTC` until an owning workflow defines authoritative account locale and
wedding timezone persistence. This task does not add locale URL segments or
account preferences.

## Shared interaction patterns

- `FormField` binds labels, help, required state and inline validation to the
  actual control. `ErrorSummary` receives focus after invalid submission and
  links back to each field.
- `ConfirmationDialog` provides contextual text, Escape handling and focus
  return while leaving destructive-action rules to their future owning
  workflows.
- `ResponsiveDataView` renders a semantic sortable table and a mobile fact
  list from one record model. Selection and result counts remain synchronized.
- `ContextualState` distinguishes loading, empty, retryable error and
  permission-restricted views instead of using one ambiguous placeholder.
- Native date inputs retain keyboard access and expose localized browser input
  behavior while the submitted value remains a date-only contract.

These are presentation primitives. Callers must still authorize every loader
and mutation on the server; hidden or restricted presentation never grants or
proves permission.

## Preview and evidence

`/shared-patterns` is a no-index fixture with synthetic content. It is
available only outside production and returns not found in production.

- [Desktop light patterns](assets/05-c/shared-patterns-light.png)
- [Desktop dark patterns](assets/05-c/shared-patterns-dark.png)
- [Mobile German patterns](assets/05-c/shared-patterns-mobile-de.png)

Focused unit and component coverage verifies all four message catalogs,
fallback, plurals and long labels; leap days, DST transitions, year boundaries
and invalid inputs; error-summary focus and accessible descriptions; dialog
keyboard behavior; table sorting, selection and mobile fact parity; and all
truthful states. Browser coverage adds all locales, light/dark/system semantics,
axe, reduced motion, forced colors, 200% zoom and 400% reflow, 44px targets,
date keyboard access and screenshot evidence. The mobile suite starts at the
narrow breakpoint, changes sort order through the still-visible localized
control, compares every table/mobile fact, clears multiple selected records,
and runs axe against the German mobile list. Portaled dialogs carry the active
locale and return focus after Escape.

The complete verified baseline is formatting, workspace lint and types, 235
unit/component tests, 38 tooling and package-boundary tests, uncached preview
and production web builds, an uncached preview marketing build, 26 product
Chromium tests and 26 marketing Chromium tests. In the production build,
`/shared-patterns`, `/app-shell` and `/design-system` all return 404.

Rollback is a code and dependency-lock revert. The web app pins the same
`next-intl@4.14.9` already used by marketing. There is no schema, migration,
database grant, persistent-data, environment-variable, external-configuration
or deployment change.

Implementation is in
[PR #55](https://github.com/WardDufraing/Vowora/pull/55). Initial independent
reviewer `/root/continue_05_c/review_05_c` found four material gaps at
`5a60e10`: mobile sorting was hidden, the portaled dialog lost its locale,
selection had no clear action, and the mobile list used an invalid ARIA role.
The corrected implementation at `97ad5f9`, with browser coverage completed at
`3d4e942`, resolves all four. Different fresh reviewer
`/root/finalize_05_c/rereview_05_c` passed the complete corrected diff with no
blocking, high or material-medium findings and independently passed nine
focused unit/component tests, nine Chromium tests and the diff check.

The final Playwright-only commit exposed an unrelated expired fixed date in an
04-c database integration fixture. Separately reviewed
[PR #56](https://github.com/WardDufraing/Vowora/pull/56) made that test expiry
time-relative without changing production authorization. After the owner
merged #56, current `main` was merged cleanly into this branch at `2aa64d5`;
the reviewed 05-c code was unchanged. Post-integration checks passed 19 focused
tests, formatting and diff checks, and the hosted policy, secret scan,
marketing, disposable database and Vercel gates. Owner merge is required
before the task is Done.
