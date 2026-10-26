# 02-c audit events and transactional outbox

## Scope and architecture

Task 02-c implements ARCH-001, ARCH-006, ARCH-008, ARCH-017, ARCH-036, ARCH-039, ARCH-042, ARCH-049, ARCH-104, ARCH-106, ARCH-107, ARCH-130, ARCH-131 and ARCH-148. `@vowora/domain` defines strict, versioned audit and outbox envelopes with UUIDv7 event identity, UTC occurrence time, actor, exact wedding/organization scope, correlation ID and JSON-only privacy-minimized metadata or payload. Factories require the runtime-provenance-checked 02-b authorization context, stamp identity and tenant fields rather than accepting them from callers, deeply freeze JSON content, and register each envelope with private runtime provenance. Safe validation errors report field names without reflecting submitted values.

`@vowora/database` provides tenant-scoped audit and outbox writer interfaces over the caller-owned 02-b transaction session. Both reject forged envelopes and any actor, correlation or tenant mismatch before SQL. Audit rows expose append only through application code, while a PostgreSQL trigger rejects direct updates and deletes. Audit and outbox event IDs are primary keys, so replaying an event ID fails and rolls back all work in the surrounding business transaction. The audit and outbox tables require at least one tenant dimension and positive schema versions, use `timestamptz` instants and scope-first indexes, and arrive through one additive reviewed forward migration. PostgreSQL RLS remains disabled.

The outbox stores pending immutable event capture only. Leasing, retry state, backoff, controlled replay, stuck-event monitoring and Trigger.dev dispatch remain task 16-a. Concrete business tables and product event vocabularies remain domain-owned by their feature tasks; 02-c tests atomicity against a synthetic business table rather than inventing a production entity. No UI, API route, external service or production configuration is part of this foundation slice.

## Verification

The implementer ran:

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

The PostgreSQL suite uses the CI digest-pinned PostgreSQL 17 image in one disposable local container with synthetic credentials. It covers atomic business/audit/outbox commit, rollback after application failure, wedding and organization cross-tenant rejection, duplicate audit and outbox IDs, forged-envelope rejection, database-level update/delete denial, migration replay and isolation, and the existing 02-b tenant transaction tests. The container is removed after validation. Browser tests use the installed system Chromium through the repository's `CHROMIUM_PATH` support; an initial run looked in an empty redirected cache, after which the explicit supported path was used.

## Review disposition and handoff

Branch: `feat/02-c-audit-outbox`. PR, final commit, hosted checks, reviewer identity/findings and any fix/re-review evidence will be recorded here after independent review. Implementation and review credit measurements are unavailable in this runtime and therefore recorded as unknown rather than inferred.

No external Neon, Vercel, DNS, Trigger.dev resource, secret, production data or deployment is changed. Roll back through a reviewed corrective forward migration and compatible application rollback; do not use an unreviewed down migration. Task 03-a remains blocked until owner merge.
