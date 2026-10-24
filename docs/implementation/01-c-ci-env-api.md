# 01-c CI, environment validation and API skeleton

## Scope and architecture

This task implements the smallest foundation required by ARCH-002, ARCH-004, ARCH-007, ARCH-012, ARCH-023, ARCH-024, ARCH-045 and ARCH-051. The product app now exposes public `GET /api/v1` and `GET /api/v1/health` Route Handlers. Their strict Zod contracts live in `@vowora/contracts`; responses use consistent data/meta envelopes, bounded UUID correlation IDs and `no-store`. Unsupported methods and unknown v1 resources return safe RFC 9457 `application/problem+json` bodies with stable codes. The health route is deliberately liveness-only: no database or provider exists yet, and it exposes no runtime version, timestamp, hostname, environment value or secret.

Central environment parsing has separate public and server allowlists. `VOWORA_ENV` defaults to the non-secret `local` value and accepts only `local`, `preview` or `production`. `NEXT_PUBLIC_APP_URL` is optional outside production; production requires an HTTPS URL. Invalid configuration reports variable names only. Turbo hashes both values so cached builds cannot bypass validation. Tests prove invalid values stop builds without appearing in output, server-only/unknown values do not enter the public object, and production fails closed when its public URL is absent or insecure.

The existing pull-request workflow retains its established check context and now has concurrency cancellation, a time bound and a production dependency audit after format, lint, types, builds and all tests. Dependabot covers pnpm and GitHub Actions. Pull-request jobs retain read-only repository permission and receive no production secrets. Database connectivity, migrations, auth/security tests and provider secrets remain outside this task because those systems do not exist yet.

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

In the restricted cloud machine, cache variables point under `/workspace/.cache` and `CHROMIUM_PATH=/usr/bin/chromium`. Final implementer validation passed the frozen install, format/lint, dedicated test and production types, both production builds, **28 Vitest tests**, **three tooling gates**, **six workspace boundary tests**, **one production HTTP smoke**, and **28 Chromium tests**: **66 tests passed, zero failed or skipped**. The production audit found no known vulnerabilities. The API smoke exercises success, generated and accepted correlation IDs, invalid-ID replacement, JSON/problem content types, cache policy, 404 and 405 responses, and verifies no sensitive value reflection.

An initial audit rejected Zod 4.3.6 due to a high-severity constrained-collection advisory. The implementation moved to patched Zod 4.6.7, regenerated the lockfile with verification intact and reran the audit successfully. No integrity, TLS or package policy was bypassed.

## Release and rollback

No Vercel project, environment variable, domain, DNS or deployment setting was changed. The current foundation needs no secret. Before a future production app build, the owner sets `VOWORA_ENV=production` and `NEXT_PUBLIC_APP_URL=https://app.vowora.app` in the intended `apps/web` Vercel project after its domain is verified; preview may use `VOWORA_ENV=preview`. Do not copy marketing settings or introduce placeholder credentials.

Before merge, close the task PR to roll back. After owner merge, revert it through a reviewed PR. There is no schema, data or infrastructure migration. Task 02-a remains blocked until this PR is owner-merged. Independent review and hosted check results are appended before owner handoff.
