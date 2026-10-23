# 00-b marketing footer and localization handoff

## Scope and decisions

Owner requested a quieter footer theme selector and Dutch, French and German alongside English. Fresh implementer `/root/implement_00_b` owns this child task, based on merged PR #5 at `935531b`.

- English remains `/`; Dutch `/nl`, French `/fr`, German `/de`. The native-language footer links are ordinary URLs, so they remain usable without JavaScript and directly shareable. Browser-language detection is deliberately disabled; `/en` redirects to the single English URL `/`. Unsupported locales and nested routes return 404.
- ARCH frontend localization guidance is implemented with pinned next-intl 4.14.9, statically generated localized pages and narrowly matched Next.js proxy routing. English brand name is unchanged. All marketing/illustrative copy, development disclaimers, theme labels, accessibility labels and metadata have explicit translations. A shared dictionary type prevents missing keys from shipping unnoticed.
- UI-007/UI-010–014 and VIS-004: the existing reviewed semantic tokens and composition remain. Theme selection is only in the footer, using compact native select chrome, normal font weight and muted semantic text. The control retains 44px height, visible focus, forced-color border and System/Light/Dark behavior. Local storage failures remain safe; theme persists across locale links.
- Canonical, hreflang (including x-default), translated social metadata and four-route sitemap are emitted only with the existing verified production URL setting. Unconfigured builds keep noindex/nofollow and empty sitemap. No deployment/domain verification or configuration change is implied.
- New next-intl helper native scripts are explicitly allowlisted for `@parcel/watcher` and `@swc/core`; no blanket script approval. Frozen-lockfile installation preserves package integrity/TLS checks.

No app work, authentication, backend, paid service, DNS/Vercel settings or frozen baseline changes. No merge or deployment command is authorized.

## Executed checks

From `/workspace/Vowora` with `XDG_DATA_HOME=/workspace/.cache/data XDG_CACHE_HOME=/workspace/.cache npm_config_cache=/workspace/.cache/npm CI=true`:

- `pnpm install --frozen-lockfile --store-dir /workspace/.cache/pnpm-store` — passed after declaring the two new native helper build approvals.
- `pnpm --config.store-dir=/workspace/.cache/pnpm-store run lint` — passed.
- `pnpm --config.store-dir=/workspace/.cache/pnpm-store run typecheck` — passed.
- `pnpm --config.store-dir=/workspace/.cache/pnpm-store run build` — passed, four static language pages.
- `CHROMIUM_PATH=/usr/bin/chromium pnpm --config.store-dir=/workspace/.cache/pnpm-store run test` — 26 passed. Includes prior regression tests, all visible dictionary copy, localized HTML/labels/metadata, footer-only theme control, native-language links, light/dark axe for all locales, 320px with 200% text reflow, theme persistence across languages, browser-language default, invalid paths and English canonical path.
- `MARKETING_SITE_URL=https://vowora.app pnpm --config.store-dir=/workspace/.cache/pnpm-store run build`, then same variable/Chromium path with `pnpm --filter @vowora/marketing exec playwright test tests/localization.spec.ts tests/marketing.spec.ts --grep 'complete translated|invalid locale|SEO defaults'` — six passed, verifies configured canonical/hreflang/sitemap/indexing branch. Default noindex build restored afterwards.

Initial browser assertions identified ambiguous theme labeling from a wrapping implicit label. The final control has a separate explicitly associated label; full suite passed after correction. One overlapping test invocation was stopped/restarted because the earlier server still owned port3000; no assertion was weakened. Metadata URL comparisons normalize equivalent root trailing-slash forms.

Desktop/mobile German footer captures in [00-b-visuals](00-b-visuals/) were visually inspected in light and dark. The compact theme control is visually subordinate to content and readable at both widths.

## Independent review and PR

Fresh independent reviewer `/root/implement_00_b/review_00_b` returned PASS with no findings for the complete `935531b..2e9c689` diff (application code `aa511f5`). Reviewer independently executed direct ESLint, Next route generation/TypeScript, a forced fresh production build and all 26 Chromium tests; reviewed all four dictionaries, routing, conditional SEO and four browser captures. The separately configured production-URL branch was statically reviewed, not independently rerun. The initial reviewer browser command encountered the implementer’s orphaned screenshot server; it passed after that server was stopped. Reviewer made no changes.

[PR #6](https://github.com/WardDufraing/Vowora/pull/6) targets main. GitHub policy and the existing automatic Vercel preview checks passed; marketing CI execution is pending at this evidence update. Later check outcomes are recorded in the PR. This evidence-only follow-up does not change reviewed application code. Do not mark Done before owner merge. No deployment command was run by the implementer. Owner controls merge and production release.

## Rollback and limitations

Before merge, close the task PR. After merge, owner can revert this task; no database state/migration exists. Automated browser checks are not a claim of professional native-language proofreading or full screen-reader certification. No production deployment is claimed.
