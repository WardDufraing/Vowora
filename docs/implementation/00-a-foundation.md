# 00-a marketing foundation

References: ARCH-004, ARCH-012, ARCH-024, ARCH-135; UI-001–004, UI-007, UI-009–014; VIS-004; FINAL-002–004. The marketing foundation is a representative public layout, not implementation of app workflows. Application journeys, permission states, tables, dialogs and charts remain future-task release gates.

## Tokens and components

`apps/marketing/app/globals.css` preserves every FINAL-003 core color. CSS semantic variables map to Tailwind theme roles with shadcn-compatible names (`background`, `foreground`, `card`, `primary`, `secondary`, `accent`, `muted`, `border`, `input`, `ring`); no additional component library is needed for this small native-control page. Popover surfaces use `card` / `card-foreground` when introduced.

| Additional token | Light | Dark | Use |
| --- | --- | --- | --- |
| primary-hover | #3B5348 | #C0D7C6 | Filled link hover |
| primary-active | #1C2C24 | #98B8A1 | Filled link press |
| link | #315A43 | #C0D7C6 | Underlined navigation |
| link-hover | #1C2C24 | #F1F5EF | Link hover |
| control-border | #52665A | #C0D2C3 | Meaningful native select boundary; core border remains decorative |
| selected / selected-foreground | secondary / foreground | secondary / foreground | Text selection |
| disabled / disabled-foreground | muted / muted-foreground | muted / muted-foreground | Reserved disabled pairing |
| success / success-surface | #245838 / #E8F3E9 | #B4DDBD / #193C26 | Reserved text + surface |
| warning / warning-surface | #735000 / #FFF4D6 | #F5D488 / #44351A | Reserved text + surface |
| destructive / destructive-surface | #9D2929 / #FFF0EF | #FFC1BA / #492A29 | Reserved text + surface |
| info / info-surface | #245374 / #EBF4FB | #B6D9F0 / #203B4D | Reserved text + surface |
| chart-1, chart-2, chart-3 | #293C35, #315A73, #805020 | #A9C5B0, #B6D9F0, #F5D488 | Reserved; future charts require text/pattern differentiation |
| overlay | #14211BCC | #07120ECC | Reserved; future overlays require rendered composite verification |

Reserved roles have no interactive widgets in 00-a and are not approved for arbitrary future combinations. Current checks compute token contrast for defined pairs and scan actual rendered content in both themes; unused overlay/chart/widget semantics still need verification when introduced. There is no blanket WCAG sign-off.

Native select, links and filled link provide hover/pressed/focus behavior, at least 44px control height, forced-colors outlines and reduced-motion rules. Semantic status text and labels must accompany future feedback; colors alone cannot convey meaning. Spacing follows a 4px base, with 8px control and 16px card radii. DM Sans and Cormorant Garamond are self-hosted through pinned font packages. Theme is System by default; explicit Light/Dark/System choice is stored only in browser local storage, with storage denial tolerated and pre-paint bootstrap. No account preference behavior is invented.

## Foundation gate

Implementer-authored Playwright checks cover computed color pairings, axe WCAG A/AA checks, keyboard skip/focus, System/explicit theme changes, reload persistence, blocked storage, 320–1440px reflow with 200% text, reduced motion and forced colors. 320px viewport represents 400% desktop reflow. Review evidence and commands will be recorded in the task handoff. Product feature screens cannot proceed before independent foundation review. A marketing-only representative layout does not satisfy the future authenticated application journey release gates.
