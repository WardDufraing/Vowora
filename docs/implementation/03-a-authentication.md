# 03-a authentication integration

## Scope and architecture

Task 03-a implements ARCH-003, ARCH-011 and the initial verified-login portion of ARCH-044 using pinned Better Auth 1.7.13 with its Drizzle PostgreSQL adapter. It adds UUIDv7-backed identity, credential, session and verification tables through one additive Drizzle migration. Identity remains global and contains no wedding or organization membership; invitation eligibility, acceptance and tenant access remain domain work for later tasks. DEC-016 is represented only by the prerequisite that an account controls a verified email address. This task does not claim that verification alone grants wedding access.

Email/password sign-up schedules a one-hour verification link through a narrow Resend adapter using Better Auth's background-task hook and Next.js `after`. Every verification callback queues a task thunk before provider I/O starts and immediately returns, including the resend endpoint, so known and unknown addresses do not diverge based on provider latency or failure. Vercel keeps the bounded task alive after the response, and the Resend request aborts after five seconds. Sign-in cannot create a session before verification, verification does not automatically sign the user in, and successful HTTPS sessions use secure, HTTP-only, same-site, host-only cookies. Secure behavior derives from the configured URL protocol rather than the optional deployment label. The authenticated `/account` boundary redirects anonymous visitors to sign-in and unverified sessions to verification. The framework's bounded local rate limiter remains enabled, while ARCH-126's distributed throttling, progressive delay and step-up controls remain task 03-c. Device/session listing, revocation and recovery remain 03-b, and those framework endpoints are blocked by an explicit route allowlist until implemented.

The public auth handler converts JSON failures into the existing correlation-bearing problem-details format and does not reflect framework/provider details. Strict route-specific Zod schemas enforce the published JSON contracts before Better Auth, including rejection of additional fields and bounded account names. It independently rejects callback URLs outside the configured application origin before Better Auth can create an account or send a verification link. This guard was added after real-PostgreSQL testing showed Better Auth 1.7.13 accepted an absolute cross-origin callback during sign-up despite its configured trusted origins. Resend failures are contained without provider bodies, and email bodies contain no wedding details.

The app exposes accessible sign-up, sign-in and verification forms in English. Broader application localization remains task 05-c. `/api/v1` and OpenAPI advertise the implemented authentication routes. Builds do not require credentials; runtime auth routes fail closed when their required environment is absent or invalid.

## Verification

The implementation used a disposable digest-pinned PostgreSQL 17 container with synthetic local credentials and the repository's isolated schema harness. The container was removed after validation. Commands executed from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --force --concurrency=2
pnpm test
pnpm test:database
pnpm audit --prod --audit-level high
```

The full non-database suite passed 63 unit/component tests, four tooling tests, eleven boundary tests, one production HTTP smoke test, four app Chromium tests and 26 marketing Chromium regressions. A clean-dist probe also removed all relevant compiled workspace entrypoints and passed root test typechecking from source aliases. Database verification passed migration metadata, drift and destructive-operation gates; nine existing PostgreSQL integration tests; and the new auth flow covering anonymous sessions, strict rejection of extra fields and oversized names before writes, cross-origin callback rejection before writes/email, deferred commit before delayed email, equal known/unknown resend responses before provider work, recoverable delivery failure, unavailable later-task endpoints, sign-up without a session, unverified denial, enumeration-safe login failures, verification without automatic sign-in, verified login, secure host-only cookie attributes, UUIDv7 identity and persisted session state. The high-severity production audit gate passed. It reports one moderate development-server advisory in an optional Better Auth `drizzle-kit` peer path (`esbuild` GHSA-67mh-4wv8-2f99); that CLI/development path is not served by the production application.

## Migration, configuration and rollback

Migration `0002_cool_junta.sql` is additive. It creates `auth_user`, `auth_account`, `auth_session` and `auth_verification` with foreign keys, normalized unique email, unique credential provider identity, unique opaque session tokens and expiry/user indexes. Production rollback is an application rollback plus a separately reviewed compatible forward migration; do not drop identity tables or run an ad hoc down migration.

Before production authentication can work, the owner configures the **app** Vercel project (`apps/web`) with:

- `VOWORA_ENV=production` and `NEXT_PUBLIC_APP_URL=https://app.vowora.app`;
- a private, independently generated `AUTH_SECRET` of at least 32 characters;
- `DATABASE_URL` for the bounded runtime database identity, distinct from migration credentials and using managed TLS;
- a private `RESEND_API_KEY`; and
- `AUTH_EMAIL_FROM` set to an address on a domain already verified in Resend.

Apply the reviewed migration once with the dedicated migration identity before enabling production auth traffic. Configure preview values separately with the preview's exact HTTPS origin if authentication is exercised there. Never copy secret values into chat, Git, logs or PR text. No Vercel, Neon, Resend, DNS or production migration action was performed by the implementation agent.

## Review and downstream handoff

Branch: `feat/03-a-authentication`; [PR #25](https://github.com/WardDufraing/Vowora/pull/25). Initial fresh reviewer `/root/continue_03_a/review_03_a` found two high issues (clean-checkout root typecheck relied on compiled package output; Resend I/O was awaited without a timeout during sign-up) and two medium issues (Secure cookies depended on a defaulted environment label; later-task Better Auth endpoints remained reachable). Source aliases and a clean-dist regression, the Next `after` background handler plus a bounded provider request, HTTPS-derived Secure cookies, and an explicit route allowlist with real-PostgreSQL denials address those findings. Fresh re-reviewer `/root/continue_03_a/rereview_03_a` confirmed them resolved and found one high resend timing/failure leak because Better Auth's resend route awaited the provider callback, plus one medium mismatch because runtime accepted fields forbidden by OpenAPI. Delivery is now scheduled as a thunk for every callback, and strict per-route schemas reject over-posting and oversized names before Better Auth. These material fixes await final fresh independent review before the PR can leave draft. Task 03-b must wait for owner merge.
