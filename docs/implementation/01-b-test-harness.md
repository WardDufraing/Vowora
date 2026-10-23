# 01-b code quality and test harness

## Scope and contracts

Based on owner-merged PR #7 (`39b27b0`), task 01-b implements ARCH-004/012/024: reusable formatting/linting, Vitest with React Testing Library, and both applications' Playwright browser scaffolding. ARCH-002/007 API/backend/environment behavior remains 01-c or later. No production UI, domain rules, permissions, API, credentials, Vercel settings or DNS changes are introduced. Existing marketing translations, theme behavior, package restrictions and product noindex foundation are preserved.

The pinned Prettier config checks all maintained source/config under apps, packages, scripts, test, root and GitHub workflows. `.prettierignore` explicitly preserves frozen `docs/product` and historical documents/brand assets, generated output, lockfiles, and agent instruction files. None of those files is reformatted as a side effect. Root tooling and every workspace's maintained source are linted through the shared ESLint rules, including shared config itself; existing import restrictions remain enforced.

Vitest has separate Node unit and jsdom component projects. Tests exercise real existing origin-validation and locale logic, full translation key coverage, and ThemeSelect accessible labels, keyboard focus, pre-applied preference, all three theme values and denied storage. React Testing Library uses actual user interactions; cleanup restores mocks, storage and root theme state between tests. No product code is manufactured just to provide a test example.

The app Playwright configuration starts its own production server on port 3102, never reuses another service, and checks real browser rendering, noindex metadata and narrow viewports. Existing app HTTP smoke owns 3101; marketing Playwright owns 3000. Root test commands run these suites serially to prevent conflicts. Frozen dependencies and TLS/integrity verification remain enabled. esbuild's required verified native postinstall is explicitly allowed in `allowBuilds`, alongside existing scoped native dependencies; no blanket script approval.

## Commands

Node 24.15+ (tested 24.19.0), or Node 22.22.2+, and pnpm 11.25.0, repository root:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --concurrency=2
pnpm --filter @vowora/marketing exec playwright install --with-deps chromium
pnpm test
```

`pnpm format` applies formatting only within the declared scope. `pnpm test:unit` runs Vitest once; `pnpm test:unit:watch` starts its development watcher. `pnpm test:tooling` verifies invalid formatting and a real TypeScript lint violation fail their respective gates, while valid counterparts pass. `pnpm test:boundaries` retains the package import/export/filter checks. `pnpm test:e2e` runs both browser suites against production builds. Builds must exist before HTTP/browser tests; unit/component and lint/format tests do not need running services or secrets. The existing PR workflow now runs the format gate and complete root test command and collects failure artifacts from both applications; new API/environment/CI policy features stay out of this task.

In the cloud machine export `XDG_DATA_HOME=/workspace/.cache/data`, `XDG_CACHE_HOME=/workspace/.cache`, `npm_config_cache=/workspace/.cache/npm`, `npm_config_store_dir=/workspace/.cache/pnpm-store`, `CI=true`, and `CHROMIUM_PATH=/usr/bin/chromium` to reuse installed system Chromium and writable caches. This machine already contains browser prerequisites; other machines can use the Playwright install command above.

## Evidence, limitations and rollback

Execution and independent review results are recorded after completion. Initial typecheck found missing jest-dom matcher type augmentation in the component test's TypeScript program; a dedicated `tsconfig.test.json` includes the shared matcher setup and typechecks all unit, component and browser test/config files. Application production TypeScript programs explicitly exclude test files; root `pnpm typecheck` checks the test program and every production workspace separately. No production typechecking is disabled. Initial dependency refresh required a lockfile update because new test tools were intentionally declared; the final install uses the frozen lockfile. Scope has no tenant data, authentication, API or migrations, so related security/integration suites remain unimplemented rather than falsely passing.

Before merge, close the task PR to roll back; after owner merge, revert this task through a reviewed PR. No data or external infrastructure rollback is needed. Owner controls merging; 01-c must wait until 01-b actually merges. Nothing in this task authorizes deployment.

## Implementer validation

Final frozen-lockfile installation, format gate, all tooling/workspace lint, dedicated test and production typechecks, and both production builds passed. Root test executed **22 Vitest unit/component tests**, **two tooling gate probes**, **six workspace boundary tests**, **one app production HTTP smoke**, **two app Chromium tests**, and **26 marketing Chromium tests**: **59 passed, zero failed or skipped**. Independent review pending; this evidence does not mark the task Done or authorize merge/deployment.

## Initial independent review

Fresh reviewer `/root/implement_01_b/review_01_b` found that the initial advertised Node engine minima were below jsdom 30.1.3 and its locked DOM dependencies. Root engines now require `^22.22.2 || ^24.15.0`, matching the actual supported toolchain while excluding unsupported major versions. Current validation uses Node 24.19.0. Engine-strict and integrity/TLS checks remain enabled; no dependency requirements are bypassed. A new independent reviewer checks the corrected full diff.

The initial reviewer also identified a low scaffold mismatch: Vitest discovers package unit tests but the dedicated TypeScript test program only listed app tests. The test program now includes `packages/**/*.unit.test.ts` as well, so future package tests get the same explicit typechecking.

## Fresh independent re-review

Fresh read-only reviewer `/root/implement_01_b/review_01_b_fresh` returned **PASS, no findings** for the complete `39b27b0..73e050f` diff after both initial findings were fixed. It independently passed frozen install, format/lint, test and production typechecks, forced fresh dual builds, and all **59 tests** (22 unit/component, 2 tooling, 6 boundary, 1 HTTP, 28 browser). `tsc --showConfig` confirms both production programs contain zero test files and the test program includes all seven current unit/component/browser test files. Tracked files remained unchanged during review. [PR #8](https://github.com/WardDufraing/Vowora/pull/8) carries the implementation; subsequent evidence-only documentation commits do not change reviewed code/configuration/tests. Hosted outcomes are tracked in the PR. Owner merge remains required; 01-c has not started.
