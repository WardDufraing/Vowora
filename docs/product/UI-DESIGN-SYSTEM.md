# Vowora — UI Design System

> Status: Visual direction approved — UI-001 through UI-035 and VIS-001 through VIS-004 approved; dashboard reconciliation approved (FINAL-001 B); Balanced Botanical color treatment approved (FINAL-002 B); core semantic palette approved (FINAL-003 B); FINAL-004 B foundation-first handoff approved; remaining state tokens and accessibility verification pending
> Scope: Visual language, interaction presentation, reusable UI patterns, and design quality requirements.
> Product behavior: `./Wedding-Platform-Product-Specification.md`
> Technical architecture: `./product-architecture.md`

## 1. Purpose

This document will become the canonical visual design reference for Codex once approved. It must not override product requirements, permissions, or architecture. Unapproved proposals are explicitly marked as such.

## 2. Approved technical and quality constraints

- Use Tailwind CSS, shadcn/ui, Radix primitives, and centralized semantic design tokens (ARCH-040).
- Support light and dark themes with semantic CSS variables (ARCH-077).
- Target WCAG 2.2 AA; verify keyboard and screen-reader usability, including manual checks (ARCH-033, ARCH-063).
- Use accessible shared form, table, calendar, and navigation primitives consistent with the architecture.
- Support responsive screens and relevant loading, empty, error, validation, success, disabled, and permission-restricted states.
- Use `next-intl` for localization and locale-aware formatting (ARCH-015, ARCH-078).

## 3. Design decision status

| ID | Topic | Status |
| --- | --- | --- |
| UI-001 | Overall visual direction and brand personality | Approved — C: Modern SaaS with Elegant Touches |
| UI-002 | Primary and accent color palette | Approved — A: Sage & Forest Green |
| UI-003 | Typography and type scale | Approved — C: Modern Sans + Elegant Serif |
| UI-004 | Spacing, density, radii, shadows | Approved — B: Balanced & Refined |
| UI-005 | App navigation and shell | Approved — Custom: collapsible sidebar, workspace switcher, contextual header, grouped modules |
| UI-006 | Couple and planner dashboard visual composition | Approved — C: Hybrid Dashboard |
| UI-007 | Tables, cards, forms, dialogs, and feedback patterns | Approved — B: Refined SaaS Components |
| UI-008 | Mobile/tablet adaptation | Approved — C: Hybrid Bottom Navigation + Full Menu |
| UI-009 | Motion, illustrations, iconography | Approved — C: Subtle Motion + Selective Decoration |
| UI-010 | Dark theme and theme-switching presentation | Approved — B: Deep Forest Dark Mode; Light/Dark/System with System default |
| UI-011 | Color token architecture | Approved — B: Full Semantic Design Tokens |
| UI-012 | Typography scale and responsive hierarchy | Approved — B: Balanced Responsive Type Scale |
| UI-013 | Spacing, radius, and elevation tokens | Approved — B: Balanced 4px-Based Scale |
| UI-014 | Layout containers, breakpoints, and grid behavior | Approved — C: Adaptive Container System |
| UI-015 | Form layouts, validation, and multi-step editing presentation | Approved — C: Contextual Editing |
| UI-016 | Data tables, filtering, and row interactions | Approved — B: Advanced Data Tables with Contextual Details |
| UI-017 | Loading, empty, error, and success states | Approved — B: Contextual & Actionable Feedback |
| UI-018 | Status indicators, badges, and visual priority | Approved — B: Semantic & Restrained Status System |
| UI-019 | Confirmation dialogs and destructive actions | Approved — B: Risk-Based Confirmation System |
| UI-020 | Notification placement and persistence | Approved — B: Context-Aware Notification System |
| UI-021 | Navigation feedback and wayfinding | Approved — B: Contextual Wayfinding |
| UI-022 | Search and command discovery presentation | Approved — B: Global Search with Categorized Results |
| UI-023 | Tabs, accordions and progressive disclosure | Approved — B: Contextual Progressive Disclosure |
| UI-024 | Mobile presentation of complex records and detail views | Approved — C: Adaptive Mobile Record Views |
| UI-025 | Mobile navigation and action placement in record views | Approved — C: Contextual Sticky Actions |
| UI-026 | Dashboard card interactions and customization presentation | Approved — A, refined by FINAL-001 B: fixed grid with personal card ordering |
| UI-027 | Dashboard card content hierarchy and quick-action presentation | Approved — B: Actionable Summary Cards |
| UI-028 | Dashboard progress indicators and data visualization | Approved — B: Subtle Progress Bars and Selective Charts |
| UI-029 | Timeline and schedule visual presentation | Approved — B: Adaptive Timeline Views |
| UI-030 | Calendar navigation and date selection presentation | Approved — B: Contextual Date Selection |
| UI-031 | Forms, validation, and multi-step editing presentation | Approved — B: Structured Forms with Inline Validation |
| UI-032 | Empty-state presentation and onboarding guidance | Approved — B: Helpful Contextual Empty States |
| UI-033 | Search and filter interaction patterns | Approved — B: Contextual Search and Filter Toolbar |
| UI-034 | Record selection and bulk action presentation | Approved — B: Contextual Selection Toolbar |
| UI-035 | Record detail information hierarchy and sections | Approved — B: Structured Overview with Contextual Sections |
| VIS-001 | Login screen visual composition — paired light/dark explorations | Approved — C: Atmospheric & Immersive |
| VIS-002 | Main dashboard visual composition — paired light/dark explorations | Approved — B: Editorial Wedding Dashboard |
| VIS-003 | List views visual composition — paired light/dark explorations | Approved — B: Refined Editorial Lists |
| VIS-004 | Marketing page visual composition — paired light/dark explorations | Approved — B: Immersive Botanical |
| FINAL-001 | Dashboard customization conflict reconciliation | Approved — B: Fixed Grid, Personal Card Ordering |
| FINAL-002 | Final light/dark color treatment | Approved — B: Balanced Botanical |
| FINAL-003 | Core semantic palette and remaining-token validation policy | Approved — B: Approve Core Palette, Validate Remaining Tokens |
| FINAL-004 | Accessibility and Codex handoff gate | Approved — B: Foundation First, Then Implement |

## 4. Approved visual direction

### UI-001 — Modern SaaS with Elegant Touches (Option C)

- Design for efficient, modern productivity workflows, with subtle warmth and elegant wedding-appropriate details.
- Keep information-dense professional planner experiences clear and practical, while allowing a welcoming tone for couples.
- Avoid making the interface primarily romantic/pastel, luxury-editorial, or purely austere; those are not the selected overall direction.
- UI-001 does not approve any specific colors, fonts, spacing values, component styling, or navigation patterns; those remain separate decisions.

### UI-002 — Sage & Forest Green (Option A)

- Use a natural, calm, sophisticated palette built around sage green, deep forest green, warm ivory, and restrained neutral surfaces.
- Forest green should provide the stronger brand anchor; sage should supply softer accents and supporting UI treatments. Maintain a modern SaaS feel rather than a botanical or heavily decorative wedding theme.
- Use warm off-white or ivory for light-theme backgrounds and surfaces, with readable dark text.
- Candidate reference swatches from the approved direction: forest `#293C35`, sage `#789587`, soft neutral `#E9EDE7`, ivory `#F8F8F5`. These are **visual starting points, not final implementation tokens**.
- Final semantic roles (primary, accent, surface, text, border, focus, status), hover/pressed states, contrast-adjusted shades, and dark-theme equivalents require further specification and accessibility validation.
- Do not interpret UI-002 as approval for per-wedding custom accent colors; the chosen option is the fixed Sage & Forest Green direction.

### UI-003 — Modern Sans + Elegant Serif (Option C)

- Use **DM Sans** as the primary interface typeface for navigation, dashboards, forms, tables, labels, buttons, and other functional UI.
- Use **Cormorant Garamond** as a restrained secondary display serif for selected celebratory headings and wedding-specific moments where elegance improves the experience.
- Do **not** use the display serif for dense data, form controls, table contents, small labels, or operational planner workflows.
- Preserve legibility and hierarchy across languages and screen sizes; provide appropriate fallback fonts and avoid layout shifts when fonts load.
- Exact font weights, line heights, sizes, responsive type scale, and font-loading implementation remain to be specified. The secondary serif is an approved stylistic direction; Cormorant Garamond is the initial candidate, subject to testing for readability and language coverage.

### UI-004 — Balanced & Refined (Option B)

- Use comfortable, consistent spacing with clear grouping and generous enough padding for readability without wasting space in data-heavy views.
- Prefer moderately rounded corners for cards and controls, rather than sharp enterprise-style edges or highly pill-shaped containers everywhere.
- Use subtle elevation and shadows sparingly to communicate layering; rely primarily on surface contrast, borders, and spacing for hierarchy.
- Keep cards, forms, and dashboard widgets calm, orderly, and approachable for both couples and professional planners.
- Maintain useful information density in tables and operational workflows; a dedicated compact table mode may be considered later but is **not** approved as a global adaptive-density system.
- Exact spacing scale, radius values, shadow tokens, component dimensions, and breakpoint-specific density rules remain to be defined and tested.

### UI-005 — Custom navigation shell (Approved)

- **Sidebar:** Use a desktop sidebar with readable icons and labels when expanded. Allow users to collapse it to an icon rail; provide accessible labels/tooltips and a clear expand control in collapsed mode. Do not assume automatic collapse by viewport is the selected desktop behavior.
- **Workspace switcher:** Provide a clear switch between **Wedding** and **Organization** workspaces for authorized users. Wedding-specific modules and organization-level planner tools must remain contextually distinct. Do not expose organization navigation to users without access. The switcher must not imply any new permissions or product capabilities.
- **Contextual header:** Include contextual breadcrumbs, search access, notifications, and account controls where supported by the product specification. Clearly identify the current context and active page. Search scope and notification behavior must follow the product specification, not be invented here.
- **Grouped module navigation:** Organize wedding modules into clearly labeled, logical groups rather than one long flat list. Example grouping labels such as Planning, People, and Finances are illustrative and must be reconciled with the actual approved module inventory before implementation.
- Preserve the user's location in the navigation hierarchy, provide clear active/hover/focus states, and ensure keyboard/screen-reader usability.
- Mobile and tablet navigation follows the separately approved UI-008 hybrid pattern.
- Exact dimensions, collapse persistence, switcher placement, sidebar ordering, and header interaction details remain implementation/design follow-ups subject to the approved architecture and product workflows.

### UI-006 — Hybrid Dashboard (Option C)

- Combine a warm, personalized welcome and wedding countdown with structured, actionable dashboard cards. Keep the welcome concise so key information remains immediately accessible.
- On the **couple dashboard**, prioritize approved overview content such as task progress and next priorities, budget status, guest progress, countdown, milestones, decisions, and quick actions, subject to permissions and available data in the product specification.
- On the **professional planner dashboard**, use the same typography, color tokens, card treatments, and hierarchy, but favor scannable multi-wedding portfolio summaries, actionable alerts, and organizational workflows that are explicitly supported by the product specification.
- Favor a clear hierarchy: context/welcome, high-value summary metrics, then actionable priorities and supporting details. Avoid an undifferentiated wall of equally weighted cards.
- Apply the UI-004 balanced density: comfortable spacing and moderate radii; professional views may show more information without becoming a separate visual design system.
- Respect previously approved dashboard customization and access rules. This visual decision does not create new metrics, actions, permissions, or a fixed widget inventory.
- Handle loading, empty, error, partial-data, and permission-limited states without fabricated counts or misleading progress values.
- Exact widget arrangement, grid breakpoints, card dimensions, chart styles, and personalization controls remain follow-up design details, not implicitly approved by this decision.

### UI-007 — Refined SaaS Components (Option B)

- Use a cohesive, accessible component system with clear visual hierarchy, moderate corner rounding, restrained elevation, and purposeful borders. Follow the approved UI-002 palette, UI-003 typography, and UI-004 spacing direction.
- **Buttons:** Establish distinct primary, secondary, tertiary/ghost, and destructive treatments. Primary actions should be visually prominent without using saturated accent colors indiscriminately. Provide consistent hover, focus-visible, pressed, loading, and disabled states; do not communicate state by color alone.
- **Forms:** Use persistent, legible labels, concise supporting text, clear validation and error messages, and predictable spacing. Inputs, selects, checkboxes, radios, and date controls must have visible focus and accessible target sizes. Follow the approved product workflows and validation rules.
- **Cards and surfaces:** Prefer subtle borders and limited shadow for hierarchy. Use moderate radii, consistent internal spacing, and descriptive headings; avoid excessive nesting or decorative elevation.
- **Tables and dense data:** Keep headers, alignment, row separation, filtering/sorting affordances, selection, and action controls legible. Allow denser professional workflows where needed without introducing an unrelated component style. Exact table interactions must match approved product requirements.
- **Dialogs, menus, and dropdowns:** Use consistent surface treatments and accessible keyboard/focus behavior. Destructive and irreversible actions require appropriately clear confirmation patterns where specified by product rules.
- **Statuses and feedback:** Use restrained semantic status colors, icons/text labels where useful, and distinguish success, warning, error, neutral, and in-progress states. Include loading, empty, disabled, validation, and permission-restricted states. Never rely on color alone.
- Implement through the approved Tailwind CSS, shadcn/ui, Radix, and semantic-token architecture. Do not invent features, statuses, data fields, or permission rules based on illustrative mockups.
- Exact token values, component measurements, and interaction microdetails remain to be specified or validated; this approval establishes the **component styling direction**, not a complete component API.

### UI-008 — Hybrid Bottom Navigation + Full Menu (Option C)

- **Mobile:** Use a persistent bottom navigation bar for a small number of high-frequency destinations and a clearly labeled **More** destination opening the complete grouped module menu. Example destinations (Home, Tasks, Guests, More) are illustrative; actual destinations must reflect approved product modules and user permissions.
- **Complete menu:** Preserve the logical groups established by UI-005. Users must be able to reach all authorized wedding modules and, where applicable, switch to the Organization workspace without cluttering the bottom bar.
- **Context:** Keep the current wedding or organization context visible and provide an accessible way to change context. Maintain contextual page titles and essential actions on narrow screens; avoid copying the entire desktop header into a cramped mobile toolbar.
- **Tablet:** Retain the desktop-style sidebar where usable at the available width; otherwise use an appropriate compact navigation treatment. Breakpoint values are not yet approved and must be tested against content, not chosen arbitrarily.
- **Responsive content:** Stack dashboard cards appropriately; adapt complex tables through accessible horizontal scrolling or focused row-detail presentations without losing data, actions, or context. Avoid simply shrinking desktop controls or hiding required functionality.
- **Interaction and accessibility:** Account for safe areas, virtual keyboards, touch target sizing, visible active/focus states, screen-reader labels, and predictable back/close behavior. Ensure the bottom bar does not obscure content or primary actions.
- **Consistency:** Reuse UI-002 colors, UI-003 typography, UI-004 spacing, UI-007 component styles, and the approved workspace/permission model. Do not introduce a separate mobile visual identity or new product capabilities.
- Exact bottom-nav destinations, breakpoint widths, tablet collapse rules, More-menu presentation, and persistence behaviors remain detailed design follow-ups, not implicitly approved by this choice.

### UI-009 — Subtle Motion + Selective Decoration (Option C)

- Use consistent **Lucide outline icons** for functional navigation, actions, statuses, and interface affordances. Keep icon weight, sizing, and alignment coherent across wedding and organization workspaces.
- Apply gentle, purposeful transitions to hover, focus, expanding/collapsing navigation, menus, dialogs, and other state changes. Motion should clarify interaction rather than draw attention to itself.
- Keep animations brief and unobtrusive. Never delay essential actions, navigation, form submission, or critical feedback for decorative effects.
- Reserve tasteful wedding-related illustrations or decorative motifs for appropriate onboarding, empty states, and celebratory moments; avoid decorative clutter in budgets, tables, guest lists, and professional planner workflows.
- Avoid frequent animated illustrations, excessive parallax, bouncy effects, and persistent decorative motion.
- Honor `prefers-reduced-motion` with reduced or removed nonessential animation while preserving understandable state changes and feedback.
- Decorative graphics must not convey essential information on their own; functional icons need accessible labels when meaning is not otherwise expressed in text.
- Specific durations, easing curves, icon dimensions, illustration assets, and celebratory triggers remain implementation details requiring validation; this decision does not authorize new product events or features.

### UI-010 — Deep Forest Dark Mode (Option B); System Theme Default

- Provide **Light**, **Dark**, and **System** theme preferences, with **System** selected by default. System follows the device/OS color-scheme preference; an explicit Light or Dark selection overrides it.
- Use a **deep forest-green dark appearance** rather than neutral black or warm brown: green-black page backgrounds, muted forest surfaces, legible light text, restrained borders, and lighter sage accents. Preserve the same visual identity and component hierarchy as the approved light theme.
- Candidate dark reference colors from the selected direction: background `#151F1B`, raised surface `#22312A`, border `#385044`, primary text `#F1F4EF`, secondary text `#B7C8BC`, and sage accent `#789587`. **These are visual starting points, not final semantic tokens or verified accessible combinations.**
- Apply semantic theme tokens to navigation, cards, controls, tables, overlays, status indicators, charts, and focus states. Do not hard-code light-only colors into components.
- Theme preference must remain consistent across authorized Wedding and Organization workspaces. Respect OS preference changes while System is active; persist explicit user choice using the approved application preference architecture without inventing new account settings or synchronization rules.
- Prevent disruptive theme flashes during initial rendering where feasible. Verify contrast and distinguishability in both themes to WCAG 2.2 AA; never use color alone for status or meaning.
- Theme choice does not change product permissions, data, available actions, or workflows. Exact semantic tokens, control placement, persistence scope, and theme-switch transition behavior remain detailed implementation follow-ups.

### UI-011 — Full Semantic Design Tokens (Option B)

- Establish a centralized **semantic token system** for both light and dark themes, implemented with CSS custom properties and mapped into the approved Tailwind CSS / shadcn/ui architecture. Components must reference semantic roles, not arbitrary palette hex values.
- Define foundational palette values separately from semantic aliases so the approved Sage & Forest Green identity can be adjusted for contrast without requiring per-component edits.
- Cover semantic roles for **page and raised surfaces, foreground and muted text, borders and dividers, primary/secondary/ghost/destructive controls, focus rings, interactive states, status feedback, overlays, and data visualizations/charts**.
- Define appropriate foreground/background pairs and hover, active, disabled, selected, and focus-visible treatments. Validate actual rendered color combinations against WCAG 2.2 AA; status and chart distinctions must not rely on color alone.
- Apply the same token vocabulary across Wedding and Organization workspaces and across responsive layouts. Dark mode uses its own semantic values, following UI-010's Deep Forest direction.
- Do **not** introduce separate module-specific accent palettes or user-customizable theme colors: UI-011 selected B, not C or D.
- Reference swatches in UI-002 and UI-010 remain **candidates**, not final validated token values. Exact token names, values, contrast-adjusted variants, and chart series palettes are follow-up implementation-ready design decisions.

### UI-012 — Balanced Responsive Type Scale (Option B)

- Establish a **single responsive typography hierarchy** for both Wedding and Organization workspaces, using the approved DM Sans interface family and selective Cormorant Garamond display treatment from UI-003.
- Use comfortable, legible body text, clearly differentiated page/section/card headings, readable form labels, and appropriately prominent key metrics. Preserve the approved Balanced & Refined density from UI-004.
- Scale headings responsively so mobile titles do not crowd controls or wrap awkwardly; keep body copy and interactive labels readable on narrow screens rather than indiscriminately shrinking everything.
- Reserve larger expressive or serif display text for limited wedding-specific welcome, onboarding, or celebratory contexts. Functional navigation, data tables, forms, financial information, and operational planner screens remain in DM Sans.
- Maintain consistent semantic heading levels, font-weight hierarchy, line-height, text wrapping, and accessible zoom/reflow behavior across languages and screen sizes.
- Do not create separate global type scales for couples and planners (option D was not selected); professional views may achieve appropriate density through layout and component patterns without changing typography rules.
- **Exact rem sizes, weight assignments, line heights, breakpoints, and token names remain to be finalized** in implementation-ready design tokens. Example previews are directional, not pixel-accurate specifications.

### UI-013 — Balanced 4px-Based Spacing, Radius & Elevation Scale (Option B)

- Use a **4px base spacing unit** with a coherent token scale for micro-gaps, control padding, card padding, section spacing, and page gutters. Avoid arbitrary one-off measurements.
- Follow the approved **Balanced & Refined** density: comfortable default whitespace without oversized gaps or excessively compact controls.
- Use **moderately rounded** controls and cards, with a consistent radius hierarchy for inputs/buttons, cards, menus, and dialogs; avoid making pill shapes or oversized radii the universal default.
- Use **restrained elevation**: borders and subtle surface separation for ordinary cards, slightly stronger layering for popovers/dropdowns, and clearly separated modal overlays. Shadows should communicate hierarchy, not decoration.
- Keep spacing and shape consistent across Wedding and Organization workspaces and in both light and dark themes. Dense data views may use suitable table-specific layouts without creating an independent global design system.
- Preserve accessible touch targets, focus rings, zoom/reflow, and responsive spacing; exact measurements must not compromise accessibility.
- **Exact spacing token names, pixel values, radius steps, shadow definitions, and component dimensions remain implementation-level follow-ups.** The option approves the scale and density philosophy, not a particular arbitrary set of values.

### UI-014 — Adaptive Container System (Option C)

- Use a **shared adaptive layout system** across Wedding and Organization workspaces. Container width should respond to the content and task, rather than applying a single maximum width to every page or expanding every page to full screen width.
- Use **readable, constrained containers** for forms, settings, notes, explanations, and overview content where overly long lines or sprawling layouts reduce clarity.
- Allow **expanded content containers** for large guest lists, budgets, schedules, timelines, comparisons, and planner portfolio views where additional horizontal space improves usability.
- Establish consistent responsive gutters, grid columns, alignment, and spacing based on the approved 4px spacing foundation (UI-013); preserve the contextual header and sidebar/bottom-navigation shell (UI-005/UI-008).
- Adapt card and dashboard grids to available space without forcing horizontal overflow. Wide tables may use intentional scrolling or approved responsive row/detail patterns, with clear labels and accessible controls.
- Keep the same container vocabulary for couples and professional planners; choose a container by **content needs**, not by creating separate global workspace layout systems.
- **Exact maximum widths, breakpoint values, gutters, grid column counts, and page-to-container mappings remain implementation-ready follow-up decisions.** Preview proportions are illustrative rather than pixel-accurate specifications.

### UI-015 — Contextual Editing (Option C)

- Use **contextual editing** as the default presentation strategy, choosing the editing surface according to complexity and the need to preserve the user's current context.
- Use accessible **dialogs** for short, focused changes and confirmations; use **side panels/sheets** for editing a record alongside a list, comparison, or other context; use **full pages** for complex, lengthy, multi-section, or multi-step workflows.
- On narrow mobile viewports, adapt side panels to accessible full-screen editing views when needed. Do not compress complex forms into narrow drawers.
- Present visible field labels, required/optional indicators where appropriate, field-level validation, actionable error messages, and clear save/cancel controls. Preserve focus order, keyboard operability, and screen-reader announcements.
- Handle unsaved changes deliberately: warn before losing edits when appropriate, show pending/saving/saved/error states, and never imply data was saved before confirmation.
- Keep editing consistent across guests, tasks, budget items, vendors, and wedding settings, while deferring exact fields, permissions, validation rules, autosave behavior, and workflow semantics to the approved product specification.
- Do **not** impose modal-first editing, full-page-only editing, or spreadsheet-style inline editing as the universal pattern. Bulk and inline operations require separate product support and design specification.
- **Exact dialog/sheet widths, field spacing, breakpoint thresholds, and form component specifications remain implementation-level follow-ups.**

### UI-016 — Advanced Data Tables with Contextual Details (Option B)

- Use **advanced, accessible data tables** for record-heavy workflows such as guests, budgets, vendors, and planner portfolios, consistent with the approved product capabilities and permissions.
- Present clear table titles and relevant controls for **search, sorting, filtering, and pagination** where the product specification supports them. Show active filters visibly and offer a clear way to remove or reset them.
- Use readable column headings, consistent numeric and date alignment, restrained row separators, legible status labels, and distinct hover, keyboard-focus, selected, disabled, and loading states. Never rely on color alone.
- Use **contextual detail panels** for inspecting or editing records while retaining the surrounding table, in accordance with UI-015. Opening and closing details should preserve supported search terms, filters, sorting, pagination, and scroll context when feasible.
- Make row actions discoverable and keyboard-accessible; distinguish opening a record from invoking a row action. Avoid accidental edits or destructive actions from row clicks.
- On narrow screens, use an intentional mobile record-list/detail presentation or accessible horizontal scrolling when comparison requires columns. Do not simply shrink desktop tables until content becomes unreadable.
- Provide understandable empty and no-results states, filter feedback, error/retry states, and appropriate bulk-action affordances **only where the product specification authorizes those actions**.
- Do **not** assume spreadsheet-style inline editing, arbitrary column customization, saved views, bulk editing, or additional product-specific statuses merely because the table system can support them.
- Exact row heights, table density options, toolbar layouts, breakpoint transitions, column widths, and interaction specifications remain implementation-ready follow-up decisions.

### UI-017 — Contextual & Actionable Feedback (Option B)

- Apply **contextual, actionable feedback** consistently to loading, empty, no-results, error, saving, and success states throughout couple and planner workspaces.
- Prefer **layout-matched skeletons** for loading content where useful, with accessible progress announcements and no misleading impression that data has loaded. Use appropriate progress indicators for operations whose duration or progress can be communicated accurately.
- Design **empty states** to explain what is missing, why the view is empty, and the most relevant next action when authorized. Distinguish first-use empty states from filtered no-results states; the latter should help users inspect or clear supported filters.
- Present **errors** in plain language, preserving user input and context when feasible. Offer retry or recovery actions only where the approved product behavior and architecture support them; avoid inventing automatic retries or persistence guarantees.
- Communicate **save and success states** clearly but unobtrusively. Never display success before an operation is confirmed. Use inline feedback for field/form context and brief notifications for suitable non-blocking outcomes; do not rely solely on disappearing toasts for critical information.
- Use **selective illustrations and celebration**, consistent with UI-009, primarily for onboarding, meaningful milestones, and appropriate empty states. Avoid decorative interruptions in routine operational workflows.
- All states must remain readable in light/dark themes, be keyboard and screen-reader accessible, respect reduced-motion preferences, and convey meaning beyond color or icon alone.
- Preserve approved permissions, validation, retry semantics, notification behavior, and data lifecycle rules from the product specification; this decision governs **presentation**, not new functionality.
- Exact skeleton patterns, notification placement/duration, copywriting conventions, and per-component state specifications remain implementation-level follow-ups.

### UI-018 — Semantic & Restrained Status System (Option B)

- Use a **semantic, restrained status language** across tasks, guest confirmations, budget/payment states, deadlines, and planner workflows. Status text is the primary source of meaning; icons and semantic color support recognition without replacing labels.
- Keep routine and informational states visually calm with neutral surfaces, typography, and restrained indicators. Reserve stronger warning, danger, and success emphasis for states that genuinely merit attention; avoid flooding tables and dashboards with colorful badges.
- Use consistent semantic design tokens for **success, warning, danger, and information**, with light/dark variants and accessible foreground/background contrast. Do not use raw, module-specific status colors outside the centralized token system approved in UI-011.
- Match indicator prominence to **urgency and consequence**, not merely the presence of a status value. Avoid unnecessary alert banners or attention-grabbing badges for ordinary progress.
- In dense tables, prefer compact readable status labels with optional meaningful icons; use badges selectively when they improve scanning. Keep row text, status labels, and actions legible at responsive widths.
- Never communicate a status by **color, shape, or icon alone**. Preserve explicit text, accessible names, focus states, and non-color differentiation; do not rely on transient messages for critical status information.
- Use only the **actual statuses, urgency rules, permissions, and workflows** defined in the canonical product specification. UI-018 changes visual presentation, not the underlying status model or business rules.
- Exact status-to-token mappings, badge dimensions, icon selection, and per-module presentation details remain implementation-level specifications subject to accessibility review.

### UI-019 — Risk-Based Confirmation System (Option B)

- Match confirmation friction to **risk, reversibility, impact, and the approved product rules**. Avoid a blanket confirmation dialog for every minor action, but do not silently perform consequential or irreversible operations.
- For destructive actions requiring confirmation, use a focused, accessible dialog with a **specific action title**, plain-language consequences, a clearly differentiated destructive action, and a safe cancel/keep option. Use explicit object names where helpful and permitted.
- Give the safe choice an understandable label (for example, “Keep guest”) rather than ambiguous wording. The destructive control must name the action (for example, “Delete guest”); do not rely on red color alone to signal risk.
- Reserve stronger warnings and, where justified, typed confirmation for particularly high-impact, irreversible, or broad-scope operations. Do not impose typed confirmation on ordinary record edits or every deletion.
- Where a reversible action genuinely supports undo under the product specification, a lightweight undo affordance may be used instead of a blocking confirmation. Never imply an undo is possible unless it is supported.
- Warn before discarding unsaved changes when they would be lost; distinguish discarding local edits from deleting persisted records.
- Apply accessible dialog behavior: descriptive accessible name, keyboard focus management, Escape/cancel where safe, visible focus, mobile-friendly sizing, and appropriate handling of pending, success, and failure states.
- **Product specification is authoritative** for whether an action is allowed, whether it archives or permanently deletes, retention windows, required approvals, recovery, and permission checks. This UI decision changes only presentation and interaction patterns, not those business rules.
- Exact risk classification and per-action confirmation copy remain follow-up design details; Codex must not infer new deletion semantics from illustrative examples.

### UI-020 — Context-Aware Notification System (Option B)

- Choose the **feedback surface based on the message’s purpose, urgency, scope, and need for persistence**, not a universal toast-first or banner-first rule.
- Use **brief, non-blocking toasts** for confirmed routine successes and low-risk action results. Do not claim completion while a save or server action is still pending, and do not rely on ephemeral toasts for consequential information.
- Show **inline validation and contextual errors** next to the relevant field, form, or action; explain the problem in plain language and provide an actionable recovery path where the product permits one.
- Use **persistent page- or section-level banners** for important issues that remain relevant until resolved, acknowledged, or no longer applicable. Make critical failures discoverable after any transient message disappears.
- Use the **existing notification center** for approved updates that users may need to revisit, subject to the canonical product specification's notification triggers, permissions, visibility, delivery, and retention rules. Do not create new notification types or delivery channels through this UI decision.
- Distinguish pending, successful, partial, and failed operations accurately; avoid contradictory messages when different parts of an operation have different outcomes. Preserve entered data and context when recovering from errors where technically and product-wise appropriate.
- Apply the semantic, restrained visual language from UI-018; ensure messages have readable text, accessible announcement behavior, keyboard-operable actions, appropriate dismissal, and sufficient contrast in both themes. Avoid stacking or repeatedly firing duplicate notices.
- This decision specifies **presentation and placement only**. Exact toast timing, stacking, banner thresholds, notification-center views, and per-module copy remain follow-up implementation specifications, constrained by approved product behavior and architecture.

### UI-021 — Contextual Wayfinding (Option B)

- Clearly distinguish the **active destination** in desktop sidebar, collapsed icon rail, mobile bottom navigation, and full mobile menu using consistent active styling, text or accessible names, and icons where relevant. Do not depend on color alone.
- Present **contextual breadcrumbs** on deeper or ambiguous routes where they genuinely aid orientation; avoid repetitive breadcrumb trails on simple top-level pages. Use concise, consistent page titles and headings.
- Keep the **current Wedding or Organization workspace** visible in the existing workspace switcher and ensure navigation labels, headings, and breadcrumbs reflect the selected authorized context. Never suggest access to destinations outside the user's permissions.
- Preserve useful **navigation context** when moving between lists, record details, and contextual editing surfaces, consistent with UI-015 and UI-016 and the approved product behavior; avoid unnecessary resets of searches, filters, or view position where feasible.
- On smaller screens, retain clear current-location feedback in the approved **hybrid bottom navigation and full menu**; keep labels understandable, touch targets accessible, and deep navigation discoverable without introducing an additional permanent navigation layer.
- Support keyboard focus, screen-reader current-page indication (such as `aria-current` when appropriate), and sufficient light/dark contrast. Active and focus states must be distinguishable.
- Do **not** introduce new modules, routes, sidebar categories, contextual panels, or permission behavior via this decision. Exact breadcrumb rules, navigation labels, and route mappings remain implementation details governed by the product specification.

### UI-022 — Global Search with Categorized Results (Option B)

- Provide a **discoverable global search entry point** in the approved contextual application header. On activation, present a clear search interface with **categorized results** where supported by the canonical product specification.
- Scope queries and displayed results to the **current authorized Wedding or Organization workspace** and the user's effective permissions. Never expose restricted, private, or cross-wedding information through results, suggestions, counts, previews, or navigation.
- Show understandable **result categories, primary labels, and location/context cues** to help users distinguish records. Only include entities and searchable fields already supported by the product requirements and implemented search capabilities; examples do not authorize broader indexing.
- Retain **module-level search and filtering** for detailed work in guest lists, budgets, tasks, vendor views, and other approved modules. Global search complements rather than replaces their filters.
- Make the search entry and results **keyboard and touch accessible**, with visible focus, sensible screen-reader labels, an explicit empty/no-results state, and responsive presentation on mobile. A shortcut hint may be displayed only when the shortcut is actually implemented and does not conflict with other controls.
- Selecting a result should open its **authorized destination** with appropriate workspace context. Search must not introduce new routes, cross-workspace access, command execution, or unapproved quick actions.
- This decision approves **visual presentation and navigation behavior**, not a new product-wide search backend or expanded search scope. Exact categories, ranking, query semantics, shortcuts, and data retention remain subject to product/architecture approval.

### UI-023 — Contextual Progressive Disclosure (Option B)

- Keep **essential information, primary actions, required fields, and critical warnings visible by default**. Never conceal required steps or important errors in collapsed sections.
- Use **tabs** to distinguish genuinely separate views of an approved record or workflow, not to fragment closely related information arbitrarily. Tabs must have clear, concise labels, a visible selected state, and accessible keyboard navigation.
- Use **accordions/disclosures** for optional, secondary, or supporting details that users may expand as needed. Provide a clear affordance, meaningful headings, appropriate expanded/collapsed announcements, and persistent context when appropriate.
- Prefer **visible, logically grouped sections** for core content that users need to review together. Avoid excessive nesting of tabs within accordions or vice versa, and avoid adding persistent secondary navigation solely to organize a single screen.
- On mobile, adapt tab overflow and disclosure layout without clipping labels, hiding required actions, or creating inaccessible horizontal navigation. Respect the approved responsive containers and contextual editing patterns (UI-014 and UI-015).
- Preserve relevant selection and expansion state while users work within a screen when feasible, without exposing restricted data. Empty, loading, validation, and permission states must remain understandable within the chosen structure.
- Tabs, accordions, and sections may only organize **existing approved features, fields, views, and permissions**. Illustrative vendor/guest/settings examples do not authorize new subpages, record fields, or modules. Exact screen groupings remain subject to screen-level design review.

### UI-024 — Adaptive Mobile Record Views (Option C)

- Adapt **information-heavy lists and records to the mobile task and available width**, rather than forcing every desktop table into a horizontal scroller or turning every record into an oversized card. Follow the shared responsive system approved in UI-014.
- For mobile guest lists, task lists, vendor records, and similar collections, use **compact, scannable record summaries** that prioritize identifying information, essential status, and the most useful approved attributes. Display further details on demand; do not omit access to approved fields or actions.
- **Preserve a responsive table or carefully indicated horizontal scrolling** where side-by-side column comparison is essential, particularly for financial or operational data. Maintain readable values, column associations, and accessible sorting/filtering; never shrink type or touch targets solely to fit more columns.
- Open record details and editing in **mobile-friendly full-screen views or equivalent accessible presentations** when desktop side panels would be too narrow, consistent with UI-015. Provide a clear close/back path, preserve unsaved-change safeguards, and return users to their previous list position, search, filters, and selection where feasible.
- Keep **search, filtering, status meaning, and permitted row actions discoverable** on narrow screens. Prefer clear labels and accessible controls over icon-only actions when their meaning would be ambiguous.
- Respect safe areas, mobile navigation, text zoom, keyboard appearance, touch-target requirements, screen-reader reading order, and both light/dark themes. Avoid clipped content, hidden focus, and interactions that depend solely on hover.
- Mobile adaptations change **presentation, not permissions or business behavior**. Retain access to all product-approved data and actions, including attendance combinations, guest-group counts, and financial details where applicable. Example data in UI mockups is illustrative only and must not be interpreted as approved new statuses or fields.

### UI-025 — Contextual Sticky Actions (Option C)

- Position **creation actions near the relevant list or page heading** (for example, adding a guest), ensuring that the action remains discoverable when the heading scrolls away through appropriate contextual affordances where needed. Do not mandate a floating action button on every screen.
- Position **record-level actions near the associated record**, using accessible labels, touch targets, and overflow controls when space is constrained. Only show actions permitted by the product specification and the user's role.
- For mobile editing forms, use a **reachable sticky footer for primary save and secondary cancel/discard actions when useful**, especially on longer forms. Keep the action labels explicit and distinguish saving, pending, failure, and success states according to UI-017 and UI-020.
- Account for **device safe areas, the on-screen keyboard, browser chrome, and the approved mobile bottom navigation**. Sticky actions must never overlap content, validation messages, keyboard focus, or navigation; add appropriate scroll padding and bottom spacing.
- Avoid persistent action bars when no relevant action is available, when they crowd short screens, or when the user is reading rather than editing. Keep the primary action visually dominant without introducing unnecessary competing buttons.
- Maintain **keyboard, screen-reader, and touch accessibility**, including logical focus order, minimum target sizes, zoom support, and clear unsaved-change safeguards (UI-015 and UI-019).
- This decision governs **action placement and presentation only**. It does not authorize new actions, changes to persistence, permission rules, or new mobile-specific features.

### UI-026 — Fixed Dashboard Grid, refined by FINAL-001 B

- Preserve a **fixed, responsive grid system** with consistent card sizes, columns, spacing, visual hierarchy, and predefined default ordering. This retains the UI-026 A preference for a predictable, polished dashboard rather than a freeform widget canvas.
- **FINAL-001 B explicitly reconciles the original UI-026 A conflict:** each partner can reorder the cards on their own dashboard without changing the other partner's order. The grid structure and card sizes remain fixed; no arbitrary positioning or freeform resizing.
- Offer an explicit **Arrange dashboard** mode with reorder controls; keep these controls out of ordinary browsing mode. Provide accessible keyboard-operated move-up/move-down controls as well as any optional pointer-based drag interaction, with understandable feedback and a clear exit.
- Maintain logical responsive reading and focus order. Personal order must remain meaningful on desktop and mobile; preserve the user's arrangement in accordance with the canonical product specification and established account/data rules.
- Planner dashboards may use their approved distinct data and workflows. Do not infer new organization-level customization or permissions from partner-specific ordering.
- Continue to enforce permission-scoped cards, loading/empty/error states, semantic light/dark styling and readable, actionable summaries.
- **Decision history:** UI-026 originally selected A (completely fixed placement); FINAL-001 B subsequently amended only the ordering restriction. The earlier contradiction with the canonical product requirement is now resolved for the UI design specification.

### UI-027 — Actionable Summary Cards (Option B)

- Dashboard cards should combine **one prominent headline metric or meaningful summary**, a concise descriptive label, supporting context, and a clear next step **only where an approved action or destination exists**. Do not invent metrics, actions, or routes.
- Use **subtle progress indicators** only when an approved, reliable numerator/denominator or progress model exists. Accompany every visualization with readable text or an accessible equivalent; never convey meaning through color alone.
- Keep cards **scannable and consistent**: heading and optional restrained icon at the top, primary value with units/context in the main area, supporting detail beneath, and an unobtrusive action at the bottom when useful. Avoid turning summary cards into dense mini-pages.
- Prioritize **meaningful and accurate data** over decorative charts. Explain unknown, zero, empty, unavailable, loading, and error states rather than showing misleading values or fabricated progress.
- Apply the approved semantic typography, spacing, elevation, light/dark tokens, and responsive layout rules. Ensure accessible links/buttons, keyboard focus, screen-reader labels, and sufficient contrast.
- Use the same visual language for couple and professional-planner dashboards while respecting their distinct approved cards, permissions, and data scope.
- **FINAL-001 reconciliation:** The fixed grid supports personal partner-specific card ordering; card content remains unchanged.

### UI-028 — Subtle Progress Bars and Selective Charts (Option B)

- Present straightforward completion and confirmation metrics with **restrained progress bars** alongside clear textual values (for example, completed/total and percentage) when reliable approved data supports that calculation. Do not infer completion from unrelated statuses.
- Use **charts selectively**, only when a comparison, breakdown, or trend is approved by the product specification and communicates information more clearly than text or a simple table. Do not add new analytics, historical tracking, or data collection through a UI decision.
- Prioritize **readable numbers, units, labels, and source context**; always provide an accessible textual or tabular equivalent to visualized information. Never rely solely on color, bar length, or animation.
- Apply consistent semantic chart and progress tokens in light and dark mode, with contrast validation, distinguishable categories, and restrained decoration. Avoid gratuitous 3D effects, dense legends, or misleading visual scales.
- Clearly represent **zero, unknown, unavailable, loading, empty, and error states** without invented percentages or fabricated values. Only show a percentage when its denominator and calculation are defined.
- Keep dashboard visualizations compact and scannable, with deeper detail in the relevant approved module where available. Maintain responsive layouts and screen-reader/keyboard accessibility.
- Preserve the **UI-026 open conflict** regarding fixed dashboards versus the canonical product requirement for partner-arrangeable dashboards; UI-028 does not resolve it.

### UI-029 — Adaptive Timeline Views (Option B)

- Use a **clear chronological vertical timeline** as the primary everyday and mobile presentation for planning milestones, task deadlines, and wedding-day schedule entries where appropriate; group by meaningful date, phase, or time without hiding approved information.
- Provide **more detailed time-scaled views only where the approved workflow needs duration, ordering, or overlap comparisons**. Display accurate start/end times, duration, and time zone context when available; never invent times or imply unsupported scheduling capabilities.
- Adapt to screen size and purpose: scannable mobile timelines with prioritized details, richer desktop schedule views where useful, and readable print/offline/PDF outputs as required by the product specification.
- Use consistent time labels, date formats, visual connectors, and restrained semantic indicators. Convey status, conflicts, and ordering through text or accessible equivalents rather than color or position alone.
- Ensure keyboard navigation, screen-reader reading order, focus visibility, reduced-motion support, and adequate touch targets. Keep editing, permissions, filtering, and exports aligned with already approved product behavior.
- Define legible empty, loading, error, unscheduled, and partially specified time states. Do not create calendar integrations, notifications, analytics, or other new product features through this visual decision.
- Preserve the **UI-026 open conflict** between fixed dashboard layout and the canonical product requirement for partner-specific dashboard arrangement; UI-029 does not resolve it.

### UI-030 — Contextual Date Selection (Option B)

- Use **context-specific date controls** rather than a universal calendar-first workspace: accessible date pickers for individual fields, clear date/time entry for precise scheduling, and relevant quick-period selections for approved filters and reporting workflows.
- Offer a calendar popover or mobile-friendly date-selection surface when it improves usability, but retain **direct keyboard entry** and an understandable, localized date format; avoid requiring month-by-month navigation for distant dates.
- Show fixed or relative period shortcuts **only where those filter choices are already approved**. Where supported, make custom ranges clear, show both endpoints, and validate ordering and completeness without silently changing values.
- Respect the selected locale and relevant time-zone context; distinguish dates from date-times, and avoid ambiguity around daylight-saving transitions. Do not invent date constraints, time-zone features, or scheduling capabilities.
- Support keyboard, screen-reader, touch, focus, error, disabled, empty, and clear/reset states. Mobile selection must remain usable with the on-screen keyboard and must not overlap sticky actions or bottom navigation.
- Preserve the adaptive timelines of UI-029 and the product specification's existing scheduling, filtering, export, and permission rules. **No new calendar workspace or integration is authorized by this visual decision.**
- Apply **FINAL-001 B**: fixed grid structure with independent partner card ordering; UI-030 does not resolve it.

### UI-031 — Structured Forms with Inline Validation (Option B)

- Organize approved fields into **clear, logically named sections** with a comfortable vertical rhythm and predictable label, input, helper text, and action placement. Use multi-column groupings only where readable and appropriate; collapse gracefully to a single column on small screens.
- Clearly identify required and optional fields without assuming new mandatory fields. Use persistent, associated labels and concise contextual guidance; never rely on placeholder text as the only label.
- Show **specific field-level validation messages** adjacent to the relevant control, using accessible descriptions and error semantics. Provide an actionable form-level summary when multiple errors make it useful, with focus/navigation to the first issue.
- Validate at appropriate moments without disruptive error flashes while users are still entering data. Preserve entered values and user context after validation or submission errors; distinguish client validation from failed saves and permission errors.
- Use the previously approved contextual editing surfaces: dialogs for small changes, side panels for contextual editing, full pages for complex forms, and accessible full-screen editing on mobile. Use multi-step flows only where the approved workflow genuinely warrants them, not for ordinary guest, task, or budget entry.
- Keep save, cancel, loading, disabled, unsaved-change, and recovery feedback consistent with UI-015, UI-017, UI-019, UI-020, and UI-025. Sticky mobile actions must respect safe areas, keyboard, and bottom navigation.
- Meet WCAG 2.2 AA interaction expectations, including keyboard operation, visible focus, screen-reader announcements, error association, and appropriately sized targets. Respect approved product field schemas, validations, permissions, and persistence behavior; **this is a presentation decision, not a change to product rules**.
- Apply **FINAL-001 B**: fixed grid structure with independent partner card ordering; UI-031 does not resolve it.

### UI-032 — Helpful Contextual Empty States (Option B)

- Use **helpful, contextual first-use empty states** for approved modules such as guests, tasks, vendors, documents, and budget items. Present a restrained icon or optional lightweight illustration, a clear heading, one or two concise sentences describing the module's purpose, and a prominent authorized next action when one exists.
- Make first-use guidance **specific to the current module and user's permissions**. Do not offer creation buttons or instructions for actions the user cannot perform; instead explain the relevant access limitation without leaking restricted data.
- **Differentiate state types explicitly:** a truly empty module, zero results after searching/filtering, a permission-restricted view, an unavailable/failed data load, and a loading state must not share misleading copy or actions. For zero filtered results, provide a relevant clear-filter or adjust-search action where supported; for failures, show recovery/retry where approved.
- Keep guidance concise and dismissible only if the approved workflow supports dismissal. Avoid mandatory onboarding tours, artificial setup checklists, sample records presented as real data, or any additional product functionality through this UI decision.
- Apply a consistent visual language using semantic tokens, balanced spacing, accessible text, and optional understated iconography. Ensure mobile-friendly layout, keyboard access, visible focus, screen-reader clarity, and adequate contrast; do not rely on decoration alone.
- Preserve the established contextual feedback system of UI-017 and UI-020, as well as the approved product rules for module availability, invitations, permissions, and data creation.
- Apply **FINAL-001 B**: fixed grid structure with independent partner card ordering; UI-032 does not resolve it.

### UI-033 — Contextual Search and Filter Toolbar (Option B)

- Use a **consistent, contextual search and filter toolbar** for approved data-heavy module views, including guests, tasks, vendors, budgets, and planner portfolios, tailored to each module's authorized search, filter, and sorting capabilities.
- Keep the module-level search field readily discoverable, with a clearly labeled filter control, sort control where supported, and a visible result count when available. Do not imply unsupported search scopes or sorting modes.
- Display active filters as readable, removable chips or equivalent compact indicators, with a **Clear all** action when multiple filters are active and clearing is supported. Provide understandable labels and avoid color-only communication.
- On mobile, adapt the toolbar to available width and open advanced filters in an accessible sheet or full-screen view where needed. Make Apply, Cancel, Reset, and dismissal behavior clear; preserve draft versus applied filters appropriately and avoid obstructing bottom navigation, safe areas, or the keyboard.
- Preserve search/filter/sort context when navigating to record details and returning, where supported by the approved workflow. Clearly distinguish an empty dataset from zero matches due to active filters, in line with UI-032.
- Maintain the distinction between **global categorized search** (UI-022) and **module-level search**; do not merge their scopes or expose restricted data. All results and controls must respect the user's current permissions and the canonical product specification.
- Meet WCAG 2.2 AA expectations for labels, keyboard and screen-reader interaction, focus management, status announcements, and touch target sizes. This choice is a **presentation decision only** and does not authorize new filter fields, saved views, backend search behavior, or product functionality.
- Apply **FINAL-001 B**: fixed grid structure with independent partner card ordering; UI-033 does not resolve it.

### UI-034 — Contextual Selection Toolbar (Option B)

- Where **bulk actions are explicitly supported by the canonical product specification**, provide discoverable record-selection controls in desktop tables and adaptive mobile record views. Keep selection affordances contextual rather than a permanently dominant toolbar; individual record actions remain available.
- When one or more records are selected, display a **contextual selection toolbar** with an accurate selected-record count, a clear way to cancel/clear selection, and only the bulk operations authorized for the user's role and selected record types.
- Make selection scope unambiguous, especially when filters, sorting, pagination, or virtualized lists are active. Distinguish selected visible records from any wider selection; never silently interpret “select all” as selecting records outside the clearly communicated scope.
- Place the toolbar near the selection context on desktop and in a reachable, safe-area-aware position on mobile. Avoid overlap with bottom navigation, sticky actions, content, or the on-screen keyboard; keep actions operable at narrow widths.
- Provide keyboard-operable checkboxes or equivalent accessible controls, explicit selected/unselected states, visible focus, meaningful screen-reader announcements of selection counts, and touch targets consistent with WCAG 2.2 AA.
- Respect **UI-019 risk-based confirmation** for destructive or consequential bulk operations and **UI-020 feedback** for outcomes, including partial failures where the approved workflow supports them. Do not promise a bulk operation succeeded before it is confirmed.
- This is **presentation only**: do not introduce bulk-edit, bulk-delete, mass-invite, or other capabilities absent from the approved product specification. Permission checks and data boundaries apply to both selection and action execution.
- Apply **FINAL-001 B**: fixed grid structure with independent partner card ordering; UI-034 does not resolve it.

### UI-035 — Structured Overview with Contextual Sections (Option B)

- Present a **concise record summary first**, followed by clearly labeled, logically grouped sections for the record's approved data and actions.
- Use a prominent record heading, useful identifying context and permission-appropriate actions; surface essential status or summary information without requiring users to expand secondary content.
- Use **tabs only for genuinely distinct views** and collapsible sections for optional or secondary information, consistent with UI-023. Do not hide critical information or required actions behind unexplained controls.
- Respect UI-015 contextual editing: small edits may use dialogs, context-sensitive details may use side panels, and complex workflows may use full pages; mobile details and editing must remain readable and accessible.
- Adapt the hierarchy to guests, tasks, vendors, and budget items without implying identical fields or introducing new record capabilities. Keep relevant actions, labels and permission boundaries faithful to the product specification.
- Provide keyboard-operable navigation, visible focus, appropriate headings and tab semantics, responsive layouts, and WCAG 2.2 AA contrast. Retain list/search/filter context on return where supported.
- **FINAL-001 resolved UI-026:** retain fixed grid structure with independent partner card ordering; UI-035 changes no card behavior.

### VIS-001 — Atmospheric & Immersive Login (Option C)

- **Approved visual reference:** Atmospheric & Immersive, with the same recognizable composition in both light and dark themes. This is a visual direction, not an approval of additional authentication behavior.
- Use layered forest/sage surfaces and a restrained botanical or floral motif to create a wedding-specific atmosphere; keep the actual sign-in form the clear functional focal point.
- **Light:** warm ivory and softly layered sage-green backgrounds, a pale botanical feature panel, high-contrast forest headings, and a crisp neutral form surface.
- **Dark:** deep forest background with subtly differentiated green layers, muted sage botanical accents, and a dark elevated form surface with legible text and field borders.
- Keep the sign-in controls clear, keyboard accessible, touch-friendly and WCAG 2.2 AA compliant. Use approved authentication methods only; the conceptual mockup's fields/buttons are not authorization to alter sign-in flows.
- On mobile, preserve the atmosphere with a compact decorative header or motif without displacing form fields below the fold unnecessarily; honor reduced-motion preferences and keep decoration non-essential.
- Avoid excessive contrast between themes in structure, excessive botanical ornament, or decorative elements that compete with error messages and validation.
- Apply the FINAL-001 B dashboard reconciliation; this login choice does not affect it.

### VIS-002 — Editorial Wedding Dashboard (Option B)

- **Approved visual reference:** Editorial Wedding Dashboard in coordinated light and dark themes. Combine a prominent, elegant wedding countdown with practical actionable summary cards and upcoming items. The login's atmospheric green and botanical language should carry through more sparingly in the daily workspace.
- **Light:** warm ivory app canvas, restrained pale-sage editorial countdown hero, deep-forest headings, crisp white or neutral cards, sage progress accents, subtle dividers and botanical motif.
- **Dark:** deep forest canvas, differentiated forest-green hero and card surfaces, soft ivory text, muted sage progress indicators, restrained floral accent and WCAG-compliant text/controls.
- **Hierarchy:** contextual navigation/header; featured countdown/wedding identity; actionable metrics for authorized modules (e.g., guest confirmation and task progress); concise upcoming items/decisions and authorized deep links. Maintain the approved fixed-grid presentation and independent partner card ordering per FINAL-001 B.
- **Interaction and accessibility:** cards use the UI-027 actionable summary pattern and UI-028 text-backed progress; all links/buttons are accessible and permission-scoped. Do not infer or introduce new metrics, notifications, schedule logic, or controls from visual examples.
- **Responsive:** scale the editorial hero down on mobile and stack cards in a predictable reading order; retain legible metrics and avoid decoration that competes with content. Planner portfolio views should apply the editorial motif lightly while retaining professional scan density.
- **FINAL-001 reconciliation:** the fixed dashboard grid allows each partner to reorder cards independently; card sizing and grid structure remain fixed.

### VIS-003 — Refined Editorial Lists (Option B)

- **Approved visual reference:** Refined Editorial Lists, coordinated light and dark. Continue the editorial wedding identity of VIS-001 and VIS-002 while prioritizing efficient management of guests, tasks, vendors and budget records.
- **Light:** warm ivory page canvas, restrained pale-sage editorial heading or summary area, forest headings, crisp white/neutral record surfaces, subtle borders and restrained sage accents.
- **Dark:** deep forest page canvas, differentiated green editorial heading and dark card/table surfaces, legible ivory text, muted sage accents and sufficient contrast for borders, labels and statuses.
- **Hierarchy:** contextual page heading and relevant approved totals; visible search/filter toolbar and active filter state; scannable records with primary identity, concise secondary details and permission-appropriate contextual actions. Do not replace substantive data with decoration.
- **Responsive:** on mobile, use compact prioritized record cards with clear detail affordances; on desktop, apply the same refined visual language to accessible structured tables where column comparison matters, consistent with UI-016 and UI-024. Do not mandate cards in place of desktop tables.
- **Interactions:** honor UI-033 contextual search/filter toolbar, UI-034 contextual selection and bulk-action presentation, UI-025 mobile action placement, UI-035 record details, and the approved status/confirmation/feedback systems. Avoid decorative elements interfering with sorting, selection or keyboard focus.
- **Accessibility:** semantic tables where applicable, readable labels and status text, visible keyboard focus, WCAG 2.2 AA contrast, touch-friendly controls, and accessible light/dark equivalents.
- **Scope:** example guest names, statuses, event-part labels and counts are illustrative only. Actual fields, permitted actions, filters and statuses follow the canonical product specification; do not introduce invitation-sending or new bulk operations.
- **FINAL-001 reconciliation:** partner-specific ordering is allowed within the fixed dashboard grid; this visual choice does not alter that behavior.

### VIS-004 — Immersive Botanical Marketing Page (Option B)

- **Approved visual reference:** Immersive Botanical, with coordinated light and dark themes. Carry the atmospheric visual identity from VIS-001 into the public marketing site, while using clearer product-focused sections below the hero.
- **Light:** pale sage and warm ivory canvas, softly layered botanical hero in muted green, forest headings and accessible primary calls to action; restrained floral motifs rather than decorative clutter.
- **Dark:** deep forest canvas, a differentiated forest-green hero surface, muted sage botanical accents, legible ivory text and clearly differentiated call-to-action states.
- **Hero hierarchy:** clear brand navigation; a memorable, concise wedding-focused headline and supporting copy; prominent primary action; optional secondary exploration action only where supported by approved product flows; and an integrated, accurately representative preview of the wedding dashboard.
- **Below the fold:** use calmer, legible product explanations and approved feature highlights for couples and professional planners. Keep claims and screenshots faithful to implemented and approved capabilities; avoid invented pricing, testimonials, integrations or signup flows.
- **Responsive:** reflow editorial hero, botanical treatment and product preview without obscuring copy or controls; preserve practical navigation, touch targets and contrast on small screens.
- **Accessibility and motion:** treat botanical decoration as nonessential, provide meaningful text alternatives for informative imagery, honor reduced-motion preferences, verify WCAG 2.2 AA contrast and visible focus in both themes.
- **Scope:** visual direction only; no approval of marketing copy, pricing model, signup behavior or new product functionality. Apply FINAL-001 B: fixed grid with partner-specific card ordering.

## Visual exploration phase (approved directions)

- **VIS-001:** **Approved C — Atmospheric & Immersive Login**, paired light/dark composition; no authentication behavior changes.
- **VIS-002:** **Approved B — Editorial Wedding Dashboard**, paired light/dark composition; no new dashboard behavior.
- **VIS-003:** **Approved B — Refined Editorial Lists**, paired light/dark record cards and desktop tables; no new record behavior.
- **VIS-004:** **Approved B — Immersive Botanical Marketing Page**, paired light/dark layered botanical hero with authentic product preview and restrained feature sections.
- These four visual directions are approved as references. Final semantic color values, contrast checks, production assets, and production assets still require verification before full implementation sign-off.


### FINAL-001 — Fixed Grid, Personal Card Ordering (Option B)

**Status: Approved.** This decision explicitly reconciles UI-026 with the previously approved product requirement for partner-specific dashboard arrangement.

- Keep the approved **fixed grid**: standard card sizes, columns, responsive breakpoints, spacing and design hierarchy. No freeform canvas or arbitrary card resizing.
- Allow **each partner to reorder their own authorized dashboard cards**; their ordering does not alter the other partner's arrangement. Begin with a consistent default order.
- Provide a dedicated arrangement mode with accessible reorder buttons and optional drag-and-drop. Display clear save/exit feedback as appropriate to the approved persistence workflow; do not invent new sharing or synchronization rules.
- On mobile, render cards in the partner's chosen logical order while respecting the fixed responsive grid and keyboard/screen-reader focus order.
- This decision **amends UI-026 A's prohibition on reordering** without reopening UI-006, UI-027 or VIS-002's approved visual compositions. The earlier contradiction is closed; the canonical product requirement remains intact.

### FINAL-002 — Balanced Botanical Color Treatment (Option B)

**Status: Approved.** The following establishes color *usage*, not final production hex values.

- **Light:** warm ivory page background, neutral-white data surfaces, pale sage featured/hero surfaces, deep forest headings and primary actions; muted green accents for supportive hierarchy.
- **Dark:** deep forest page background, differentiated elevated forest surfaces, selectively lighter botanical hero panels, pale neutral text and restrained sage accents. Avoid uniform green fills across dense data views.
- **Hierarchy:** apply richer botanical treatments to the atmospheric login, editorial dashboard countdown and marketing hero. Keep tables, forms, filters and financial records comparatively neutral and legible.
- **Components:** semantic roles for canvas, surfaces, foreground, muted text, borders, primary and secondary actions, accent/featured regions, focus rings, and status colors. Status must never rely on green hue alone.
- **Themes:** Light / Dark / System, default System. Theme choice must not alter permissions, content, or workflows.
- **Accessibility:** all actual token pairings, overlays, focus indicators, icons and states require computed WCAG 2.2 AA validation. The earlier illustrative colors are not approved as production-ready contrast values.
- **Scope:** FINAL-002 does not authorize new product functionality or marketing behavior, and retains FINAL-001 partner-specific dashboard card ordering.

### FINAL-003 — Approved Core Semantic Color Tokens; Remaining States Pending Validation (Option B)

**FINAL-003 B approved:** the light/dark hex values in the table below are the **core reference palette** for implementation. They are not a blanket accessibility sign-off. Codex must define and document remaining semantic and interaction-state tokens, test them against their actual rendered surfaces, and obtain review before implementation sign-off. Accessibility-driven refinements to the core colors must be documented and reviewed rather than silently substituted.

| Semantic role | Light approved core | Dark approved core | Intended usage |
| --- | --- | --- | --- |
| `background` | `#F8F8F5` | `#14211B` | App canvas |
| `foreground` | `#293C35` | `#F1F5EF` | Primary body text |
| `card` / `popover` | `#FFFFFF` | `#203128` | Data and interaction surfaces |
| `card-foreground` | `#293C35` | `#F1F5EF` | Surface text |
| `muted` | `#E9EDE7` | `#2B3D31` | Secondary backgrounds |
| `muted-foreground` | `#52665A` | `#C0D2C3` | Supporting text |
| `primary` | `#293C35` | `#A9C5B0` | Primary controls |
| `primary-foreground` | `#FFFFFF` | `#14211B` | Primary control labels |
| `secondary` | `#E1EAE0` | `#294335` | Secondary controls |
| `secondary-foreground` | `#293C35` | `#F1F5EF` | Secondary control labels |
| `accent` / `featured` | `#E1EAE0` | `#294335` | Botanical highlights |
| `accent-foreground` | `#293C35` | `#F1F5EF` | Highlight text |
| `border` / `input` | `#D4DED4` | `#43594A` | Dividers and input outlines |
| `ring` | `#3B6750` | `#B4D7BD` | Keyboard focus indicator |

**Not finalized and not implicitly delegated for unchecked release:** destructive, warning, success, info, charts, hover/pressed/disabled, selection, links and overlay tokens. These require semantic definitions and checks against every actual background, including component-state and forced-colors testing. Check 4.5:1 for ordinary text, 3:1 for large text and meaningful non-text controls/graphics, plus WCAG 2.2 focus appearance and target requirements where applicable. WCAG AA compliance cannot be inferred from this table alone.

### FINAL-004 — Foundation First, Then Implement (Option B)

**Approved implementation policy:** Codex must first establish the complete light/dark semantic token foundation, shared component interaction states, and representative accessible layouts. The foundation requires documented review and approval before feature-screen implementation proceeds. After the foundation gate passes, implement features incrementally with continuous accessibility testing; complete a formal release-readiness review before release. This approval does **not** assert that the foundation, accessibility tests, or release gate have already passed.

**Approved accessibility and handoff checklist:**

1. **Token completion:** Codex defines semantic success, warning, destructive, information, chart, link, hover, active, selected, disabled, overlay, and focus tokens for both themes; maintain a mapping to shadcn/ui and shared components. No arbitrary hard-coded colors in module screens.
2. **Contrast and perception:** verify actual text/background combinations at WCAG 2.2 AA thresholds (ordinary text 4.5:1, large text 3:1, meaningful non-text UI 3:1), including errors, badges, tables, dialogs, overlays and focus. Validate that state and meaning do not depend on color alone. Disabled/inactive exceptions do not waive usability requirements.
3. **Interaction accessibility:** keyboard-only navigation, focus visibility and non-obscured focus, logical focus order, escape/return focus for dialogs, accessible names/descriptions and live feedback, screen-reader table and form semantics, reduced motion and forced-colors support.
4. **Responsive and localization:** test mobile/tablet/desktop, 200% and 400% zoom/reflow where applicable, long translations, large text, safe areas, touch targets, and mobile card/table equivalence.
5. **Representative journey QA:** marketing → login → couple dashboard → guest/task/budget lists and detail/edit flows, plus professional planner portfolio and organization workflows, in light/dark/system themes, including loading, empty, error, validation and permission states.
6. **Handoff alignment:** inspect actual `AGENTS.md` and canonical product/architecture documents before changing their guidance; reconcile any obsolete statement that no design system exists only with explicit approval. Keep approved product behavior authoritative, including independent partner card ordering within the fixed dashboard grid.
7. **Release gate:** produce a reviewable token inventory, contrast matrix, screenshots/visual comparisons, accessibility test results, known issues and explicit sign-off. No claim of WCAG compliance from color swatches alone.

## 5. Working principles (guidance subordinate to approved decisions)

- Prioritize clarity and calm over decorative complexity, especially for dense planning and financial screens.
- Make the wedding feel personal without sacrificing professional planner efficiency.
- Use reusable semantic components rather than one-off styling.
- Never rely on color alone for status or meaning.
- Show hierarchy through typography, spacing, and alignment rather than excessive borders or shadows.
- Preserve readable content, touch targets, and visible focus indicators at all viewport sizes.

## 6. Codex implementation gate

FINAL-004 B is approved. Begin with the foundation phase only: implement and review semantic tokens, accessible shared components and representative light/dark layouts. Do not start feature-screen implementation until the foundation review passes. Then deliver features with continuous accessibility verification and a formal release gate. Inspect actual `AGENTS.md` and canonical documents before editing any other file; reconcile obsolete design-system guidance only after confirming the conflict. Do not change canonical product behavior or architecture through this document.

## 7. Visual acceptance and Codex handoff checklist (approved process; unchecked until evidenced)

- [ ] All applied tokens are documented and used consistently.
- [ ] Light/dark appearance and contrast are verified.
- [ ] Keyboard focus and accessible component states are verified.
- [ ] Responsive layouts are reviewed for mobile, tablet, and desktop.
- [ ] Loading, empty, error, success, validation, and permission states are designed.
- [ ] Couple and professional-planner experiences share a coherent visual language.
- [ ] Screens follow approved product workflows and permissions.

### Codex implementation handoff — required sequence

**Phase 0 — Source alignment (before code changes)**
- [ ] Read this entire design system, the canonical wedding product specification, `product-architecture.md`, and the repository's actual `AGENTS.md` and `docs/PLANS.md` where present; record versions/paths and any contradictions. Do not assume their content from this document.
- [ ] Confirm approved UI-001–UI-035, VIS-001–VIS-004 and FINAL-001–FINAL-004 decisions. Keep behavior, permissions, roles and data flows governed by the product specification; technical choices governed by architecture.
- [ ] Record FINAL-001 B explicitly: fixed responsive dashboard grid with accessible partner-specific card ordering, not a freeform canvas.

**Phase 1 — Foundation (blocking gate before feature-screen implementation)**
- [ ] Implement core palette from FINAL-003 as semantic CSS variables in light/dark themes, with System default and no per-wedding accent customization.
- [ ] Define and document remaining status, link, chart, focus, selection, disabled, hover, pressed and overlay tokens, including intended foreground/background pairings and contrast results.
- [ ] Build accessible shared component states using the architecture-approved Tailwind/shadcn/ui/Radix approach: buttons, inputs, dialogs, navigation, cards, tables, mobile record cards, badges, notifications and focus treatments.
- [ ] Implement representative **non-production** layout examples for atmospheric login, editorial dashboard, refined lists and immersive botanical marketing; cover light, dark, narrow and wide viewports, with representative interaction states.
- [ ] Provide a review package: token inventory, contrast matrix, representative screenshots, keyboard and screen-reader checks, zoom/reflow and mobile target checks, automated test results, exceptions and known defects.
- [ ] Obtain explicit foundation approval; do **not** treat a passing automated audit or these written requirements as sign-off.

**Phase 2 — Incremental feature implementation (only after Phase 1 approval)**
- [ ] Implement screens in product-priority order; reuse approved shared components and visual patterns instead of inventing new styles.
- [ ] Test accessibility and light/dark/system behavior continuously for each delivered feature, including empty, loading, validation, error and permission states.
- [ ] Ensure couple and planner experiences retain appropriate information density and approved product functionality.

**Phase 3 — Formal release-readiness gate**
- [ ] Execute end-to-end couple and planner journeys, keyboard/screen-reader and responsive checks, localization/reflow, reduced motion and forced-colors checks, plus actual-surface WCAG 2.2 AA verification.
- [ ] Review outstanding defects and exceptions, document owners and remediation, and obtain explicit release approval. Do not claim WCAG 2.2 AA compliance without supporting evidence.

**Handoff status:** specification approved for **foundation work**, not yet approved for feature-screen implementation or release. No GitHub commit, Codex execution, or actual accessibility audit is implied by this checklist.

## 8. Decision log

- **UI-001:** Approved option C — Modern SaaS with Elegant Touches.
- **UI-002:** Approved option A — Sage & Forest Green.
- **UI-003:** Approved option C — Modern Sans + Elegant Serif (DM Sans primary; Cormorant Garamond candidate display serif).
- **UI-004:** Approved option B — Balanced & Refined (comfortable spacing, moderate radii, subtle shadows).
- **UI-005:** Approved custom layout — collapsible sidebar; Wedding/Organization workspace switcher; contextual header; grouped module navigation.

- **UI-006:** Approved option C — Hybrid Dashboard (welcoming couple overview with structured, actionable cards; shared visual language with more scannable planner portfolio views).

- **UI-007:** Approved option B — Refined SaaS Components (clear hierarchy, restrained elevation, accessible states).
- **UI-008:** Approved option C — Hybrid Bottom Navigation + Full Menu (responsive module access and workspace switching).
- **UI-009:** Approved option C — Subtle Motion + Selective Decoration (Lucide icons, restrained transitions, selective wedding illustrations, reduced-motion support).
- **UI-010:** Approved option B — Deep Forest Dark Mode, with Light / Dark / System preferences and System as the default.
- **UI-011:** Approved option B — Full Semantic Design Tokens (light/dark semantic roles for surfaces, text, controls, focus, feedback, and charts; no module-specific or user-customized accent system).

- **UI-012:** Approved option B — Balanced Responsive Type Scale (consistent hierarchy, readable body text, responsive headings, restrained display serif).

- **UI-013:** Approved option B — Balanced 4px-Based Scale (consistent spacing tokens, moderate radii, subtle elevation, comfortable default density).

- **UI-014:** Approved option C — Adaptive Container System (constrained readable content; expanded data layouts; shared responsive grid and gutters).

- **UI-015:** Approved option C — Contextual Editing (dialogs for focused edits, side panels for context-preserving record changes, full pages for complex workflows; accessible mobile and validation states).

- **UI-016:** Approved option B — Advanced Data Tables with Contextual Details (accessible sorting/search/filtering, contextual record panels, preserved table context, responsive record views, clear states and actions).

- **UI-017:** Approved option B — Contextual & Actionable Feedback (helpful skeleton/empty states, actionable errors, truthful save/success feedback, selective illustration, accessible status communication).

- **UI-018:** Approved option B — Semantic & Restrained Status System (explicit text and icons, neutral routine states, semantic emphasis for genuine attention, accessible light/dark tokens, no color-only meaning).

- **UI-019:** Approved option B — Risk-Based Confirmation System (consequence-aware dialogs, safe cancel paths, proportionate friction, accessible warnings, and product-rule-aligned undo).

- **UI-020:** Approved option B — Context-Aware Notification System (routine success toasts, inline validation, persistent important banners, and existing notification-center updates according to product rules).

- **UI-021:** Approved option B — Contextual Wayfinding (clear active destinations, useful breadcrumbs, consistent headings, visible workspace context, responsive and accessible navigation).

- **UI-022:** Approved option B — Global Search with Categorized Results (discoverable workspace-scoped search, permission-safe categorized results, module-level search retained, accessible responsive interaction).

- **UI-023:** Approved option B — Contextual Progressive Disclosure (essential content visible; tabs for distinct views, accordions for optional details, accessible responsive behavior without adding features).

- **UI-024:** Approved option C — Adaptive Mobile Record Views (compact prioritized records, comparison-friendly responsive tables where needed, accessible full-screen mobile details, preserved list context and feature parity).

- **UI-025:** Approved option C — Contextual Sticky Actions (creation near list headings, contextual record controls, reachable sticky mobile form actions when useful, safe-area and keyboard-aware placement).

- **UI-026:** Approved option A — Fixed Dashboard Grid (consistent predefined card positions and responsive ordering; explicit arrangement mode approved by FINAL-001 B). **Superseded restriction:** FINAL-001 B permits partner-specific card ordering within a fixed grid.

- **UI-027:** Approved option B — Actionable Summary Cards (prominent metrics, supporting context, subtle text-backed progress where meaningful, and authorized next actions; fixed-grid ordering reconciled by FINAL-001 B).

- **UI-028:** Approved option B — Subtle Progress Bars and Selective Charts (text-backed progress for reliable metrics, selective meaningful charts, accessible labels and alternatives, no invented analytics; fixed-grid ordering reconciled by FINAL-001 B).

- **UI-029:** Approved option B — Adaptive Timeline Views (readable chronological timelines by default, detailed time-scaled views when needed, accessible responsive and offline/PDF presentation, no new schedule functionality; UI-026 conflict resolved by FINAL-001 B).

- **UI-030:** Approved option B — Contextual Date Selection (field date pickers, relevant period shortcuts and custom ranges only where approved, localized keyboard-accessible input, mobile-safe interactions; UI-026 conflict resolved by FINAL-001 B).

- **UI-031:** Approved option B — Structured Forms with Inline Validation (logical field sections, accessible field-level errors, contextual guidance, preserved input on failure, and appropriate responsive editing surfaces; UI-026 conflict resolved by FINAL-001 B).

- **UI-032:** Approved option B — Helpful Contextual Empty States (module-specific first-use guidance, clear authorized next actions, distinct no-results/permission/error/loading states, accessible restrained visuals, no new onboarding features; UI-026 conflict resolved by FINAL-001 B).

- **UI-033:** Approved option B — Contextual Search and Filter Toolbar (discoverable module search, contextual filters and sorting, active-filter chips, results counts, mobile filter sheets, accessible controls, permission-safe scope; UI-026 conflict resolved by FINAL-001 B).

- **UI-034:** Approved option B — Contextual Selection Toolbar (selection counts, contextual permission-safe bulk actions, clear scope and cancellation, accessible mobile/desktop placement, risk-based confirmation; UI-026 conflict resolved by FINAL-001 B).

- **UI-035:** Approved option B — Structured Overview with Contextual Sections (record summary first, logically grouped details, tabs for distinct views, accessible responsive presentation, permission-safe actions; UI-026 conflict resolved by FINAL-001 B).

- **VIS-001:** Approved option C — Atmospheric & Immersive Login (layered sage/forest themes, restrained botanical motif, readable focused sign-in form, responsive and accessible paired light/dark designs; no new authentication behavior).

- **VIS-002:** Approved option B — Editorial Wedding Dashboard (paired warm-ivory/sage and deep-forest themes, editorial countdown hero, practical actionable cards and upcoming items, responsive accessible hierarchy; UI-026 conflict resolved by FINAL-001 B).

- **VIS-003:** Approved option B — Refined Editorial Lists (paired light/dark pale-sage editorial headers, crisp scannable record cards on mobile and refined desktop tables, contextual search/filter/selection, accessible permission-scoped actions; UI-026 conflict resolved by FINAL-001 B).

- **VIS-004:** Approved option B — Immersive Botanical Marketing Page (paired light/dark botanical hero, clear calls to action and truthful product preview, responsive accessible styling; no new marketing/product behavior; UI-026 conflict resolved by FINAL-001 B).

- **FINAL-001:** Approved option B — Fixed Grid, Personal Card Ordering. Reconciles UI-026 A with the canonical product requirement: stable responsive grid and card dimensions, but each partner can independently reorder their dashboard cards in an accessible arrangement mode. Conflict closed.

- **FINAL-002:** Approved option B — Balanced Botanical: sage featured moments, forest hierarchy and primary actions, warm ivory/neutral data surfaces, deep-forest dark mode, and restrained decoration in dense workflows. Token values and complete contrast verification remain pending.

- **FINAL-003:** Approved option B — Approve Core Palette, Validate Remaining Tokens. Core light/dark semantic palette values in section 4 approved as reference; remaining semantic and interaction tokens require documented definition, actual-surface accessibility verification and review before sign-off. No blanket WCAG approval.

- **FINAL-004:** Approved option B — Foundation First, Then Implement. Complete and review semantic tokens, shared component states and representative accessible layouts before feature-screen implementation; test accessibility continuously thereafter and require formal release-readiness approval.