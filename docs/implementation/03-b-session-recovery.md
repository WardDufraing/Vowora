# 03-b session management and account recovery

## Scope and security model

Task 03-b implements ARCH-003, ARCH-011 and ARCH-044 on the merged Better Auth 1.7.13 integration. Sessions remain durable database records behind Secure, HTTP-only, same-site, host-only cookies. They expire after 30 days, refresh at most daily and are considered recent for sensitive account-security operations for 15 minutes. A server-side `requireSensitiveSession` contract bypasses any cookie cache and checks the authoritative session record plus its creation time; future sensitive application services can use this boundary without trusting UI state. Distributed throttling, progressive delay and risk challenges remain ARCH-126 work in 03-c.

The account session API returns UUID session identifiers, coarse device labels and timestamps only. It never returns bearer tokens or raw IP/user-agent values. Revocation first lists sessions through the authenticated user boundary, maps an owned UUID to its server-side bearer token, and refuses current or cross-account identifiers with the same not-found response. Revoking all other sessions preserves the current session. Every revoked cookie fails the next authoritative session read.

Password recovery uses strict route schemas, same-origin callbacks, a one-hour single-use verification record and a privacy-minimized Resend message scheduled after the response with the existing five-second provider bound. Unknown and known addresses receive the same public response. Token consumption, password replacement and revocation of every existing session occur in Better Auth's database transaction; concurrent/replayed consumers cannot both succeed. Reset links do not sign users in. DEC-016 remains a later invitation eligibility rule and recovery grants no wedding or organization access.

Better Auth verifies a password before its reset transaction and session insertion, so built-in revocation alone permits an already verified old-password sign-in to finish after a reset. The application serializes password sign-in and password replacement per identity with an `auth_user` `FOR NO KEY UPDATE` lock held on an independent connection across the bounded Better Auth credential operation. Session foreign-key insertion takes a compatible key-share lock, while another sign-in/reset coordinator blocks. The total runtime connection budget is split between one coordinator connection and the application pool; configurations below two connections fail closed. Statement and idle-transaction timeouts bound lock work. Unknown identities release the coordinator connection before Better Auth's enumeration-safe response path.

No schema change is needed: `auth_session`, `auth_verification` and `auth_account` already provide the required storage, indexes and transactional adapter behavior. Existing runtime CRUD grants on the four auth tables remain exact, so no Drizzle migration or persistent-grant manifest change is introduced.

## Verification

The implementer ran frozen source checks, format/lint/types, forced builds, the full non-database suite, disposable PostgreSQL integration, migration metadata/drift/safety and the production audit. The two real-PostgreSQL auth scenarios cover anonymous/verified access, privacy-safe session listing, current/other identification, cross-account denial, individual and all-other revocation, use-after-revoke failure, strict/cross-origin recovery rejection, enumeration-safe request bodies, deferred delivery, concurrent single-use reset, session invalidation, old/new password behavior, expired tokens and stale-session reauthentication. Deterministic independent-connection probes inspect PostgreSQL lock waits for both orderings: reset blocks behind a sign-in paused after valid old-password verification and then removes its issued session; old-password sign-in blocks behind a reset paused during replacement hashing and then fails without a cookie.

Browser/component coverage exercises accessible loading/error/status states, narrow viewport behavior, recovery request/reset pages and session revocation controls. The initial browser command without `CHROMIUM_PATH` failed because the redirected Playwright cache was empty; rerunning with the repository-supported `/usr/bin/chromium` passed.

Final implementer validation before review:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm exec turbo run build --force --concurrency=2` passed.
- `pnpm test:unit` passed 122 unit/component tests; the tooling, boundary and smoke suites passed 4, 12 and 1 tests respectively.
- `CHROMIUM_PATH=/usr/bin/chromium pnpm test:e2e` passed 5 application and 26 marketing Chromium tests.
- `pnpm test:database`, with a fresh digest-pinned local PostgreSQL 17 container and synthetic loopback-only test credentials, passed migration metadata, drift and safety gates, 9 database tests and 2 web auth integration scenarios. `pnpm test:persistent-migrations` retained all 7 disposable workflow tests. The container was removed immediately afterward.
- `pnpm audit --prod --audit-level high` exited successfully; pnpm reported one existing moderate advisory in an optional development dependency and no high-severity production advisory.

## Handoff

Branch: `feat/03-b-session-recovery`. Draft PR: [#30](https://github.com/WardDufraing/Vowora/pull/30). Initial reviewer `/root/implement_03_b/review_03_b` found an old-password sign-in/reset race, stuck client controls after transport failures, escaping Better Auth errors and incomplete OpenAPI response contracts. The database coordinator and deterministic PostgreSQL races, guarded client cleanup, safe Problem Details normalization, and shared Zod/OpenAPI success contracts address those findings. Fresh independent re-review is pending. No Neon, staging, production, Vercel, Resend, DNS or persistent migration action was performed. Rollback is application rollback only because this task adds no migration. Task 03-c remains blocked until owner merge.
