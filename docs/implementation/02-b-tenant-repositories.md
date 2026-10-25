# 02-b tenant-scoped repository and transaction primitives

## Scope and architecture

Task 02-b implements ARCH-001, ARCH-006, ARCH-008, ARCH-036, ARCH-042, ARCH-064, ARCH-076, ARCH-106, ARCH-107, ARCH-111, ARCH-142 and ARCH-148. `@vowora/domain` defines a strict, immutable authorization context carrying an actor UUIDv7, an active wedding and/or organization UUIDv7, an opaque bounded permission-scope version and a correlation UUID. Unknown properties, invalid identifiers, invalid version metadata and unscoped contexts fail with safe errors that report field names without reflecting values.

The context parser validates server-resolved metadata at a trust boundary; it does not authenticate the actor, establish membership or issue grants. Authentication and the centralized permission engine must resolve those facts upstream before invoking an application service. Client-submitted actor or scope identifiers must never be passed through merely because they have a valid shape. Tasks 03 and 04 own authentication, membership, roles, custom grants, ownership and product permission vocabulary.

`@vowora/domain` also defines the tenant-aware repository contract. `@vowora/database` supplies deny-by-default query predicates and write assertions for wedding, organization or combined scope. A missing active dimension becomes a false read predicate, combined scope is conjunctive, writes must supply every repository-declared tenant ID and every value must exactly match the validated context. A repository with no tenant columns is rejected. Domain records and repository implementations remain domain-owned as features are added; route-handler lint policy prevents direct `@vowora/database` access, and package boundaries allow database infrastructure to consume only the domain public entrypoint.

Application services own transactions through `withTenantTransaction`. It validates the context before opening one transaction and supplies the same transaction session and authorization object to every repository call. The callback is for bounded database work only; external calls must happen before or after it. Repository methods accept the caller-supplied session and do not create nested transactions.

No product entity or persistence table was invented for this foundation task. Real PostgreSQL isolation tests create a synthetic fixture table inside the existing per-run isolated schema, use deterministic synthetic UUIDv7 tenant fixtures, and rely on the harness's `finally` cleanup. This exercises actual Drizzle SQL filters, constraint failures and transaction rollback without turning arbitrary test payload into a production domain model. PostgreSQL RLS remains disabled under the approved application-enforced isolation baseline. Audit and outbox work remains 02-c.

## Verification

The focused implementation checks cover malformed and over-posted contexts, immutable context values, matching and mismatched writes, wedding and organization cross-tenant reads, missing active scope, conjunctive wedding/organization scope, multi-record commit, rollback after an application exception and rollback after a PostgreSQL primary-key constraint failure. The real database suite also retains migration replay, isolation and cleanup coverage from 02-a.

Run the normal repository checks from the root:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm exec turbo run build --force --concurrency=2
pnpm test
pnpm audit --prod --audit-level high
```

Run `pnpm test:database` with the isolated test migration variables described in the 02-a handoff. Local validation uses the CI workflow's digest-pinned PostgreSQL 17 image, an explicit loopback port, synthetic credentials and one uniquely named disposable container, which is removed afterward. No shared or production database is used.

## Handoff

The exact final test counts, independent review disposition, commit and pull request are recorded in the task brief and pull request when review completes. No external Neon/Vercel resource, secret, migration, production data or deployment is changed. Revert through a reviewed corrective pull request. 02-c may build transactional audit/outbox persistence on the same caller-owned session only after this pull request is owner-merged.
