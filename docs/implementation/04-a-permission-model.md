# 04-a permission vocabulary and role model

Task 04-a establishes the framework-independent authorization vocabulary used by later persistence and server-enforcement work. The domain package now owns validated wedding and organization membership projections, wedding areas, View/Edit/Download-Export actions, role preset identifiers, per-area allow/deny overrides, record relationships, record visibility, and privacy-safe policy decisions.

Partner access is structural and equal: both partners receive the same shared-workspace permissions, custom overrides cannot narrow one partner, and no member may unilaterally remove a partner. Planner access is deny-by-default until delegated because DEC-001/002/005 do not approve an unrestricted planner default. Coordinator defaults are wedding-day schedule View, essential-contact View, and assigned tasks View. Helper defaults are assigned tasks and explicitly shared records. Read-only guests can only view explicitly shared records. Edit includes record creation, while edits to an existing record remain limited by the effective assigned/shared scope. Download/Export remains separate from View.

Shared wedding data is evaluated only against an exact actor and wedding membership. The evaluator rejects revoked and expired memberships immediately, including at the exact expiry instant. Planner-private organization records require a separate exact actor and active organization membership with an explicit grant. Independent-planner private records use exact owner identity and remain separate from wedding membership, so ending wedding access does not remove the planner's own records. Runtime visibility checks prevent a private record from reaching the shared-wedding path. Partner control of shared wedding data never grants planner-private access. The evaluator returns stable reason codes and does not include actor IDs or record data in errors. It remains a pure policy model: 04-b owns authoritative session/context enforcement, 04-c owns permission-change invalidation and audit behavior, 06 owns wedding membership persistence, and 07 owns organization/staff persistence and planner lifecycle.

## Decisions and scope

- Architecture: ARCH-008, ARCH-037, ARCH-047 and ARCH-148.
- Product: DEC-001–011, with directly required detailed permission decisions DEC-411–415 and DEC-447–457.
- Files: `packages/domain/src/permissions.ts`, its unit tests, and public exports from `packages/domain/src/index.ts`.
- No UI, API route, database table, SQL migration, runtime database grant, external service, environment variable or deployment changes are part of this task.
- Rollback is a code revert. There is no persistent-data rollback.

## Verification

Executed on the implementation branch before independent review:

```sh
pnpm exec vitest run packages/domain/src/permissions.unit.test.ts
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

The initial focused suite passed 12 tests. After review corrections, the focused suite passed 15 tests, including runtime private-visibility rejection, revoked/expired membership, essential-contact scope, independent-planner private ownership, and defense-in-depth clamping of collaborator Edit access to assigned/shared records while retaining creation. The corrected full unit/component suite passed 152 tests in 22 files; four tooling tests and 12 package-boundary tests also passed. Formatting, lint, workspace type checking and both application production builds passed on the corrected implementation.

Database and persistent-migration suites are not applicable because the diff has no database or migration change. Browser tests are not applicable because the diff has no UI or delivery behavior. Hosted CI and independent review are pending on the draft pull request.

## Review and external-action record

Branch: `feat/04-a-permission-role-model`, based on merged main `214dc1d2f90ac2ae802b1db7cf73dffed0e6c2b2`. [PR #32](https://github.com/WardDufraing/Vowora/pull/32), initial implementation `00ffe27`, reviewed code `8795e6a`. Initial reviewer `/root/implement_04_a/review_04_a` found one high runtime-visibility bypass and three medium lifecycle/private-owner/contact-scope gaps at `502ddf8`; all were fixed in `a88eaba`. Fresh re-reviewer `/root/implement_04_a/rereview_04_a` verified those fixes and found a new high collaborator Edit-scope escape. Its defense-in-depth parser/evaluator correction landed in `8795e6a`; different fresh reviewer `/root/implement_04_a/final_review_04_a` passed the complete corrected diff with no blocking, high or medium findings and independently passed 15 focused tests, domain type checking and diff checks. Hosted policy, secret scan, database checks and both Vercel previews passed at the reviewed code; the marketing job was still running when the review ended. No persistent database, Neon, Vercel, Cloudflare, Upstash, DNS, staging or production resource was contacted or changed.
