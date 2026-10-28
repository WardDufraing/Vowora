# 04-b server authorization enforcement

Task 04-b connects the merged permission vocabulary to the existing authentication and tenant-repository foundations. The central domain boundary receives only a server-authenticated actor plus route-owned action, tenant and resource identifiers. It loads the exact membership, permission-scope version, record tenant, relationship and visibility through a trusted persistence interface; request bodies cannot supply actor IDs, grants, relationship, visibility or scope versions. Strict schemas reject over-posted facts before any loader runs.

Wedding, planner-organization and independent-planner private records follow separate resolution paths. Existing record area, assignment/share relationship, visibility and private owner are authoritative projections. Creation derives the `new_record` relationship inside the boundary. The 04-a policy rejects missing, revoked or expired membership, role/grant denial, collaborator records outside assigned/shared scope, cross-wedding records, cross-organization private records and private records whose owner differs from the authenticated independent planner. Only a successful policy decision mints a runtime-registered wedding, organization or private-owner context and opaque authorized operation. Structural clones and casts fail the runtime provenance check.

The web application service reads Better Auth with cookie caching and refresh disabled, uses the session user ID as the sole actor identity and returns correlation-bearing Problem Details. Anonymous access returns 401, policy denial returns one privacy-safe 403 without reflecting actor/tenant/record facts, and session/state failures fail closed with a privacy-safe 503. Feature services can pass the opaque operation to `withAuthorizedTenantTransaction`; it validates provenance before PostgreSQL opens a transaction, while existing tenant predicates and write assertions remain the repository defense in depth. There is no client-only authorization check.

This implementation traces ARCH-008, ARCH-037, ARCH-047 and ARCH-148; DEC-001–011; and the permission details DEC-411–415 and DEC-447–457. It does not invent wedding or organization membership tables before their owning tasks 06 and 07. Those features implement `ServerAuthorizationState` with exact tenant-scoped persistence. No public product endpoint or UI is invented before its owning feature task.

## Verification

The implementation agent ran:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:tooling
pnpm test:boundaries
pnpm exec turbo run build --force --concurrency=2
DATABASE_MIGRATION_URL=<disposable-loopback-postgres> \
  DATABASE_MIGRATION_TARGET=test \
  AUTH_ABUSE_REDIS_URL=<disposable-loopback-redis> \
  pnpm test:database
```

Formatting, lint and workspace type checks passed. The full unit/component run passed 169 tests in 25 files; the new focused domain, database and web boundary suites passed 16 tests, with an additional existing tenant-primitive regression covering exact independent-planner owner scope. Four tooling and 12 package-boundary tests passed. Both Next.js applications and all packages built successfully from an uncached production build. Migration metadata/drift/safety, three PostgreSQL integration files with nine tests, two Better Auth PostgreSQL scenarios and two exact Redis abuse-policy tests passed against disposable loopback PostgreSQL 17 and Redis 7.4 containers with synthetic credentials. Both containers were removed afterward. No persistent database was contacted and `pnpm test:database` was not pointed at Neon.

Browser/accessibility checks are not applicable because this task adds no route, page or UI behavior. Persistent migration checks are not applicable because no schema, SQL migration or database grant changes.

## Review, configuration and rollback

Branch `feat/04-b-server-authorization`, based on owner-merged main `99626c8c63001093b6b2aec70ae48102494a33f3`. Draft PR, implementation commit and independent review evidence are pending. Rollback is a reviewed code revert; there is no data rollback. No Neon, Vercel, Cloudflare, Upstash, DNS, environment, staging or production resource changed. Task 04-c remains blocked until owner merge.
