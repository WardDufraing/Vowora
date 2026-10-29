# 05-a semantic design foundation

Task 05-a establishes the application design-system foundation required before
feature screens. It does not implement the 05-b application shell or any
product workflow. The no-index `/design-system` route is a local/preview review
fixture with synthetic content and returns not found in production; existing
authentication behavior remains unchanged.

## Source alignment and scope

- Architecture: ARCH-015, ARCH-033 and ARCH-040.
- UI baseline: UI-001–035 and FINAL-001–004, with implementation focused on
  UI-002/003/004/007/009–018 and the FINAL-003/004 foundation gate.
- FINAL-001 remains fixed-grid, partner-specific ordering for later dashboard
  work; this task does not create a dashboard.
- FINAL-003 core light/dark values are preserved exactly. Remaining state
  values are accessibility-validated implementation decisions rather than
  silently substituted core colors.
- The application uses DM Sans for interface text and restrained Cormorant
  Garamond for the synthetic foundation hero. A 4px spacing scale, moderate
  radii, restrained elevation and 44px minimum interactive height implement the
  approved balanced density.
- Theme preference is Light, Dark or System with System as the default.
  Explicit choices use local browser storage under `vowora-app-theme`; no
  account-level synchronization is invented. A pre-render script applies a
  stored choice before body content, while System follows live OS changes.
- Marketing retains its existing independent footer preference and deployment
  boundary.

## Semantic inventory

`apps/web/app/globals.css` separates foundation palette values from semantic
aliases and maps the public aliases into Tailwind v4's `@theme` contract for
future shadcn-compatible components. Components consume semantic aliases only.

| Family | Semantic roles |
| --- | --- |
| Surfaces | `background`, `card`, `popover`, `muted`, `accent`, `overlay` |
| Content | `foreground`, surface foregrounds, `muted-foreground`, `link` |
| Controls | `primary`, `secondary`, ghost, destructive, hover, pressed, disabled |
| Interaction | `ring`, `input`, `control-border`, `selected` and selection foreground |
| Feedback | `success`, `warning`, `destructive`, `information` plus paired surfaces |
| Visualization | `chart-1`, `chart-2`, `chart-3` with non-color labels required |
| Foundation | responsive type, 4px spacing, control/card/overlay radii and two elevation levels |

Representative primitives cover underlined links, buttons, connected input
descriptions/errors, cards, text-labeled status badges, shared navigation and
live notification treatments, loading, an accessible Radix dialog, a semantic
table and its mobile record equivalent. Forced-colors and reduced-motion styles
preserve focus and meaning. Foundation-only atmospheric login, editorial
dashboard, refined list and immersive marketing examples appear in the fixture
without becoming the 05-b product shell or feature screens.

## Contrast matrix

Ratios are computed from the actual CSS values by
`apps/web/lib/theme-tokens.unit.test.ts`. Ordinary text pairs must be at least
4.5:1; meaningful focus, control and chart graphics must be at least 3:1.

| Actual pairing | Light | Dark | Threshold |
| --- | ---: | ---: | ---: |
| Body text / canvas | 11.01 | 15.08 | 4.5 |
| Surface text / card | 11.72 | 12.44 | 4.5 |
| Muted text / muted surface | 5.20 | 7.30 | 4.5 |
| Primary label / primary control | 11.72 | 8.95 | 4.5 |
| Secondary label / secondary control | 9.51 | 9.78 | 4.5 |
| Link / canvas | 7.38 | 10.91 | 4.5 |
| Success text / success surface | 7.29 | 8.17 | 4.5 |
| Warning text / warning surface | 7.58 | 8.28 | 4.5 |
| Destructive text / destructive surface | 7.77 | 8.25 | 4.5 |
| Information text / information surface | 7.36 | 7.90 | 4.5 |
| Focus ring / canvas | 6.09 | 10.61 | 3.0 |
| Control border / card | 6.16 | 8.65 | 3.0 |
| Chart series 1 / canvas | 11.01 | 8.95 | 3.0 |
| Chart series 2 / canvas | 7.70 | 11.22 | 3.0 |
| Chart series 3 / canvas | 6.40 | 11.60 | 3.0 |

These checks validate the listed actual pairings, not blanket WCAG conformance
for future screens. Disabled controls remain readable but are not represented as
available actions. Statuses include visible text/symbols and never rely on color
alone.

## Review evidence

Static review images:

- [Light wide foundation and representative layouts](assets/05-a/foundation-light.png)
- [Dark wide foundation and representative layouts](assets/05-a/foundation-dark.png)
- [Narrow mobile foundation and representative layouts](assets/05-a/foundation-mobile.png)

Browser checks cover Light/Dark/System behavior and persistence, axe scans of
the foundation and real authentication pages in both explicit themes,
persistent non-color link affordances, keyboard dialog Escape/focus return,
forced colors, reduced motion, narrow reflow, long-label resilience, a 200%
large-text equivalent, a 400% narrow viewport equivalent and 44px targets. The
screenshots are visual evidence only;
manual assistive-technology and real-device verification remain part of the
formal release gate.

Implementation commit `c8ef1f8` on `feat/05-a-semantic-tokens-themes` is in
[PR #35](https://github.com/WardDufraing/Vowora/pull/35). Before independent
review, formatting, lint, workspace types, 207 unit/component tests, four
tooling tests, 13 package-boundary tests, uncached builds, 11 application browser
checks and 26 marketing browser regressions passed. Independent review remains
pending. Rollback is a code/dependency revert. There is no schema, migration,
database grant, environment variable or external configuration change.

Initial fresh reviewer `/root/implement_05_a/review_05_a` found a high
color-only inline-link affordance after the Tailwind reset and a medium gap in
the FINAL-004 representative evidence. Persistent underlines plus real auth-page
axe regressions correct the link issue. Shared navigation/notification
primitives and explicit login/dashboard/list/marketing examples in the updated
light/dark/wide/narrow evidence correct the foundation-package gap. Fresh
independent re-review is pending.
