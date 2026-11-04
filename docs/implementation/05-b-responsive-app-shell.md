# 05-b responsive application shell

Task 05-b adds the shared, permission-aware application shell without adding
future feature screens. The shell presents a desktop sidebar and contextual
header, a mobile bottom navigation and More panel, wedding context, account and
appearance controls, breadcrumbs, and an accessible main-content landmark.

## Authorization and navigation model

`apps/web/lib/workspace-navigation.ts` is the server-owned presentation
boundary. It accepts an already-resolved actor, current membership, available
memberships and permission evaluation, validates every membership with the
04-a domain parser, and derives the destinations and workspace choices that a
client may render. A current, exact-wedding, active and unexpired membership is
required. Invalid, revoked, expired, cross-actor and cross-wedding inputs fail
with the same privacy-safe denial. Available workspaces are similarly filtered
from exact authoritative membership facts and ordered by most recently opened.

The shell never treats a hidden link as authorization. Feature loaders and
mutations must continue to use the 04-b server authorization boundary for every
direct or deep-link request. The preview demonstrates the same denial contract
by returning not found when a requested destination is absent from the derived
model.

The destination order and grouping implement DEC-655–689. The permission map
uses the existing 04-a areas and actions. `inspiration` is added as a first-class
permission area because DEC-303 and DEC-679 require permission-aware Inspiration
navigation. Reports and exports appear only when at least one downloadable or
exportable area exists. Workspace settings remain limited to partner authority.

## Responsive and accessible behavior

- At desktop widths, the approved destination order appears in the sidebar,
  with workspace context above and settings/collapse controls below. The
  contextual header contains breadcrumbs, appearance and account controls.
- At mobile widths, Dashboard, Timeline and up to two permission-ranked primary
  destinations appear before More. More contains every remaining allowed
  destination and closes with Escape while returning focus to its trigger.
- Multiple available weddings expose a searchable workspace chooser. Selecting
  the current wedding closes the chooser without navigation; another wedding
  uses its server-derived dashboard link. One wedding remains a static label.
- The root skip link moves keyboard focus to the main region. Navigation and
  disclosure controls have visible focus, semantic landmarks and at least 44px
  targets. Narrow reflow, long labels, safe-area insets, forced colors, reduced
  motion and Light/Dark/System themes retain the approved 05-a semantics.

The actual multi-wedding switching workflow, including unsaved-edit handling
and destination-preserving transitions, belongs to 06-c after authoritative
persistence exists. Global workspace search belongs to 17-c. This task only
provides the shell-level wedding chooser described above.

## Preview and evidence

`/app-shell` is a no-index fixture with synthetic memberships and content. It is
available only outside production and returns not found in production, like the
05-a design-system fixture. Production integration remains closed until tasks
06 and 07 provide authoritative loaders and feature routes.

- [Desktop light shell](assets/05-b/app-shell-desktop-light.png)
- [Desktop dark shell](assets/05-b/app-shell-desktop-dark.png)
- [Mobile shell](assets/05-b/app-shell-mobile.png)

The current-main-integrated implementation was verified with formatting,
workspace lint and type checking, 226 unit/component tests, 22 tooling tests,
16 package-boundary tests, uncached preview builds for both applications, a
production web build, 17 application Chromium tests and 26 marketing Chromium
tests. The 28 focused
navigation and shell tests cover exact membership status, tenant isolation,
permission-filtered order, workspace filtering/search, direct-link denial,
desktop/mobile keyboard behavior and semantic output. Browser coverage adds
axe checks, focus return, skip-link focus, narrow and 200% large-text reflow,
long labels, theme switching, overflow and 44px target checks. Production
requests to `/app-shell` and `/design-system` both returned 404.

Rollback is a code and dependency revert. There is no schema, migration,
database grant, environment variable, persistent-data, external configuration
or deployment change. The shell reuses the repository's pinned
`lucide-react@1.63.0` version for its approved icons.

Implementation and current-main integration are in
[PR #54](https://github.com/WardDufraing/Vowora/pull/54). Initial fresh reviewer
`/root/continue_05_b/review_05_b` found four material medium gaps: the mobile
primary order followed desktop order, More did not retain an active indication,
the collapsed rail hid wedding identity, and duplicate current-membership facts
could display a role different from the authorized membership. It also found
that mobile users could not reach the appearance control. The correction adds a
separate approved mobile order, a visible and semantic More current state, a
compact wedding icon/title for single and multiple workspace rails, derives the
current role from the authorized membership, and exposes the synchronized
Light/Dark/System control in More with a distinct control id. Unit, component,
browser and screenshot evidence covers each correction. Different fresh
re-review is pending, so the pull request remains draft.
