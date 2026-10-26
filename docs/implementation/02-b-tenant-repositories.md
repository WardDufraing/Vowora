# 02-b tenant-scoped repository and transaction primitives

## Scope and architecture

Task 02-b implements ARCH-001, ARCH-006, ARCH-008, ARCH-036, ARCH-042, ARCH-064, ARCH-076, ARCH-106, ARCH-107, ARCH-111, ARCH-142 and ARCH-148. `@vowora/domain` first parses unknown metadata into a strict, immutable candidate carrying an actor UUIDv7, an active wedding and/or organization UUIDv7, an opaque bounded permission-scope version and a correlation UUID. Unknown properties, invalid identifiers, invalid version metadata and unscoped candidates fail with safe errors that report field names without reflecting values.

Structural parsing cannot mint the authorization type repositories trust. The server-only resolver requires an authoritative verifier and registers each successful context with module-private runtime provenance; casts, clones and structurally valid request objects fail before SQL or a transaction opens. The verifier must authenticate the actor and resolve membership/scope against authoritative state before invoking an application service. Its call completes before the transaction boundary, so that authorization lookup cannot lengthen database lock time. Tasks 03 and 04 own the concrete authentication/permission verifier, membership, roles, custom grants, ownership and product permission vocabulary.

`@vowora/domain` also defines a mapped tenant-aware repository contract that adds the same scoped call object to every declared read, write or domain-specific operation instead of prescribing CRUD methods. `@vowora/database` supplies deny-by-default query predicates and write assertions for wedding, organization or combined scope. A missing active dimension becomes a false read predicate, combined scope is conjunctive, writes must supply every repository-declared tenant ID and every value must exactly match the validated context. A repository with no tenant columns is rejected. Domain records and repository implementations remain domain-owned as features are added; route-handler lint policy prevents static imports, exports, dynamic imports and relative-source access to `@vowora/database`, and package boundaries allow database infrastructure to consume only the domain public entrypoint.

Application services own transactions through `withTenantTransaction`. It validates the context before opening one transaction and supplies the same transaction session and authorization object to every repository call. The callback is for bounded database work only; external calls must happen before or after it. Repository methods accept the caller-supplied session and do not create nested transactions.

No product entity or persistence table was invented for this foundation task. Real PostgreSQL isolation tests create a synthetic fixture table inside the existing per-run isolated schema, use deterministic synthetic UUIDv7 tenant fixtures, and rely on the harness's `finally` cleanup. This exercises actual Drizzle SQL filters, constraint failures and transaction rollback without turning arbitrary test payload into a production domain model. PostgreSQL RLS remains disabled under the approved application-enforced isolation baseline. Audit and outbox work remains 02-c.

## Verification

The focused implementation checks cover malformed and over-posted candidates, denied authoritative resolution, runtime rejection of unresolved context, immutable context values, compile-time scoped repository signatures, matching and mismatched writes, wedding and organization cross-tenant reads, missing active scope, conjunctive wedding/organization scope, multi-record commit, rollback after an application exception and rollback after a PostgreSQL primary-key constraint failure. The real database suite also retains migration replay, isolation and cleanup coverage from 02-a.

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

The database integration command runs through Turbo with a `^build` dependency, so a clean checkout builds `@vowora/domain` before Vitest resolves the package's compiled public entrypoint. This dependency is declared in the package manifest and the task graph; no prior root build is assumed.

## Review disposition and handoff

The sole independent reviewer reported four blocking/material findings on initial commit `862b019`: clean CI did not build the domain dependency; shape parsing could mint trusted provenance; the repository contract prescribed two CRUD methods without scoping every operation; and route linting allowed dynamic imports, exports and relative database paths. The implementation addresses each with the Turbo dependency graph and a clean-check boundary regression, separate parsed/resolved context types plus runtime provenance, a mapped per-operation scoped call contract, and expanded syntax/path rules with bypass regressions. Per the owner's explicit request, the implementer reruns all affected and full checks after these fixes and no second reviewer or re-review agent is started.

No external Neon/Vercel resource, secret, migration, production data or deployment is changed. Revert through a reviewed corrective pull request. 02-c may build transactional audit/outbox persistence on the same caller-owned session only after this pull request is owner-merged.
