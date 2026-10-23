# Vowora

The approved, frozen working baselines are under [docs/product](docs/product/):

- [Product specification](docs/product/Wedding-Platform-Product-Specification.md)
- [Technical architecture](docs/product/product-architecture.md)
- [UI design system](docs/product/UI-DESIGN-SYSTEM.md)

These files are **read-only for development agents**. Any change requires explicit owner approval and a separate controlled update. This is an agent policy; enforce GitHub-level protection separately if required.

Development starts with [docs/PLAN.md](docs/PLAN.md), with one focused [step brief](docs/steps/) per Codex agent-sized deliverable. Follow [AGENTS.md](AGENTS.md).

## Marketing development

The public marketing site is in `apps/marketing` (Next.js, pnpm/Turborepo). From the repository root with Node 24 and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm --filter @vowora/marketing dev
```

Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test` (install Playwright Chromium first). See the [00-a handoff](docs/implementation/00-a-marketing.md) for test prerequisites, cloud cache paths, metadata configuration and the owner-controlled release gate. No application backend is included yet.
