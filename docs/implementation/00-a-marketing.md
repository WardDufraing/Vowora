# 00-a marketing website handoff

Branch: `feat/00-a-marketing-site`, based on integrated `main` at `c5472231283517af7652ef9058bfd8aaef60b91c`. Only 00-a is assigned. No prerequisite tasks; advertised PR heads #1–4 were verified as ancestors of main. GitHub API access is blocked by the environment proxy, so exact open PR status and owner assignment could not be independently queried.

## Scope and references

A minimal pnpm/Turborepo workspace contains one Next.js application at `apps/marketing`. The marketing root remains independent of future `apps/web`; no application, auth, database, email capture, waitlist, pricing or vendor-account behavior is added. The public page uses the existing Interlace Union emblem assets, self-hosted approved typefaces, semantic palette, static botanical decoration, and an explicitly illustrative planning concept. All product capabilities are described as planned. The CTA scrolls to a real explanation section.

Canonical references: product specification v259.10 sections 1–2 (purpose, couples/professional planners and right-information/right-people promise); ARCH-004 (pnpm/Turborepo), ARCH-012 (Playwright), ARCH-024/135 (CI and separate marketing/app routing as clarified by AGENTS); UI-001–004, UI-007, UI-009–014, VIS-004, FINAL-002–004. Frozen source files remain unchanged. Foundation token inventory and gate: [00-a-foundation.md](00-a-foundation.md).

## Local development and checks

Use Node 24 (supported engines: Node 22–24) and pinned pnpm 11.25.0. From repository root:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vowora/marketing exec playwright install --with-deps chromium
pnpm test
pnpm --filter @vowora/marketing dev
```

`pnpm typecheck` generates Next route types before TypeScript, so it works before a first build. Native dependency build permission is explicitly scoped to `unrs-resolver`. The pinned Next.js release and companion packages have exact pnpm-generated minimum-release-age exclusions; integrity and TLS checks remain enabled. No blanket build-script approval is used.

In this restricted cloud machine, home cache paths are unwritable and system Chromium is already installed. Tested root commands use:

```sh
export XDG_DATA_HOME=/workspace/.cache/data
export XDG_CACHE_HOME=/workspace/.cache
export npm_config_cache=/workspace/.cache/npm
export CI=true
pnpm install --frozen-lockfile --store-dir /workspace/.cache/pnpm-store
pnpm --config.store-dir=/workspace/.cache/pnpm-store run lint
pnpm --config.store-dir=/workspace/.cache/pnpm-store run typecheck
pnpm --config.store-dir=/workspace/.cache/pnpm-store run build
CHROMIUM_PATH=/usr/bin/chromium pnpm --config.store-dir=/workspace/.cache/pnpm-store run test
```

For local production startup after a build: `pnpm --filter @vowora/marketing start`. The browser tests start and stop their own production server, so stop a manually started server before running them. No credentials or required services are needed to develop the public page. No database/migrations/tenant-permission tests apply to this static public scope.

The PR-only `Marketing checks` GitHub Actions job installs frozen dependencies, lints, generates/checks types, builds and runs Chromium tests. It contains no deploy step. Its hosted execution remains unverified until a PR can be created.

## Search metadata and production gate

Default builds are `noindex, nofollow`, robots disallows indexing, sitemap is empty, and no canonical URL is emitted. This avoids publishing an unverified canonical or indexing an unfinished deployment.

`MARKETING_SITE_URL=https://vowora.app` is an optional non-secret build-time setting. Set it only after the owner verifies the existing Vercel project/domain/HTTPS. It enables canonical/Open Graph URLs, indexing, and the one-route sitemap. Other values fail the build. Turbo explicitly passes and hashes this variable, preventing metadata from being reused across different configurations. Testing with this variable verifies metadata generation only; it does not verify domain ownership, DNS or a deployment.

## Validation evidence

Implementer wrote the production code and all tests. Completed locally:

- Frozen-lockfile install, including pnpm supply-chain policy verification: passed.
- Lint: passed with no warnings after correction.
- Route generation + strict TypeScript: passed.
- Production build: passed; homepage, not-found page, SVG icon, robots and sitemap generated.
- Playwright Chromium: 12 passed, including actual page requests and content, valid in-page destinations, no invented `/app`, `/login`, `/signup` or `/api/v1`, supported metadata defaults, light/dark axe checks, contrast matrix, keyboard traversal/focus, theme persistence/live System preference, denied storage, 320/375/768/1440px widths with 200% root text, reduced motion and forced colors.
- Production dependencies audit (`pnpm audit --prod --audit-level=high`): passed, no known vulnerabilities.
- Desktop/mobile light/dark screenshots inspected; review images are under [00-a-visuals](00-a-visuals/). These are generated browser captures, not product functionality claims.

Initial tests found narrow-screen text overflow; wrapping was corrected and all widths rerun. Initial contrast helper did not accept CSS-minified three-digit hex values; the helper was corrected without weakening thresholds. One manual test attempt found an already running manually started server; that server was stopped before rerunning. Final pass results supersede these failed attempts. Reserved token roles and future widget states still need actual-surface testing when used; automated axe checks and current contrast pairs are not a blanket WCAG compliance claim. Real screen-reader, all-browser and production release verification remain pending.

Foundation reviewer `/root/implement_00_a/review_foundation_00_a` passed the foundation-only gate at `9913017`, independently ran eight tests, lint/types and a fresh build. Its low UI-011 finding (separate palette primitives) was fixed in page work. A separate fresh reviewer must review the completed full diff before sign-off.

## Owner actions and limitations

1. In cloud environment settings, allow `api.github.com` while preserving existing package/Git destinations, save/apply the change, and publish the environment if the UI requires it. Git proxy read access works; the API CONNECT request currently returns 403 before GitHub authentication, so no replacement token is requested. Resume PR creation after access is usable.
2. In the existing Vercel marketing project, inspect Git repository linkage and confirm `WardDufraing/Vowora`; do not create another project. Record current root, build/install commands and automatic deployment behavior before changing anything. If automatic Git previews exist, publishing a branch/PR may activate Vercel's existing pipeline; this task does not invoke any deployment command or alter that pipeline.
3. Before any owner-authorized release, verify `vowora.app` in that project's Domains settings, DNS and HTTPS. Expected eventual marketing root: `apps/marketing`; framework: Next.js; install from workspace: `pnpm install --frozen-lockfile`; build: `pnpm --filter @vowora/marketing build` (from repository root), or `pnpm build` when the Vercel working directory is `apps/marketing`. Enable monorepo access to files outside the project root as needed for workspace dependencies. Review existing settings first; no settings/DNS changes were made here.
4. After those checks, configure `MARKETING_SITE_URL=https://vowora.app` in the existing marketing project's intended build environment and rebuild only through a separately owner-approved release. Inspect resulting canonical, robots, sitemap and HTTPS homepage.
5. Review the task PR, local/hosted checks and independent review. Owner controls merging; this task never merges or deploys. Keep task 00-a incomplete and 01-a blocked until the launch acceptance criteria and owner merge are verified.

No production URL, project linkage, DNS or HTTPS success is claimed: the read-only request to `https://vowora.app` was blocked by the proxy (CONNECT 403). No Vercel credentials were found by variable-name inspection, and no external configuration was changed. Rollback before merge is to close the task PR; no runtime data or schema migration exists. A subsequent release rollback belongs to the existing Vercel project's owner-controlled process.
