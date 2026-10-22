# Wedding Planner — Product Architecture

> Status: Living architecture specification
> Last updated: 2026-10-22
> Approved architecture decisions: ARCH-001–ARCH-045
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

Use explicit wedding and/or organization scope where applicable. Authorization must consider membership, assigned roles, custom permissions, private/shared visibility and current access. Implement a centralized **typed permission engine** expressing resource/action grants, wedding and organization scopes, roles, custom permissions, membership, record ownership and private/shared visibility. Centralize policies and consistently enforce them in queries, mutations, exports, background tasks, search, and file URL issuance. Domain-owned repositories and application services encapsulate scoped Drizzle queries; API handlers must not bypass these boundaries. PostgreSQL RLS is **not** an approved baseline; security tests must compensate for application-enforced isolation. Feature flags never confer permission.

## 6. Persistence and consistency

- Neon PostgreSQL is the transactional system of record.
- Drizzle schema and reviewed, version-controlled migrations define database changes.
- Represent financial amounts as integer minor units with explicit ISO 4217 currency codes. Apply currency-specific precision, documented rounding rules for percentages, taxes and allocations, and overflow-safe arithmetic; do not calculate money with binary floating-point.\n- Use UUIDv7 primary keys, snake_case SQL identifiers, explicit foreign keys, constraints and indexes. Store instants with PostgreSQL timestamptz (UTC semantics); model local wedding dates/times and IANA time zones explicitly to preserve wall-clock meaning across daylight saving transitions. Confirm UUIDv7 generation support in the selected PostgreSQL/runtime configuration.
- Use appropriate foreign keys, constraints, indexes and transactions.
- Use optimistic concurrency (version field or equivalent) for conflicting edits; return a consistent conflict response (e.g. HTTP 409) and preserve client input.
- For multi-step changes, use database transactions where possible; design external side effects for retries and idempotency.
- Persist domain changes and outbox events atomically in PostgreSQL. Dispatch pending events reliably to Trigger.dev or integrations; use at-least-once-safe, idempotent consumers and track dispatch progress. The outbox is an event handoff, **not** a duplicate Trigger.dev job execution ledger.
- PostgreSQL search uses full-text/trigram indexes and applies authorization before returning results.
- Avoid cross-tenant cache leakage: cache keys and invalidation must include the necessary permission scope.

## 7. API and authentication

- REST endpoints are versioned from the outset (initially /api/v1).
- Use typed domain errors mapped to standardized HTTP responses with stable machine-readable codes, correlation IDs and safe user-facing messages. Keep sensitive diagnostics in protected logs and Sentry.\n- Define Zod validation, OpenAPI descriptions and stable error conventions. Use cursor pagination for large/changing collections, validated typed filters/sorts, deterministic order with a unique tie-breaker, and consistent response envelopes; simpler bounded queries may be used where appropriate.
- Support future Expo clients without depending on browser-only Server Actions.
- Use Better Auth or an approved equivalent; confirm Neon/Drizzle integration and native client support before implementation.
- Web uses secure HTTP-only cookie sessions with relevant CSRF protections. Implement supported device/session visibility and revocation and reauthentication for sensitive actions; optional MFA is a capability, not a newly mandated product policy. Verify Better Auth support and adapter behavior before implementation.
- Future native apps use a supported secure token/session transport, including secure storage, refresh and revocation.
- Authentication identifies a user; domain authorization independently determines allowed actions.
- Maintain compatibility for deployed mobile versions through deliberate API evolution.

## 8. Frontend, accessibility and localization

- Next.js for web; TanStack Query for server state, caching and mutation invalidation.
- Use Tailwind CSS with shadcn/ui and Radix primitives for accessible web components; centralize design tokens, variants and branded patterns. Mobile may share tokens/contracts but needs platform-appropriate UI components.
- Zustand only for appropriate shared client state; local React state for local controls.
- Start with refresh/invalidation for collaboration; add targeted real-time delivery when needed.
- Target WCAG 2.2 AA through semantic controls, keyboard access, screen reader validation, responsive layouts, automated checks and manual testing.
- Use next-intl on web and translation-ready models; share locale conventions and resources where feasible, without coupling mobile to Next.js.
- Preserve user-entered text rather than silently translating it.

## 9. Files, offline access and exports

- Separate intentionally public assets (e.g. marketing and approved public imagery) from private wedding documents, guest information and exports using distinct R2 access boundaries, preferably separate buckets or equivalently enforced isolation. Store private-file metadata and access policies in PostgreSQL.
- Issue short-lived signed upload/download URLs only after server authorization; a previously issued URL may remain valid until expiry.
- Validate uploaded files and apply appropriate scanning/processing before exposing them.
- Use Trigger.dev for longer-running PDF/Excel generation and file processing; authorize again when the job runs.
- Centralize exports, while implementing imports only for modules explicitly permitted by the product specification.
- The wedding-day PWA supports explicitly saved, read-only IndexedDB snapshots of the schedule and essential contacts, with version and saved-at/staleness information.
- Detect revoked access and remove saved snapshots on reconnection. Offline revocation cannot be guaranteed before reconnection.

## 10. Jobs, notifications and email

- Trigger.dev owns technical execution, retries and job status (ARCH-016 B).
- PostgreSQL stores business records needed by the product: schedules, report history, notification inbox, recipient permissions and generated artifact metadata. Do not duplicate Trigger.dev's internal execution ledger.
- Use stable operation identifiers and idempotent side effects to prevent duplicate actions during retries.
- Dispatch durable PostgreSQL outbox events to Trigger.dev; the outbox guarantees a recoverable handoff but does not guarantee exactly-once delivery. Trigger.dev remains the execution-state owner (ARCH-016 B).
- Recheck access and current policy when scheduled jobs execute, particularly for exports, notifications and deletions.
- Store in-app notifications in PostgreSQL; derive email delivery from domain events without duplicating inbox entries.
- Use Resend and React Email for transactional templates; use Trigger.dev for deferred delivery and retry orchestration.

## 11. Lifecycle, audit, security and observability

- Centralize record lifecycle policies, while honoring module-specific retention, trash, archive, final-notice and deletion requirements in the product specification.
- Coordinate deletion of relational data, R2 files, exports and snapshots; use auditable, retry-safe cleanup.
- Maintain a product audit trail distinct from diagnostic logging.
- Use privacy-conscious structured logs, Sentry and operational alerts appropriate to the release stage.
- Layer authorization, validation, secure headers, CSRF protection as applicable, rate limits, upload protections and Cloudflare Turnstile on abuse-prone flows.
- Use typed environment configuration; feature flags may be stored in PostgreSQL with safe defaults and audited changes.

## 12. Environments, CI/CD and recovery

- Use local development, isolated preview environments and production. Add permanent staging when justified.
- Isolate databases, secrets, R2 buckets/prefixes and email behavior to avoid preview access to production data or live communications.
- GitHub Actions validates formatting/linting, types, unit/component/API/security tests, Playwright journeys and migrations.
- Vercel hosts the web/API initially; require passing checks before production releases and control migration rollout.
- Document recovery objectives, backup retention and restore procedures for both PostgreSQL and R2; periodically test restoration.
- Verify provider-specific plan limits and commercial hosting terms before launch.
- Optimize observed bottlenecks first; introduce independent services only if measured requirements justify them.

## 13. Implementation decisions still open

Future architecture decisions should resolve, among other items:
- Database naming, identifiers, timestamps and schema conventions
- Authorization policy representation and evaluation
- API pagination/filtering/error envelopes
- Transactional event delivery and consistency across database and external services
- Design system, component conventions and visual tokens
- Exact rate-limiting and feature-flag implementation
- Mobile token integration details and offline data protections
- Deployment migration sequencing, restore objectives and provider plan constraints

These are **not yet approved** and should not be mistaken for settled technology choices.

## 14. Decision log and maintenance rules

Architecture decisions ARCH-001 through ARCH-045 are approved in the planning conversation; the table in Section 2 records each selected option. The product specification has its own decision numbering and remains authoritative for product behavior.

For each future approved architecture decision:
1. Add the decision to the approved stack/decision log.
2. Update affected sections, diagrams, dependencies and implementation guidance.
3. Document any conflict or required reconsideration instead of silently changing an earlier approval.
4. Commit only the architecture file unless the user explicitly authorizes changes elsewhere.

This document is a living specification. Architectural descriptions marked as proposed are guidance, not additional user-approved decisions.
