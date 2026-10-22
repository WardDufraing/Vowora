# Wedding Planner — Product Architecture

> Status: Living architecture specification
> Last updated: 2026-10-22
> Approved architecture decisions: ARCH-001–ARCH-110
> Source of truth for product behavior: [Wedding-Platform-Product-Specification.md](./Wedding-Platform-Product-Specification.md)
> Scope: Architecture and implementation guidance, not changes to approved product requirements.

## 1. Purpose and principles

Wedding Planner serves couples, professional wedding planners and planner organizations. It supports wedding planning, tasks and timelines, budgets, guests, suppliers, documents, contacts, schedules, notifications, dashboards, reports and permissions.

Architecture principles:
- Start with a cost-conscious, API-ready modular monolith rather than microservices.
- Keep domain rules independent of web framework and delivery transport.
- Support future native clients through stable, versioned APIs.
- Enforce wedding, organization, role and record-level access on the server.
- Keep private wedding, guest, financial and document data isolated.
- Prefer managed infrastructure and incremental scaling over premature complexity.
- Preserve all existing product-specification decisions; implementation must not silently redefine them.

## 2. Approved stack

| Area | Approved choice | Decision |
| --- | --- | --- |
| Database | Neon PostgreSQL | ARCH-001 B |
| Backend | API-ready modular monolith, initially with Next.js Route Handlers | ARCH-002 B |
| Authentication | Better Auth or compatible managed equivalent; verify integration before implementation | ARCH-003 B |
| Repository | Turborepo + pnpm | ARCH-004 A |
| Background jobs | Trigger.dev | ARCH-005 B |
| Database access | Drizzle ORM + SQL migrations | ARCH-006 A |
| API | REST + OpenAPI + Zod | ARCH-007 A |
| Multi-tenancy | Shared database with application-enforced scoped authorization | ARCH-008 A |
| Files | Private Cloudflare R2 with short-lived authorized signed URLs | ARCH-009 A |
| Frontend data/state | TanStack Query + Zustand (limited client state) | ARCH-010 A |
| Auth transports | Secure web cookie sessions; supported native token transport | ARCH-011 B |
| Testing | Vitest, React Testing Library, Playwright, API and security tests | ARCH-012 A |
| Environments | Local, isolated previews, production; staging when justified | ARCH-013 A |
| Observability | Structured logs, Sentry, durable product audit trail | ARCH-014 A |
| Localization | next-intl; translation-ready data models | ARCH-015 A |
| Job execution state | Primarily Trigger.dev, not a duplicate custom job queue | ARCH-016 B |
| Migrations | Version-controlled, reviewed, forward migrations | ARCH-017 A |
| Collaboration | Query invalidation/refresh first; selective real-time later | ARCH-018 B |
| Caching | TanStack Query and targeted, permission-aware server caching | ARCH-019 A |
| Security | Layered security, validation, rate limiting, Turnstile where needed | ARCH-020 A |
| File processing | R2 + Trigger.dev processing and export pipeline | ARCH-021 A |
| Offline | PWA + IndexedDB + explicit versioned read-only snapshots | ARCH-022 A |
| API evolution | Versioned REST API from day one, e.g. /api/v1 | ARCH-023 A |
| CI/CD | GitHub Actions, Vercel previews, gated production | ARCH-024 A |
| Recovery | Managed backups plus documented, tested restore procedures | ARCH-025 A |
| Editing conflicts | Optimistic concurrency and explicit conflict resolution | ARCH-026 A |
| Notifications | Database-backed notification inbox | ARCH-027 A |
| Email | Resend + React Email + Trigger.dev | ARCH-028 A |
| Retention | Centralized lifecycle policies + scheduled cleanup | ARCH-029 A |
| Configuration | Typed configuration + database-backed feature flags | ARCH-030 A |
| Search | PostgreSQL full-text and trigram search | ARCH-031 A |
| Data transfer | Centralized export pipeline; imports only where product-approved | ARCH-032 A |
| Accessibility | WCAG 2.2 AA target; automated and manual testing | ARCH-033 A |
| Native mobile | Future Expo + React Native, shared API contracts | ARCH-034 A |
| Scaling | Incrementally scale modular monolith; extract only as justified | ARCH-035 A |
| Database conventions | UUIDv7 identifiers, snake_case SQL naming, UTC instants and explicit local date/time zone semantics | ARCH-036 A |
| Permission implementation | Centralized typed permission engine for roles, scopes, custom grants and record visibility | ARCH-037 A |
| API collections | Cursor pagination with validated typed filtering/sorting and consistent envelopes | ARCH-038 A |
| Event consistency | Transactional outbox with idempotent dispatch/consumption | ARCH-039 A |
| Web design system | Tailwind CSS, shadcn/ui, Radix primitives and centralized design tokens | ARCH-040 A |
| Financial amounts | Integer currency minor units with ISO 4217 codes, explicit rounding and safe arithmetic | ARCH-041 A |
| Data access organization | Domain-owned repositories and application services; no direct domain queries from route handlers | ARCH-042 A |
| R2 asset boundaries | Separate intentionally public assets from private documents and exports | ARCH-043 A |
| Session security | Managed secure sessions, device/session listing and revocation, sensitive-action reauthentication; optional MFA capability | ARCH-044 A |
| Error handling | Typed domain errors, standardized safe API responses and correlation IDs | ARCH-045 A |
| Rate limiting | Managed distributed limits by IP, identity, route and sensitive action; provision as needed | ARCH-046 A |
| Sensitive operations | Centralized classification, authorization, reauthentication, confirmation and audit | ARCH-047 A |
| Database connections | Neon serverless-compatible pooled connection strategy with bounded transactions | ARCH-048 A |
| Audit integrity | Append-only scoped audit events with privacy-aware content and product-defined retention | ARCH-049 A |
| Feature rollout | Server-authoritative scoped flags, safe caching and audited changes | ARCH-050 A |
| Secret management | Provider-managed per-environment secrets, least privilege and credential rotation | ARCH-051 A |
| Dependency security | Committed pnpm lockfile, Dependabot and automated vulnerability/secret checks | ARCH-052 A |
| Email deliverability | SPF/DKIM/DMARC, authenticated Resend webhooks and idempotent delivery events | ARCH-053 A |
| Database performance | Slow-query and connection metrics, EXPLAIN reviews and workload-driven indexes | ARCH-054 A |
| Privacy architecture | Data inventory, minimization, GDPR rights workflows and auditable handling | ARCH-055 A |
| Upload validation | Centralized upload policy with module-specific type, size and count limits | ARCH-056 A |
| Malware protection | Private quarantine and asynchronous malware scanning before authorized access | ARCH-057 A |
| Encryption | Provider-managed at-rest encryption and TLS, selective application-level encryption for justified high-risk data | ARCH-058 A |
| Operations monitoring | Sentry and provider metrics with actionable alerts and recovery procedures | ARCH-059 A |
| Release readiness | Risk-proportionate release checklist plus mandatory automated CI and deployment gates | ARCH-060 A |
| Integration test database | Persistent shared cloud Neon test database, isolated test runs and controlled migration tests | ARCH-061 C |
| API contracts | Contract-first versioned Zod/OpenAPI schemas, generated typed clients and CI compatibility validation | ARCH-062 A |
| Accessibility verification | Automated axe/keyboard checks plus manual screen-reader and real-device testing | ARCH-063 A |
| Test data | Deterministic synthetic factories for representative multi-tenant weddings and edge cases | ARCH-064 A |
| Deployment migrations | Expand-and-contract, backward-compatible migrations and controlled single-run rollout | ARCH-065 A |
| Offline snapshot safeguards | Minimal explicit read-only snapshots, session-aware clearing, staleness and shared-device warnings | ARCH-066 A |
| Outbox dispatcher | Scheduled polling with atomic leases, retries and stuck-event monitoring | ARCH-067 A |
| Recovery targets | Define and test provider-feasible RPO/RTO targets before production | ARCH-068 A |
| Mutation idempotency | Scoped idempotency keys and payload conflict detection for retry-sensitive operations | ARCH-069 A |
| Web forms | React Hook Form, Zod and reusable accessible fields; server remains authoritative | ARCH-070 A |
| Web routing | Next.js App Router with feature-oriented organization and route groups | ARCH-071 A |
| Rendering | Server Components by default; interactive Client Components where justified | ARCH-072 A |
| Complex tables | TanStack Table with accessible shared patterns and server-side large-list operations | ARCH-073 A |
| Navigation state | Validated URL-driven shareable view state without sensitive data | ARCH-074 A |
| Frontend performance | Core Web Vitals and interaction budgets with measured optimizations | ARCH-075 A |
| Authorization verification | Permission matrix and real cross-tenant tests across APIs, search, files, exports and jobs | ARCH-076 A |
| Theme tokens | Semantic CSS variables and shared design tokens supporting light/dark themes | ARCH-077 A |
| Localization formatting | next-intl and Intl formatting with locale preferences separate from wedding time zones | ARCH-078 A |
| Schedule time semantics | Wedding-local wall-clock dates/times, IANA zone and UTC execution instants | ARCH-079 A |
| Notification policy | Centralized permission-aware recipient/channel/preference/timing resolution and deduplication | ARCH-080 A |
| Search projections | Domain-owned PostgreSQL full-text/trigram projections, recoverable updates and query-time authorization | ARCH-081 A |
| Document previews | Secure browser previews for scanned safe images/PDFs with short-lived authorization | ARCH-082 A |
| Report generation | Shared report models, server-side PDF/XLSX generation via Trigger.dev and private R2 | ARCH-083 A |
| Calendar components | Accessible shared date/time primitives and specialized timeline/schedule views | ARCH-084 A |
| Schedule reconciliation | Persist business schedules in PostgreSQL; reconcile missed Trigger.dev executions without violating product policies | ARCH-085 A |
| CI test isolation | Dedicated schema per test run in shared Neon test database; isolated migrations and fixtures | ARCH-086 A |
| Authorization policy storage | Typed code-defined policy rules and PostgreSQL-backed roles, membership, custom grants and visibility | ARCH-087 A |
| Pagination cursors | Versioned opaque signed cursors with deterministic ordering and query-scope validation | ARCH-088 A |
| Feature flag precedence | Explicit scoped override precedence, audited changes, safe invalidation and disabled unknown flags | ARCH-089 A |
| API error format | RFC 9457 Problem Details with stable codes, correlation IDs and safe validation extensions | ARCH-090 A |
| Permission cache invalidation | Versioned wedding/organization/user permission scopes with explicit invalidation and sensitive-action rechecks | ARCH-091 A |
| File lifecycle | PostgreSQL state machine for upload, quarantine, scan, readiness, rejection, failure and deletion | ARCH-092 A |
| Private downloads | Current authorization before short-lived R2 signed URL issuance and audit of sensitive downloads | ARCH-093 A |
| Money calculations | Shared deterministic typed financial domain calculations, integer minor units and tested rounding/allocation | ARCH-094 A |
| Deletion orchestration | Product-policy-driven lifecycle states, idempotent cleanup and reconciliation across PostgreSQL/R2/jobs | ARCH-095 A |
| Reauthentication | Risk-based recent-authentication checks for classified high-impact actions | ARCH-096 A |
| Deployment rollback | Application rollback with backward-compatible schema and corrective forward migrations | ARCH-097 A |
| Security headers | Centralized reviewed CSP, HSTS, content-type, referrer and framing policies | ARCH-098 A |
| Retention registry | Typed central registry of product-defined lifecycle triggers, notices and deletion actions | ARCH-099 A |
| Incident response | Lightweight severity-based playbooks, ownership, recovery and post-incident review | ARCH-100 A |
| Preview database | One shared non-production preview database with controlled migrations and synthetic data | ARCH-101 B |
| Distributed rate limiting | Managed Redis-compatible counters, provisioned when needed, with sensitive-route fail-safe policies | ARCH-102 A |
| Editing conflict UX | Optimistic version checks, preserved local input and guided conflict comparison/merge | ARCH-103 A |
| Audit tamper resistance | Restricted insert-only application access and periodic integrity verification | ARCH-104 A |
| Recovery exercises | Quarterly PostgreSQL/R2 restore drills plus checks after major infrastructure changes | ARCH-105 A |
| Authorization context | Explicit typed actor, wedding/organization scope and correlation context validated at trust boundaries | ARCH-106 A |
| Transaction ownership | Application-service-owned bounded Drizzle transactions for domain, audit and outbox writes | ARCH-107 A |
| Background job context | Minimal stable job identifiers with execution-time policy and scope revalidation | ARCH-108 A |
| REST filters | Documented typed allowlisted query parameters validated with Zod and OpenAPI | ARCH-109 A |
| File object integrity | Opaque immutable R2 object keys, recorded ownership/checksums and verified upload integrity | ARCH-110 A |

## 3. Logical system architecture

```text
Browser / Next.js PWA                     Future Expo / React Native
         |                                          |
         +------------------ HTTPS -----------------+
                            |
                     REST API /api/v1
                            |
             Identity + scoped authorization
                            |
              Modular domain/application layer
              |          |           |          |
           Drizzle      R2 file    Trigger.dev  Resend
              |        workflows      jobs       email
         Neon Postgres       |           |
              |              +---- business services
       data + audit + inbox

Sentry + structured logs observe technical behavior.
GitHub Actions + Vercel manage testing and web/API deployment.
```

Next.js is an initial HTTP host, not the owner of domain rules. Future mobile clients must be able to use the same authorized operations through the API.

## 4. Monorepo structure (proposed baseline, not yet final)

```text
apps/
  web/                  # Next.js app, PWA, versioned HTTP handlers
  mobile/               # Future Expo app; not required for MVP
packages/
  domain/               # Business rules and module boundaries
  api/                  # Contracts, schemas, application/API adapters
  db/                   # Drizzle schema, queries, migrations
  auth/                 # Authentication integration and authorization policies
  validation/           # Shared Zod schemas
  types/                # Cross-client types/contracts
  ui/                   # Web-oriented UI primitives (not assumed React Native compatible)
  config/               # Shared typed configuration
```

The precise workspace layout and whether any worker app is necessary remain implementation details. Trigger.dev jobs can be defined in the relevant workspace without requiring a permanent dedicated worker service.

## 5. Domain boundaries and tenancy

Organize modules around product capabilities, including:
- Identity, invitations, users and sessions
- Weddings, couples, membership and permissions
- Planner organizations, teams and assignments
- Tasks, templates and timelines
- Budgets, quotes, payments and financial reports
- Guests and attendance
- Vendors, comparisons and organization vendor directory
- Wedding-day schedule and offline snapshots
- Contacts, documents, notes and inspiration
- Notifications, email, exports, audit and retention
- Dashboards and authorized search

Use explicit wedding and/or organization scope where applicable. Authorization must consider membership, assigned roles, custom permissions, private/shared visibility and current access. Implement a centralized **typed permission engine** expressing resource/action grants, wedding and organization scopes, roles, custom permissions, membership, record ownership and private/shared visibility. Define resource/action rules and policy evaluation in reviewed typed code; persist memberships, role assignments, customizable grants and record visibility in PostgreSQL with audited/versioned changes and permission-cache invalidation. Custom grants cannot override hard tenant boundaries. Maintain versioned permission scopes for affected users, weddings and organizations; explicitly invalidate relevant caches on membership, ownership, role, grant or visibility changes, and recheck sensitive actions against current authoritative grants. Centralize policies and consistently enforce them in queries, mutations, exports, background tasks, search, and file URL issuance. Domain-owned repositories and application services encapsulate scoped Drizzle queries; API handlers must not bypass these boundaries. Pass an explicit typed, validated authorization context (actor, active wedding/organization scope, relevant permission metadata and correlation ID) into services and repositories; never trust client-provided scope without validation, and revalidate at each trust boundary. PostgreSQL RLS is **not** an approved baseline; security tests must compensate for application-enforced isolation. Maintain an explicit permission matrix for roles, custom grants, organization/wedding membership and record visibility, and exercise allowed and denied access with real cross-tenant tests across API mutations/reads, search, exports, file access and background jobs. Feature flags never confer permission. A centralized sensitive-action policy classifies high-impact operations (e.g. ownership transfers, permission escalation, exports and permanent deletion) and applies risk-based recent-authentication checks, authorization, explicit confirmation and audit without overriding product-approved workflows. Set short freshness windows and require stronger verification only where risk warrants it; the precise thresholds and accepted methods remain to be defined.

## 6. Persistence and consistency

- Neon PostgreSQL is the transactional system of record. Use a supported serverless-compatible pooled connection strategy for Vercel, with environment-specific connection limits and bounded transactions. Verify the selected driver supports Drizzle, Better Auth, and transactional outbox operations before implementation.
- Drizzle schema and reviewed, version-controlled migrations define database changes.
- Represent financial amounts as integer minor units with explicit ISO 4217 currency codes. Apply currency-specific precision, documented rounding rules for percentages, taxes and allocations, and overflow-safe arithmetic; do not calculate money with binary floating-point. Centralize deterministic typed money calculations for partial payments, allocations, refunds, credits and report totals in shared domain functions, with edge-case tests and authoritative server-side results; retain database integrity constraints.
- Model wedding-day wall-clock dates and times with the wedding's IANA time zone, preserving intended local schedule times; represent actual scheduled execution instants in UTC where appropriate and test daylight-saving gaps/overlaps.
- Use UUIDv7 primary keys, snake_case SQL identifiers, explicit foreign keys, constraints and indexes. Store instants with PostgreSQL timestamptz (UTC semantics); model local wedding dates/times and IANA time zones explicitly to preserve wall-clock meaning across daylight saving transitions. Confirm UUIDv7 generation support in the selected PostgreSQL/runtime configuration.
- Use appropriate foreign keys, constraints, indexes and transactions.
- Use optimistic concurrency (version field or equivalent) for conflicting edits; return a consistent conflict response (e.g. HTTP 409), preserve client input, and present latest server values alongside user edits where practical for guided retry or merge. Never silently merge sensitive financial or permission changes.
- Application services own bounded Drizzle transactions for multi-step changes, including domain records, audit events and transactional outbox writes; repositories accept the supplied transaction context and do not independently split atomic operations. Keep external side effects outside database transactions, using recoverable outbox dispatch and idempotent retries.
- Persist domain changes and outbox events atomically in PostgreSQL. Dispatch pending events reliably to Trigger.dev or integrations; use at-least-once-safe, idempotent consumers and track dispatch progress. The outbox is an event handoff, **not** a duplicate Trigger.dev job execution ledger.
- PostgreSQL search uses domain-owned searchable projections with full-text/trigram indexes and a shared search API; update projections transactionally where practical or via recoverable domain-event processing. Enforce current record, wedding and organization authorization at query time, never treating index membership as permission.
- Monitor slow queries, connection usage and critical execution plans (EXPLAIN/EXPLAIN ANALYZE in safe environments); tune indexes based on observed workload and avoid logging sensitive query values.
- Avoid cross-tenant cache leakage: cache keys and invalidation must include the necessary permission scope.

## 7. API and authentication

- REST endpoints are versioned from the outset (initially /api/v1). Apply scoped idempotency keys to retry-sensitive mutations such as payment records, invitation issuance and export generation; bind keys to actor/tenant/operation and payload, store bounded results with expiration, and reject reuse with conflicting payloads.
- Use typed domain errors mapped to RFC 9457 Problem Details (`application/problem+json`) responses with stable machine-readable codes, correlation IDs, safe user-facing messages and sanitized field-validation extensions. Keep sensitive diagnostics in protected logs and Sentry.
- Use React Hook Form with Zod and accessible shared field components for complex web forms; server validation and authorization remain authoritative.
- Define Zod validation, OpenAPI descriptions and stable error conventions. Use cursor pagination for large/changing collections, using versioned opaque signed cursors containing deterministic sort values and unique tie-breakers. Bind and validate cursors against query filters, sort and authorization scope; a cursor is never an access token. Use documented allowlisted explicit query parameters (e.g. status, search, sort and cursor) with Zod validation and OpenAPI contracts; introduce complex filter syntax only for product-justified cases. Use consistent response envelopes; simpler bounded queries may be used where appropriate.
- Maintain versioned contract-first Zod/OpenAPI schemas; generate typed clients for web and future Expo apps, and validate API response conformance and backward compatibility in CI. Generated clients do not bypass server authorization.
- Support future Expo clients without depending on browser-only Server Actions.
- Use Better Auth or an approved equivalent; confirm Neon/Drizzle integration and native client support before implementation.
- Web uses secure HTTP-only cookie sessions with relevant CSRF protections. Implement supported device/session visibility and revocation and reauthentication for sensitive actions; optional MFA is a capability, not a newly mandated product policy. Verify Better Auth support and adapter behavior before implementation.
- Future native apps use a supported secure token/session transport, including secure storage, refresh and revocation.
- Authentication identifies a user; domain authorization independently determines allowed actions.
- Maintain compatibility for deployed mobile versions through deliberate API evolution.

## 8. Frontend, accessibility and localization

- Next.js App Router for web, with route groups for public, couple and planner experiences and feature-owned UI modules; domain/application rules remain in shared packages. Use Server Components by default for suitable layouts and initial data, and Client Components for interactive tools, forms and dashboards. Coordinate server prefetch/hydration with TanStack Query to avoid duplicate fetching; use TanStack Query for server state, caching and mutation invalidation.
- Use Tailwind CSS with shadcn/ui and Radix primitives for accessible web components; centralize semantic CSS-variable tokens for colors, typography, spacing, radii, states and light/dark themes, plus variants and branded patterns. Avoid hardcoded component colors. Mobile may share tokens/contracts but needs platform-appropriate UI components.
- Use TanStack Table with reusable accessible patterns for complex guest, budget, task and vendor tables, including validated sorting, filtering and selection; use server-side pagination/filtering for large collections.
- Store suitable navigation and shareable view state (wedding selection, non-sensitive filters, sorting and pagination) in validated URL parameters. Never include guest contact details, private notes, credentials or access tokens in URLs; server authorization applies regardless of identifiers in links.
- Zustand only for appropriate shared client state; local React state for local controls.
- Start with refresh/invalidation for collaboration; add targeted real-time delivery when needed.
- Target WCAG 2.2 AA through semantic controls, keyboard access, screen reader validation, responsive layouts, automated checks and manual testing. Integrate axe-based and keyboard checks into CI, with scheduled manual screen-reader and real-device checks for critical journeys and complex controls.
- Build accessible reusable calendar/date/time primitives and specialized task timeline and wedding-day schedule views; introduce a calendar library only when demonstrably beneficial. Preserve wedding-local time semantics and keyboard accessibility.
- Use next-intl and Intl APIs for locale-aware dates, numbers, currencies and pluralization, with tested translation fallbacks and translation-ready models. Keep individual locale preferences independent from the wedding's IANA time zone; share locale conventions and resources where feasible, without coupling mobile to Next.js.
- Track Core Web Vitals, route bundle sizes and responsiveness of critical planning interactions. Define performance budgets and introduce code splitting, virtualization, prefetching and additional caching based on measured need, while preserving accessibility and authorization.
- Preserve user-entered text rather than silently translating it.

## 9. Files, offline access and exports

- Separate intentionally public assets (e.g. marketing and approved public imagery) from private wedding documents, guest information and exports using distinct R2 access boundaries, preferably separate buckets or equivalently enforced isolation. Store private-file metadata and access policies in PostgreSQL.
- Define a centralized upload policy with module-specific allowed types, maximum sizes and upload counts; validate file metadata and actual content server-side rather than trusting client-provided extensions or MIME types.
- Use opaque, non-guessable immutable R2 object keys, with logical document/version ownership and content checksums recorded in PostgreSQL. Verify upload integrity; replacements create new object versions rather than overwriting existing keys. Checksums do not substitute for malware scanning.\n- Track file transitions in PostgreSQL with an explicit state machine (pending upload, uploaded/quarantined, scanning, ready, rejected, failed and deleted), enforcing legal transitions, retry policies and abandoned-upload cleanup. Only `ready` objects may be previewed or downloaded.
- Authorize each private download before issuing a short-lived signed R2 URL; use non-guessable private object keys and audit sensitive downloads. A previously issued URL may remain valid until expiry even after access revocation.
- Direct incoming uploads into private quarantine. Process asynchronously through controlled Trigger.dev workflows with content validation and malware scanning; promote files for authorized access only after successful checks. On scan failure, timeout or unavailable scanner, keep the file inaccessible and retry or reject according to policy. Scanning implementation/provider remains to be chosen.
- Offer browser previews for approved, malware-scanned safe images and PDFs using short-lived authorized access and appropriate sandbox/content-security controls; other supported file types may remain download-only. Private R2 objects never become public through previews.
- Generate PDF and XLSX exports server-side from shared report models through Trigger.dev for heavier workloads, store artifacts privately in R2 and recheck access at both generation and download. Honor product-defined snapshot retention, formats and filters.
- Use Trigger.dev for longer-running PDF/Excel generation and file processing; authorize again when the job runs.
- Centralize exports, while implementing imports only for modules explicitly permitted by the product specification.
- The wedding-day PWA supports explicitly saved, read-only IndexedDB snapshots containing only the selected essential schedule and emergency-contact data, with version and saved-at/staleness information. Clear locally accessible snapshots on logout, warn about shared devices, and remove revoked data after reconnection; offline remote revocation cannot be guaranteed.
- Detect revoked access and remove saved snapshots on reconnection. Offline revocation cannot be guaranteed before reconnection.

## 10. Jobs, notifications and email

- Trigger.dev owns technical execution, retries and job status (ARCH-016 B).
- Persist business schedule definitions and next-due state in PostgreSQL, use Trigger.dev to execute jobs, and periodically reconcile overdue/missed executions with idempotent scheduling. Reconciliation must respect product-approved pause, retry, catch-up, recipient and notification rules and must not duplicate delivery.
- PostgreSQL stores business records needed by the product: schedules, report history, notification inbox, recipient permissions and generated artifact metadata. Do not duplicate Trigger.dev's internal execution ledger.
- Use stable operation identifiers and idempotent side effects to prevent duplicate actions during retries.
- Dispatch durable PostgreSQL outbox events to Trigger.dev via a scheduled lightweight polling dispatcher using atomic claims/leases, bounded retries, stuck-event monitoring and recovery; avoid an always-on worker initially. The outbox guarantees a recoverable handoff but does not guarantee exactly-once delivery. Trigger.dev remains the execution-state owner (ARCH-016 B).
- Keep background job payloads minimal: stable resource/operation IDs and necessary non-sensitive metadata, not trusted permission snapshots. Reload authoritative tenant scope, lifecycle state and current policy at execution, with idempotency keys. Define narrowly scoped system authority for legitimate scheduled lifecycle jobs when an initiating user's access no longer exists; never default all jobs to unrestricted privileges. Recheck access and current policy when scheduled jobs execute, particularly for exports, notifications and deletions.
- Resolve notification recipients, permitted channels, user preferences, timing and deduplication through a centralized policy engine, honoring all product-approved module rules. Recheck authorization at execution time. Store in-app notifications in PostgreSQL as the authoritative inbox; derive email delivery from domain events without duplicating inbox entries.
- Use Resend and React Email for transactional templates; use Trigger.dev for deferred delivery and retry orchestration. Authenticate the sending domain with SPF, DKIM and an appropriate DMARC policy; verify Resend webhook signatures and process delivery, bounce and complaint events idempotently, with privacy-safe tracking.

## 11. Lifecycle, audit, security and observability

- Centralize record lifecycle policies in a typed retention registry mapping data categories to product-approved triggers, deadlines, notices and deletion actions, with module-specific policies and automated tests. Honor module-specific trash, archive, final-notice and deletion requirements in the product specification; do not invent periods or silently enable operational overrides.
- Coordinate product-policy-driven deletion of relational data, R2 files, exports, snapshots and scheduled jobs with persistent lifecycle deadlines/states, idempotent Trigger.dev cleanup, partial-failure retries, reconciliation and privacy-safe completion evidence. Honor all approved final notices, retention periods and applicable legal exceptions.
- Maintain a personal-data inventory covering users and non-account wedding guests. Apply data minimization, access restrictions, purpose/retention rules and appropriately verified GDPR access, rectification, portability and erasure workflows, assessing applicable legal exceptions and others' rights; audit request handling.
- Use provider-managed encryption at rest for PostgreSQL and R2 and TLS in transit. Apply selective application-level field encryption to specifically identified high-risk data when justified, with documented key management and awareness of impacts on searching/indexing. Encryption does not replace scoped authorization.
- Maintain a product audit trail distinct from diagnostic logging. Use append-only audit events with actor, action, resource/target, time and appropriately redacted change context; enforce insert-only application database privileges, restrict privileged modification and periodically check audit continuity/integrity, recognizing that database administrators are not cryptographically excluded; restrict access by scope and apply product-approved retention, deletion and anonymization. Append-only is not indefinite retention.
- Use privacy-conscious structured logs, Sentry and provider metrics for application errors, Trigger.dev job failures, database health, email delivery and critical user journeys. Configure actionable alerts and lightweight incident playbooks covering severity, accountable responders, containment, communication, recovery and post-incident review for data exposure, identity failures, database outages, jobs and email delivery; scrub personal information, secrets, financial data and document content from telemetry.
- Layer authorization, validation, a centrally reviewed security-header baseline (Content Security Policy, HSTS, MIME-sniffing protection, referrer policy and framing restrictions), CSRF protection as applicable, rate limits, upload protections and Cloudflare Turnstile on abuse-prone flows. Test narrow route-specific CSP exceptions for authentication, approved integrations and safe R2 previews; do not broadly disable protections. Use a managed Redis-compatible distributed rate limiter (e.g. Upstash Redis) with policies by IP, authenticated identity, route and sensitive operation; defer provisioning until required, and fail safely for abuse-sensitive endpoints.
- Use typed environment configuration and PostgreSQL-backed feature flags with safe defaults and audited changes. Evaluate flags authoritatively on the server, with documented deterministic precedence across global, environment, organization, wedding and user overrides; default unknown flags to disabled, audit changes, and use short-lived permission-aware caching with invalidation. Flags never grant permissions.

## 12. Environments, CI/CD and recovery

- Use local development, isolated preview environments and production. Add permanent staging when justified.
- Use one shared, dedicated non-production Neon database for trusted preview deployments (ARCH-101 B), with synthetic data, controlled/serialized schema migrations, stable preview schema expectations and no destructive cross-preview tests; preview branches can interfere and must never access production credentials or data. Keep this preview database separate from the shared CI test database, whose test runs use isolated schemas.\n- Isolate databases, secrets, R2 buckets/prefixes and email behavior to avoid preview access to production data or live communications. Use Vercel, GitHub Actions and provider-native secret stores with least-privilege, environment-specific credentials and documented rotation; never commit secrets to Git or expose them to untrusted previews.
- Use a dedicated persistent shared Neon cloud **test** database (ARCH-061 C), never production credentials/data. Run real PostgreSQL repository, transaction and multi-tenant permission tests with deterministic synthetic fixtures. Create a separate PostgreSQL schema for each CI test run within the persistent shared Neon test database; apply migrations and deterministic fixtures in that schema and clean it afterward. Ensure Drizzle, authentication tables and connections consistently select the intended schema; serialize operations on genuinely shared infrastructure. Validate schema compatibility in tooling before relying on this isolation. Keep fixtures reproducible and include weddings, organizations, guests, payments, permissions and edge cases.
- GitHub Actions validates formatting/linting, types, unit/component/API/security tests, Playwright journeys and migrations. Commit the pnpm lockfile, use Dependabot for reviewed dependency update pull requests, and run automated dependency vulnerability and secret scanning. Keep untrusted pull-request workflows isolated from production secrets.
- Use expand-and-contract database migrations: introduce backward-compatible additions first, deploy compatible code, and remove legacy structures only after old versions are retired. Roll back application deployments through Vercel when necessary, retaining schema compatibility; recover database changes with carefully reviewed corrective forward migrations rather than assuming reverse migrations are safe. Apply production migrations once through a controlled step, with predeployment checks and a documented recovery path.
- Vercel hosts the web/API initially; require passing checks before production releases and control migration rollout. Use a formal risk-proportionate release checklist covering relevant automated tests, security, accessibility, migration validation, backup/recovery and critical user journeys. Require enhanced manual review for sensitive schema, authorization and high-impact changes without burdening trivial UI fixes with identical procedures.
- Define explicit recovery point (RPO) and recovery time (RTO) targets before production launch, validate their feasibility against the chosen Neon plan, and document backup retention and coordinated PostgreSQL/R2 restore procedures. Test representative PostgreSQL and R2 restores quarterly and after significant infrastructure changes, recording consistency checks and measured outcomes against targets once approved; no numeric targets are approved yet.
- Verify provider-specific plan limits and commercial hosting terms before launch.
- Optimize observed bottlenecks first; introduce independent services only if measured requirements justify them.

## 13. Implementation decisions still open

Future architecture decisions should resolve, among other items:
- Risk-based reauthentication freshness thresholds/methods, permission-scope version mechanics and policy test coverage
- Module-specific API filter allowlists, Problem Details extension field definitions and cursor signing/key rotation
- Outbox polling cadence, lease duration, retention, retry thresholds and monitoring; schedule reconciliation cadence
- Brand-specific token values, route layouts and responsive component specifications
- Concrete managed Redis provider, rate-limit thresholds and sensitive-route failover behavior
- Feature flag storage schema, concrete scope precedence ordering and cache TTL/invalidation
- Specific GDPR operational procedures, data inventory categories and rights-request verification
- Concrete upload limits, malware scanner integration, file state transition rules, preview sandbox policy, retry/rejection rules and encryption field selection
- Alert thresholds, incident severity definitions/ownership and risk-tiered release checklist criteria
- Mobile token integration details and additional offline data protections
- Shared test database schema selection compatibility and CI concurrency controls
- Shared preview database migration coordination, concrete production rollout sequencing, numeric RPO/RTO targets and provider plan constraints

These are **not yet approved** and should not be mistaken for settled technology choices.

## 14. Decision log and maintenance rules

Architecture decisions ARCH-001 through ARCH-110 are approved in the planning conversation; the table in Section 2 records each selected option. The product specification has its own decision numbering and remains authoritative for product behavior.

For each future approved architecture decision:
1. Add the decision to the approved stack/decision log.
2. Update affected sections, diagrams, dependencies and implementation guidance.
3. Document any conflict or required reconsideration instead of silently changing an earlier approval.
4. Commit only the architecture file unless the user explicitly authorizes changes elsewhere.

This document is a living specification. Architectural descriptions marked as proposed are guidance, not additional user-approved decisions.
