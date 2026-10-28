# 03-c authentication abuse protection

Task 03-c adds a server-side boundary around the existing Better Auth 1.7.13 integration. Every state-changing browser authentication or account-session request must carry the exact configured application `Origin`; a cross-site `Sec-Fetch-Site` value is rejected as well. Better Auth's own trusted-origin checks remain enabled. Strict per-route JSON contracts run before abuse evaluation, so malformed requests cannot create arbitrary limiter identities. Verification and reset links retain their approved GET callbacks: their high-entropy, expiring, single-use tokens are the request authority and allow direct email navigation where browsers do not send an `Origin` header.

Sensitive sign-up, sign-in, verification resend, recovery request and password-reset actions use an atomic Lua counter in a managed Upstash Redis-compatible REST store. Keys contain an HMAC-SHA-256 digest of route, dimension and normalized identity; email, IP, token and cookie values are never stored in Redis or logged by this code. On Vercel only, the network dimension uses a singular valid `x-forwarded-for` value. Vercel's request-header documentation, checked on 2026-10-28, states that its public boundary overwrites this header and does not forward external values to prevent spoofing; comma-separated proxy chains and non-Vercel runtimes are deliberately ignored.

The Redis script uses server time and one atomic `EVAL` per dimension. A route-specific fixed window admits normal traffic. An identity that reaches its threshold remains at a solvable Cloudflare Turnstile step-up instead of entering a block that an attacker could weaponize against a known email. Only the trusted Vercel network dimension advances through two challenge attempts into an escalating block capped at 900 seconds. Active keys expire after at most 24 hours without traffic, strikes decay after a quiet period, and no permanent account lock is created. `Retry-After` communicates a bounded block. Turnstile verification is bound to the configured application hostname and the `vowora-auth` action; Cloudflare supplies token expiry and single-use replay rejection. Account-session revocation cannot render the Turnstile widget, so its identity challenge tier becomes a one-window 429 response. Provider timeouts, malformed results and unavailable stores fail closed with privacy-safe Problem Details; ordinary read-only session access remains independent of the limiter.

This design traces ARCH-003/011/044's server-side security and privacy boundaries, ARCH-046/102's managed distributed rate-limit store, ARCH-126's progressive throttling and proportionate challenge, and DEC-016's email/password authentication policy. It composes with 03-b's PostgreSQL credential lock and password-reset/session revocation transactions. It adds no package dependency, PostgreSQL object, Drizzle migration, runtime database grant or persistent migration step. Authentication abuse counters are operational, short-lived data rather than the transactional system of record.

## Owner configuration

Provision separate managed Redis databases for preview and production, and separate Turnstile widgets restricted to each environment's exact application hostname. Use synthetic accounts and non-production email behavior in preview. Do not share production tokens with preview deployments. Generate an independent HMAC secret for each environment; do not reuse `AUTH_SECRET`:

```sh
openssl rand -base64 48
```

In the `apps/web` Vercel project, add each value to **Preview** first and repeat with the production-specific value only when production authentication is approved:

```sh
vercel env add AUTH_ABUSE_HASH_SECRET preview
vercel env add UPSTASH_REDIS_REST_URL preview
vercel env add UPSTASH_REDIS_REST_TOKEN preview
vercel env add TURNSTILE_SECRET_KEY preview
vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY preview

vercel env add AUTH_ABUSE_HASH_SECRET production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add TURNSTILE_SECRET_KEY production
vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY production
```

Each command prompts for the value; keep it in the password manager and never place it in shell arguments, chat, source, logs or a pull request. Keep the existing environment-specific `NEXT_PUBLIC_APP_URL` exact because it determines both the accepted CSRF origin and expected Turnstile hostname. Vercel supplies its system `VERCEL` marker; do not create or override it. Redeployment/configuration and live smoke tests remain owner-controlled after merge approval.

## Verification

The implementation uses only mocked Upstash/Turnstile responses and a disposable local PostgreSQL 17 container with synthetic credentials. The intended repository commands are:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:database
pnpm test:persistent-migrations
pnpm audit --prod --audit-level high
```

`pnpm test:database` is permitted only with the repository's disposable loopback test database and must never receive a persistent Neon URL. No migration command is required for 03-c.

Executed before review on the implementation working tree:

- `pnpm format:check`, `pnpm lint` and `pnpm typecheck` passed.
- `pnpm exec turbo run build --force` passed both Next.js applications and all package builds without credentials.
- `pnpm test:unit` passed 137 tests in 21 files; tooling passed four, boundaries passed 12 and the production HTTP smoke passed one.
- `CHROMIUM_PATH=/usr/bin/chromium pnpm test:e2e` passed six application browser tests and all 26 marketing regressions. The first attempt could not find Playwright's cached browser; the repository-supported system Chromium override produced the passing result. One new locator was narrowed after Playwright correctly reported Next's separate route-announcer alert, then the complete browser command passed.
- `pnpm test:database` passed migration metadata/drift/safety, nine database integration tests and both real-PostgreSQL auth scenarios against a disposable loopback PostgreSQL 17 container with synthetic credentials. After review, its web integration stage also runs two real-Redis policy regressions when `AUTH_ABUSE_REDIS_URL` names a credential-free loopback Redis test service.
- `pnpm test:persistent-migrations` passed seven workflow regressions against that same disposable database. It did not contact or migrate a persistent target. The container was removed afterward.
- `pnpm audit --prod --audit-level high` passed with zero high or critical findings. The audit reports one existing moderate advisory in Better Auth's optional Drizzle Kit development-loader chain (`esbuild` GHSA-67mh-4wv8-2f99); this task adds no dependency and does not run that development server in production.

The first independent reviewer reproduced a high-severity targeted-lockout flaw in the initial Lua transition: unsolved identity challenges advanced into a block. The corrected policy caps identity counters at the challenge tier and reserves progressive blocking for the Vercel-trusted network dimension. Sequential and 20-request concurrent tests execute the exact Lua script in disposable Redis, prove 5 allows followed by 15 challenges and zero identity blocks, prove atomic network thresholds, verify that a second block is longer than the first with shortened test windows, and confirm bounded cleanup TTL. A new fresh independent reviewer must clear the corrected head before the PR is marked ready.

## Review and external-action record

Branch: `feat/03-c-auth-abuse-protection`, based on merged main `69af5c48957eca4302489634ea53d8f4e639727a`. Initial implementation commit: `a30f913`. Draft [PR #31](https://github.com/WardDufraing/Vowora/pull/31); independently reviewed head remains pending. No Upstash, Cloudflare, Neon, Vercel, Resend, DNS, staging or production resource was created, contacted or changed, and no persistent migration or deployment was run.
