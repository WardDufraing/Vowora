# Vowora

The approved, frozen working baselines are under [docs/product](docs/product/):

- [Product specification](docs/product/Wedding-Platform-Product-Specification.md)
- [Technical architecture](docs/product/product-architecture.md)
- [UI design system](docs/product/UI-DESIGN-SYSTEM.md)

These files are **read-only for development agents**. Any change requires explicit owner approval and a separate controlled update. This is an agent policy; enforce GitHub-level protection separately if required.

Development starts with [docs/PLAN.md](docs/PLAN.md), with one focused [step brief](docs/steps/) per Codex agent-sized deliverable. Follow [AGENTS.md](AGENTS.md).

The product foundation lives in `apps/web`. Its public endpoints are `GET /api/v1`, `GET /api/v1/health` and the generated contract at `GET /api/v1/openapi.json`; other v1 resources are not implemented. Local builds need no secret. See the [01-c handoff](docs/implementation/01-c-ci-env-api.md) for typed environment settings and API checks.

## Marketing development

The public marketing site is in `apps/marketing` (Next.js, pnpm/Turborepo). From the repository root with Node 24 and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm --filter @vowora/marketing dev
```

Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test` (install Playwright Chromium first). See the [00-a handoff](docs/implementation/00-a-marketing.md) for test prerequisites, cloud cache paths, metadata configuration and the owner-controlled release gate. No application backend is included yet.

Marketing languages: English `/`, Nederlands `/nl`, Français `/fr`, Deutsch `/de`. Language and theme preferences are in the footer; see the [00-b handoff](docs/implementation/00-b-marketing-localization.md).

## Application workspace

`apps/web` is a separate, noindex application foundation, not a working product. `pnpm dev:web` runs it on port 3001; `pnpm dev:marketing` runs marketing on port 3000. `pnpm build:web` and `pnpm build:marketing` build only the requested app and its package dependencies. See [workspace boundaries and owner-controlled Vercel setup](docs/implementation/01-a-workspace.md). Run `pnpm build` before `pnpm test`.

## Code quality and tests

From the repository root run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test`. Vitest/React Testing Library run with `pnpm test:unit`; `pnpm test:e2e` runs both Playwright applications after production builds. See the [01-b test harness handoff](docs/implementation/01-b-test-harness.md) for setup, ports, formatting scope and individual commands.

## Database development

Database schema and migration tooling lives in `packages/database` and builds without credentials. Run `pnpm test:database` only with a dedicated synthetic PostgreSQL test database through `DATABASE_MIGRATION_URL` and `DATABASE_MIGRATION_TARGET=test`; see the [02-a database handoff](docs/implementation/02-a-database.md). Never use runtime or production credentials for migration tests.
