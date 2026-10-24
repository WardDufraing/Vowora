# 01-c CI, environment validation and API skeleton

## Scope and architecture

This task implements the smallest foundation required by ARCH-002, ARCH-004, ARCH-007, ARCH-012, ARCH-023, ARCH-024, ARCH-045 and ARCH-051. The product app now exposes public `GET /api/v1`, `GET /api/v1/health` and `GET /api/v1/openapi.json` Route Handlers. Strict Zod runtime contracts live in `@vowora/contracts` and mechanically generate the OpenAPI 3.1 component schemas; tests protect that linkage and exercise the served document. Responses use consistent data/meta envelopes, bounded UUID correlation IDs and `no-store`. Common unsupported methods on known routes and unknown v1 resources return safe RFC 9457 `application/problem+json` bodies with stable codes. Methods rejected by Next before Route Handler dispatch, such as TRACE, remain framework responses and are not claimed as Problem Details. The health route is deliberately liveness-only: no database or provider exists yet, and it exposes no runtime version, timestamp, hostname, environment value or secret.

Central environment parsing has separate public and server allowlists. `VOWORA_ENV` defaults to the non-secret `local` value and accepts only `local`, `preview` or `production`. `NEXT_PUBLIC_APP_URL` is optional outside production; production requires an HTTPS URL. Invalid configuration reports variable names only. Turbo hashes both values so cached builds cannot bypass validation. Tests prove invalid values stop builds without appearing in output, server-only/unknown values do not enter the public object, and production fails closed when its public URL is absent or insecure.

The existing pull-request workflow retains its established check context and now has concurrency cancellation, a time bound, a SHA-pinned TruffleHog secret-scanning job and a production dependency audit after format, lint, types, builds and all tests. Dependabot covers pnpm and GitHub Actions. Pull-request jobs retain read-only repository permission and receive no production secrets. Database connectivity, migrations, auth/security tests and provider secrets remain outside this task because those systems do not exist yet.

## Commands and evidence

With Node 24.15+ or 22.22.2+, pnpm 11.25.0 and Playwright Chromium installed:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --concurrency=2
pnpm test
pnpm audit --prod --audit-level high
```

In the restricted cloud machine, cache variables point under `/workspace/.cache` and `CHROMIUM_PATH=/usr/bin/chromium`. Final implementer validation passed the frozen install, format/lint, dedicated test and production types, both production builds, **29 Vitest tests**, **three tooling gates**, **six workspace boundary tests**, **one production HTTP smoke**, and **28 Chromium tests**: **67 tests passed, zero failed or skipped**. The production audit found no known vulnerabilities. The API smoke exercises success, generated and accepted correlation IDs, invalid-ID replacement, JSON/problem content types, cache policy, OpenAPI, HEAD/OPTIONS/404/405 responses, accurate Allow headers and verifies no sensitive value reflection.

An initial audit rejected Zod 4.3.6 due to a high-severity constrained-collection advisory. The implementation moved to patched Zod 4.6.7, regenerated the lockfile with verification intact and reran the audit successfully. No integrity, TLS or package policy was bypassed.

## Release and rollback

No Vercel project, environment variable, domain, DNS or deployment setting was changed. The current foundation needs no secret. Before a future production app build, the owner sets `VOWORA_ENV=production` and `NEXT_PUBLIC_APP_URL=https://app.vowora.app` in the intended `apps/web` Vercel project after its domain is verified; preview may use `VOWORA_ENV=preview`. Do not copy marketing settings or introduce placeholder credentials.

Before merge, close the task PR to roll back. After owner merge, revert it through a reviewed PR. There is no schema, data or infrastructure migration. Task 02-a remains blocked until this PR is owner-merged. Independent review and hosted check results are appended before owner handoff.

## Post-merge review correction

A fresh review of merged PR #9 found that the OpenAPI document exposed the Problem Details schema without attaching it to operations. The corrective branch documents the implemented unknown-resource 404 operations and known-resource POST/PUT/PATCH/DELETE 405 operations through reusable OpenAPI response components. Unit tests verify that both responses reference the Zod-generated `ProblemDetails` schema; the production HTTP smoke parses the actual 404/405 bodies with that schema and checks the served document's response references.

The same review reported that PR #9 had reverted PR #10's Codex-efficiency changes. A fresh branch from merge commit `6ea2875` disproved that finding: `f1862b0` is the first parent, the optional-coordinator `AGENTS.md`, updated skills, both `docs/CODEX-*.md` guides, and agent-policy concurrency are present with the same Git objects as PR #10. The merge did combine PR #10's and PR #9's workspace-workflow concurrency blocks into duplicate YAML keys; the corrective branch retains one `quality-*` concurrency group with cancellation and preserves the secret scan, audit, timeout, and complete test gate.

Corrective exact-tree validation passed frozen installation, format, lint, test/production typechecks, forced uncached builds for both apps, **30 Vitest tests**, **three tooling gates**, **six boundary tests**, **one production HTTP/API smoke**, and **28 Chromium tests**: **68 passed, zero failed or skipped**. The production dependency audit found no known vulnerabilities.

The first corrective reviewer confirmed the PR #10 state and workflow fix, then found that the public `/api/v1/openapi.json` endpoint's own 405 responses were still absent from the document. The document now includes that endpoint's GET operation and POST/PUT/PATCH/DELETE 405 operations; unit and production HTTP tests cover the served references and an actual rejected POST. Its catch-all parameter description also states that Next joins multiple unmatched runtime segments into the documented placeholder. A new fresh reviewer must check this material fix before owner merge and before 02-a may begin.
