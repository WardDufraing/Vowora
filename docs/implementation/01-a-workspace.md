# 01-a workspace and package boundaries

## Scope

Extend the existing pnpm/Turborepo workspace rather than replace the live marketing site. `apps/marketing` remains the four-language public site; `apps/web` is a separate, deliberately nonfunctional, noindex application foundation. It has no authentication, API, database, credentials or product features. These belong to later tasks.

ARCH-002/004 and architecture sections 3–4: `packages/domain` reserves framework-independent business rules; `packages/contracts` reserves cross-client transport contracts; `packages/config` shares strict TypeScript and ESLint configuration. Empty public domain/contracts modules intentionally introduce no speculative rules, identities or error schemas. Type-only imports in the web foundation prove public entrypoints resolve without introducing runtime coupling. The package names are implementation details allowed by the proposed-layout baseline.

ARCH-007/012/024: versioned API/validation and full Vitest/RTL harness remain 01-c/01-b. Task-specific Node tests exercise negative import boundaries, public export encapsulation, filtered Turbo graphs and actual production HTTP responses. Existing Playwright marketing regressions are retained. No tenancy or authorization behavior exists to test in this foundation.

## Dependency direction

- Apps can consume public domain/contracts entrypoints and shared configuration.
- Apps must not import another app by name or relative internals.
- Domain and contracts must not import apps, framework/runtime modules, or one another's internals. They remain independent until a later reviewed contract establishes necessary dependencies.
- Config owns tool configuration only. It is a development dependency, never a production application module.

ESLint `no-restricted-imports` enforces these initial import constraints, and tests confirm allowed portable code and rejected framework/application/private imports. This is not an adversarial sandbox or an exhaustive security boundary; reviewers must enforce architecture for new dependency styles and dynamic loading too. Package `exports` limits consumers to the public compiled entrypoints. Each package builds declarations/ESM deterministically with TypeScript.

## Reproduction

Node 24, pnpm 11.25.0. From repository root:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

The task-specific tests require built apps/packages (`pnpm build` first). Marketing tests require Playwright Chromium installed; in the cloud snapshot use `CHROMIUM_PATH=/usr/bin/chromium`. Set XDG_DATA_HOME=/workspace/.cache/data, XDG_CACHE_HOME=/workspace/.cache, npm_config_cache=/workspace/.cache/npm and use `--config.store-dir=/workspace/.cache/pnpm-store` when invoking pnpm in this restricted machine.

Two build processes at a time are sufficient on the available five CPUs; `pnpm exec turbo run build --concurrency=2`. Separate apps remain filterable through `pnpm build:marketing` and `pnpm build:web`; Turbo includes necessary shared package builds. Dev commands are `pnpm dev:marketing` (port3000) and `pnpm dev:web` (port3001). App smoke tests own port3101 and stop only their own process.

## Separate Vercel projects: owner-controlled

No Vercel settings, project creation, DNS changes or deployment commands were performed.

1. Preserve existing marketing project `vowora` and its `vowora.app` domain, root `apps/marketing`, framework Next.js. Do not point it at the new app. Enable source files outside the root for workspace configuration. If explicit build configuration is needed, use `cd ../.. && pnpm exec turbo run build --filter=@vowora/marketing`. Keep output at the framework default `.next` within `apps/marketing`. Existing MARKETING_SITE_URL gate remains exclusive to this project.
2. After owner approval, in Vercel **Add New → Project**, import `WardDufraing/Vowora` as a distinct project (for example `vowora-app`). Root `apps/web`, framework Next.js, Node24.x, production branch main. Enable source files outside root. Install from the workspace root with frozen lockfile (`cd ../.. && pnpm install --frozen-lockfile`) and build `cd ../.. && pnpm exec turbo run build --filter=@vowora/web`. Output stays `.next` relative to apps/web. The filtered graph excludes marketing.
3. Keep per-project environment variables separate. The foundation builds without secrets; do not copy marketing variables or invent DB/auth bindings. Future auth cookies must be host-only on app.vowora.app.
4. Only after separate release approval, connect `app.vowora.app` in the new project's **Settings → Domains**, follow Vercel's displayed DNS records and verify HTTPS. Do not guess or overwrite existing records. Do not create `/app` on the marketing site. There is no working product/login yet; keep it noindex and don't add marketing login links.
5. Inspect each project's build summary to verify the selected root and only the intended app output. Existing Git integration may auto-preview PR pushes; that is distinct from an agent deployment command. Merge and production release remain owner-controlled.

## Evidence and rollback

Implementation/tests/review evidence is recorded after execution. Before merge rollback is closing the PR. After owner merge, reverting the task restores the prior workspace; no runtime data migration exists. No project or DNS rollback is necessary because none was changed. External app-project setup remains pending owner approval. 01-b cannot start until owner merge of 01-a is verified.

### Implementer validation

Frozen-lockfile install passed. Root lint and typecheck passed; Turbo built both apps and both library packages successfully at concurrency2. Six Node workspace tests passed, one production app HTTP smoke passed, and all26 existing Chromium marketing tests passed. The initial strict-pnpm missing ESLint executable was fixed by declaring the actual direct tooling dependencies; final lint passes without library React warnings. Initial dependency refresh was required because workspace manifests changed; final frozen installation succeeded. No package verification was bypassed. Independent review pending at this commit; task stays In review.
