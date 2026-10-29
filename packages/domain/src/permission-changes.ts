import { z } from "zod";

import {
  assertAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";
import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuditEventEnvelope,
  type OutboxEventEnvelope,
} from "./events.js";

export const permissionChangeKinds = [
  "permissions_changed",
  "role_changed",
  "access_revoked",
  "access_restored",
  "expiry_changed",
] as const;

export const effectiveAccessChanges = [
  "expanded",
  "reduced",
  "unchanged",
] as const;

const permissionScopeVersionSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

const eventIdentitySchema = z.strictObject({
  auditEventId: z.uuidv7(),
  outboxEventId: z.uuidv7(),
  occurredAt: z.iso.datetime({ offset: true }),
});

const changeSchema = z.strictObject({
  change: z.enum(permissionChangeKinds),
  effectiveAccess: z.enum(effectiveAccessChanges),
  membershipId: z.uuidv7(),
  previousPermissionScopeVersion: permissionScopeVersionSchema,
  permissionScopeVersion: permissionScopeVersionSchema,
});

const permissionScopeChangeSchema = z.discriminatedUnion("scope", [
  eventIdentitySchema.extend(changeSchema.shape).extend({
    scope: z.literal("wedding"),
    weddingId: z.uuidv7(),
  }),
  eventIdentitySchema.extend(changeSchema.shape).extend({
    scope: z.literal("organization"),
    organizationId: z.uuidv7(),
  }),
]);

export type PermissionChangeKind = (typeof permissionChangeKinds)[number];
export type EffectiveAccessChange = (typeof effectiveAccessChanges)[number];
export type PermissionScopeChangeInput = Readonly<
  z.input<typeof permissionScopeChangeSchema>
>;

export interface PermissionScopeChangeCapture {
  readonly audit: AuditEventEnvelope;
  readonly invalidation: OutboxEventEnvelope;
}

export class PermissionScopeChangeValidationError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid permission scope change: ${fields.join(", ")}`);
    this.name = "PermissionScopeChangeValidationError";
    this.fields = fields;
  }
}

function invalid(fields: readonly string[]): never {
  throw new PermissionScopeChangeValidationError([...new Set(fields)].sort());
}

/**
 * Captures the durable side effects of an authoritative membership mutation.
 * The owning feature repository changes membership state and its policy version
 * in the same caller-owned transaction before appending these envelopes. The
 * outbox event is an invalidation hook; authorization still reloads and checks
 * authoritative state inside every protected transaction.
 */
export function createPermissionScopeChangeCapture(
  authorization: AuthorizationContext,
  input: PermissionScopeChangeInput,
): PermissionScopeChangeCapture {
  assertAuthorizationContext(authorization);
  const parsed = permissionScopeChangeSchema.safeParse(input);
  if (!parsed.success) {
    invalid(
      parsed.error.issues.map((issue) =>
        String(issue.path[0] ?? "permissionScopeChange"),
      ),
    );
  }

  const change = parsed.data;
  if (
    change.auditEventId === change.outboxEventId ||
    change.previousPermissionScopeVersion === change.permissionScopeVersion
  ) {
    invalid(["permissionScopeVersion"]);
  }

  const tenantMatches =
    change.scope === "wedding"
      ? authorization.activeWeddingId === change.weddingId &&
        authorization.activeOrganizationId === undefined &&
        authorization.activePrivateOwnerActorId === undefined
      : authorization.activeOrganizationId === change.organizationId &&
        authorization.activeWeddingId === undefined &&
        authorization.activePrivateOwnerActorId === undefined;
  if (!tenantMatches) invalid(["scope"]);

  const scopeId =
    change.scope === "wedding" ? change.weddingId : change.organizationId;
  const audit = createAuditEventEnvelope(authorization, {
    eventId: change.auditEventId,
    eventType: "authorization.permission_scope_changed",
    schemaVersion: 1,
    occurredAt: change.occurredAt,
    subjectType:
      change.scope === "wedding"
        ? "wedding_membership"
        : "organization_membership",
    subjectId: change.membershipId,
    metadata: {
      change: change.change,
      effectiveAccess: change.effectiveAccess,
      previousPermissionScopeVersion: change.previousPermissionScopeVersion,
      permissionScopeVersion: change.permissionScopeVersion,
    },
  });
  const invalidation = createOutboxEventEnvelope(authorization, {
    eventId: change.outboxEventId,
    eventType: "authorization.permission_scope_invalidated",
    schemaVersion: 1,
    occurredAt: change.occurredAt,
    payload: {
      change: change.change,
      effectiveAccess: change.effectiveAccess,
      membershipId: change.membershipId,
      permissionScopeVersion: change.permissionScopeVersion,
      scope: change.scope,
      scopeId,
    },
  });

  return Object.freeze({ audit, invalidation });
}
