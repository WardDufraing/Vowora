import { z } from "zod";

import {
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";
import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuditEventEnvelope,
  type OutboxEventEnvelope,
} from "./events.js";
import {
  evaluateWeddingRecordPermission,
  parseWeddingMembership,
  recordRelationships,
  weddingPermissionActions,
  weddingPermissionAreas,
  type WeddingMembership,
} from "./permissions.js";

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
  "mixed",
  "unchanged",
] as const;

const actorSchema = z.strictObject({ actorId: z.uuidv7() });
const versionSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);
const overrideSchema = z.strictObject({
  area: z.enum(weddingPermissionAreas),
  action: z.enum(weddingPermissionActions),
  effect: z.enum(["allow", "deny"]),
  scope: z
    .enum([
      "workspace",
      "assigned",
      "explicitly_shared",
      "assigned_or_shared",
      "essential_contact",
    ])
    .optional(),
});
const mutationSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("permissions_changed"),
    permissionOverrides: z.array(overrideSchema).max(128),
  }),
  z.strictObject({
    kind: z.literal("role_changed"),
    role: z.enum(["coordinator", "helper", "read_only_guest"]),
  }),
  z.strictObject({ kind: z.literal("access_revoked") }),
  z.strictObject({
    kind: z.literal("access_restored"),
    accessExpiresAt: z.iso.datetime({ offset: true }),
  }),
  z.strictObject({
    kind: z.literal("expiry_changed"),
    accessExpiresAt: z.iso.datetime({ offset: true }).nullable(),
  }),
]);
const commandSchema = z.strictObject({
  correlationId: z.uuid(),
  membershipId: z.uuidv7(),
  mutation: mutationSchema,
  weddingId: z.uuidv7(),
});
const eventIdentitySchema = z.strictObject({
  auditEventId: z.uuidv7(),
  outboxEventId: z.uuidv7(),
  occurredAt: z.iso.datetime({ offset: true }),
});
const mutationResultSchema = z.strictObject({
  membership: z.unknown(),
  membershipId: z.uuidv7(),
  permissionScopeVersion: versionSchema,
  previousPermissionScopeVersion: versionSchema,
  weddingId: z.uuidv7(),
});

export type PermissionChangeKind = (typeof permissionChangeKinds)[number];
export type EffectiveAccessChange = (typeof effectiveAccessChanges)[number];
export type WeddingPermissionChangeCommand = Readonly<
  z.input<typeof commandSchema>
>;
export type PermissionChangeEventIdentity = Readonly<
  z.input<typeof eventIdentitySchema>
>;
export type WeddingPermissionMutationResult = Readonly<
  z.input<typeof mutationResultSchema>
>;

interface LoadedWeddingPermissionChange {
  readonly actorIsAssignedLeadPlanner: boolean;
  readonly actorPermissionScopeVersion: string;
  readonly coupleAllowsLeadPlannerAccessManagement: boolean;
  readonly actorMembership: unknown;
  readonly targetMembership: unknown;
  readonly membershipId: string;
  readonly targetPermissionScopeVersion: string;
}

/** Trusted persistence projection used for sensitive access management. */
export interface WeddingPermissionChangeAuthorizationState {
  loadWeddingPermissionChange(input: {
    readonly actorId: string;
    readonly authorizationSession?: unknown;
    readonly membershipId: string;
    readonly weddingId: string;
  }): Promise<LoadedWeddingPermissionChange | undefined>;
}

export interface AuthorizedWeddingPermissionChange {
  readonly authorization: AuthorizationContext;
  readonly beforeMembership: WeddingMembership;
  readonly change: PermissionChangeKind;
  readonly effectiveAccess: EffectiveAccessChange;
  readonly expectedPermissionScopeVersion: string;
  readonly membership: WeddingMembership;
  readonly membershipId: string;
  readonly weddingId: string;
}

export interface PermissionScopeChangeCapture {
  readonly audit: AuditEventEnvelope;
  readonly invalidation: OutboxEventEnvelope;
}

export class PermissionScopeChangeError extends Error {
  readonly failure: "access_denied" | "authorization_unavailable" | "stale";

  constructor(
    failure: "access_denied" | "authorization_unavailable" | "stale",
  ) {
    super("The server could not apply the permission change");
    this.name = "PermissionScopeChangeError";
    this.failure = failure;
  }
}

const issuedChanges = new WeakSet<object>();
const availableChanges = new WeakSet<object>();
const consumedChanges = new WeakSet<object>();
const changeRevalidators = new WeakMap<
  object,
  (authorizationSession: unknown) => Promise<boolean>
>();

export function assertAuthorizedWeddingPermissionChange(
  value: unknown,
): asserts value is AuthorizedWeddingPermissionChange {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !issuedChanges.has(value)
  ) {
    throw new PermissionScopeChangeError("access_denied");
  }
}

function isActive(membership: WeddingMembership, evaluatedAt: Date): boolean {
  return (
    membership.status === "active" &&
    (membership.accessExpiresAt === null ||
      Date.parse(membership.accessExpiresAt) > evaluatedAt.getTime())
  );
}

function membershipsEqual(
  left: WeddingMembership,
  right: WeddingMembership,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function deriveMembership(
  before: WeddingMembership,
  mutation: z.output<typeof mutationSchema>,
): WeddingMembership {
  const candidate = { ...before };
  switch (mutation.kind) {
    case "permissions_changed":
      candidate.permissionOverrides = mutation.permissionOverrides;
      break;
    case "role_changed":
      candidate.role = mutation.role;
      break;
    case "access_revoked":
      if (before.status !== "active")
        throw new PermissionScopeChangeError("access_denied");
      candidate.status = "revoked";
      break;
    case "access_restored":
      if (before.status !== "revoked")
        throw new PermissionScopeChangeError("access_denied");
      candidate.status = "active";
      candidate.accessExpiresAt = mutation.accessExpiresAt;
      break;
    case "expiry_changed":
      if (before.role !== "coordinator" && before.role !== "helper") {
        throw new PermissionScopeChangeError("access_denied");
      }
      candidate.accessExpiresAt = mutation.accessExpiresAt;
      break;
  }
  try {
    return parseWeddingMembership(candidate);
  } catch {
    throw new PermissionScopeChangeError("access_denied");
  }
}

function compareEffectiveAccess(
  before: WeddingMembership,
  after: WeddingMembership,
  evaluatedAt: Date,
): EffectiveAccessChange {
  let expanded = false;
  let reduced = false;
  for (const area of weddingPermissionAreas) {
    for (const action of weddingPermissionActions) {
      for (const relationship of recordRelationships) {
        const request = {
          actorId: before.actorId,
          weddingId: before.weddingId,
          area,
          action,
          relationship,
          visibility: "wedding_shared" as const,
        };
        const wasAllowed = evaluateWeddingRecordPermission(
          before,
          request,
          evaluatedAt,
        ).allowed;
        const isAllowed = evaluateWeddingRecordPermission(
          after,
          request,
          evaluatedAt,
        ).allowed;
        if (wasAllowed && !isAllowed) reduced = true;
        if (!wasAllowed && isAllowed) expanded = true;
      }
    }
  }
  if (expanded && reduced) return "mixed";
  if (expanded) return "expanded";
  if (reduced) return "reduced";
  return "unchanged";
}

interface EvaluatedChange {
  readonly actorId: string;
  readonly actorPermissionScopeVersion: string;
  readonly beforeMembership: WeddingMembership;
  readonly change: PermissionChangeKind;
  readonly correlationId: string;
  readonly effectiveAccess: EffectiveAccessChange;
  readonly expectedPermissionScopeVersion: string;
  readonly membership: WeddingMembership;
  readonly membershipId: string;
  readonly weddingId: string;
}

async function evaluateChange(
  actorInput: unknown,
  commandInput: unknown,
  state: WeddingPermissionChangeAuthorizationState,
  evaluatedAt: Date,
  authorizationSession?: unknown,
): Promise<EvaluatedChange> {
  const actor = actorSchema.safeParse(actorInput);
  const command = commandSchema.safeParse(commandInput);
  if (!actor.success || !command.success)
    throw new PermissionScopeChangeError("access_denied");

  let loaded: LoadedWeddingPermissionChange | undefined;
  try {
    loaded = await state.loadWeddingPermissionChange({
      actorId: actor.data.actorId,
      ...(authorizationSession === undefined ? {} : { authorizationSession }),
      membershipId: command.data.membershipId,
      weddingId: command.data.weddingId,
    });
  } catch {
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  if (!loaded || loaded.membershipId !== command.data.membershipId) {
    throw new PermissionScopeChangeError("access_denied");
  }
  const actorVersion = versionSchema.safeParse(
    loaded.actorPermissionScopeVersion,
  );
  const targetVersion = versionSchema.safeParse(
    loaded.targetPermissionScopeVersion,
  );
  let actorMembership: WeddingMembership;
  let targetMembership: WeddingMembership;
  try {
    actorMembership = parseWeddingMembership(loaded.actorMembership);
    targetMembership = parseWeddingMembership(loaded.targetMembership);
  } catch {
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  if (!actorVersion.success || !targetVersion.success) {
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  if (
    actorMembership.actorId !== actor.data.actorId ||
    actorMembership.weddingId !== command.data.weddingId ||
    targetMembership.weddingId !== command.data.weddingId ||
    !isActive(actorMembership, evaluatedAt) ||
    targetMembership.role === "partner"
  ) {
    throw new PermissionScopeChangeError("access_denied");
  }

  const actorIsPartner = actorMembership.role === "partner";
  const actorIsPermittedLead =
    actorMembership.role === "planner" &&
    loaded.actorIsAssignedLeadPlanner === true &&
    loaded.coupleAllowsLeadPlannerAccessManagement === true &&
    (targetMembership.role === "coordinator" ||
      targetMembership.role === "helper" ||
      targetMembership.role === "read_only_guest");
  if (!actorIsPartner && !actorIsPermittedLead) {
    throw new PermissionScopeChangeError("access_denied");
  }
  if (
    (command.data.mutation.kind === "permissions_changed" ||
      command.data.mutation.kind === "role_changed" ||
      command.data.mutation.kind === "expiry_changed") &&
    targetMembership.role === "planner"
  ) {
    throw new PermissionScopeChangeError("access_denied");
  }

  const membership = deriveMembership(targetMembership, command.data.mutation);
  if (membershipsEqual(targetMembership, membership)) {
    throw new PermissionScopeChangeError("access_denied");
  }
  const effectiveAccess = compareEffectiveAccess(
    targetMembership,
    membership,
    evaluatedAt,
  );
  if (
    command.data.mutation.kind === "access_revoked" &&
    !isActive(targetMembership, evaluatedAt)
  ) {
    throw new PermissionScopeChangeError("access_denied");
  }
  if (command.data.mutation.kind === "access_restored") {
    if (
      (targetMembership.role !== "coordinator" &&
        targetMembership.role !== "helper") ||
      Date.parse(command.data.mutation.accessExpiresAt) <=
        evaluatedAt.getTime() ||
      effectiveAccess !== "expanded"
    ) {
      throw new PermissionScopeChangeError("access_denied");
    }
  }
  return {
    actorId: actor.data.actorId,
    actorPermissionScopeVersion: actorVersion.data,
    beforeMembership: targetMembership,
    change: command.data.mutation.kind,
    correlationId: command.data.correlationId,
    effectiveAccess:
      command.data.mutation.kind === "access_revoked"
        ? "reduced"
        : effectiveAccess,
    expectedPermissionScopeVersion: targetVersion.data,
    membership,
    membershipId: command.data.membershipId,
    weddingId: command.data.weddingId,
  };
}

function evaluatedChangesEqual(
  left: EvaluatedChange,
  right: EvaluatedChange,
): boolean {
  return (
    left.actorId === right.actorId &&
    left.actorPermissionScopeVersion === right.actorPermissionScopeVersion &&
    left.change === right.change &&
    left.correlationId === right.correlationId &&
    left.effectiveAccess === right.effectiveAccess &&
    left.expectedPermissionScopeVersion ===
      right.expectedPermissionScopeVersion &&
    left.membershipId === right.membershipId &&
    left.weddingId === right.weddingId &&
    membershipsEqual(left.beforeMembership, right.beforeMembership) &&
    membershipsEqual(left.membership, right.membership)
  );
}

export async function authorizeWeddingPermissionChange(
  actorInput: unknown,
  commandInput: unknown,
  state: WeddingPermissionChangeAuthorizationState,
  evaluatedAt = new Date(),
): Promise<AuthorizedWeddingPermissionChange> {
  const evaluated = await evaluateChange(
    actorInput,
    commandInput,
    state,
    evaluatedAt,
  );
  const authorization = await resolveAuthorizationContext(
    {
      actorId: evaluated.actorId,
      activeWeddingId: evaluated.weddingId,
      permissionScopeVersion: evaluated.actorPermissionScopeVersion,
      correlationId: evaluated.correlationId,
    },
    { authorize: async () => true },
  );
  const operation = Object.freeze({
    authorization,
    beforeMembership: evaluated.beforeMembership,
    change: evaluated.change,
    effectiveAccess: evaluated.effectiveAccess,
    expectedPermissionScopeVersion: evaluated.expectedPermissionScopeVersion,
    membership: evaluated.membership,
    membershipId: evaluated.membershipId,
    weddingId: evaluated.weddingId,
  });
  issuedChanges.add(operation);
  availableChanges.add(operation);
  changeRevalidators.set(operation, async (authorizationSession) => {
    const current = await evaluateChange(
      actorInput,
      commandInput,
      state,
      new Date(),
      authorizationSession,
    );
    return evaluatedChangesEqual(evaluated, current);
  });
  return operation;
}

/** Single-use, in-transaction revalidation for access-management changes. */
export async function consumeAuthorizedWeddingPermissionChange(
  value: unknown,
  authorizationSession: unknown,
): Promise<AuthorizedWeddingPermissionChange> {
  assertAuthorizedWeddingPermissionChange(value);
  if (!availableChanges.has(value)) {
    throw new PermissionScopeChangeError("access_denied");
  }
  availableChanges.delete(value);
  const revalidate = changeRevalidators.get(value);
  changeRevalidators.delete(value);
  if (!revalidate) throw new PermissionScopeChangeError("access_denied");
  let valid = false;
  try {
    valid = await revalidate(authorizationSession);
  } catch (error) {
    if (error instanceof PermissionScopeChangeError) throw error;
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  if (!valid) throw new PermissionScopeChangeError("stale");
  consumedChanges.add(value);
  return value;
}

/** Derives immutable audit facts only from the consumed capability and the
 * exact authoritative compare-and-swap result returned by persistence. */
export function completeAuthorizedWeddingPermissionChange(
  operation: AuthorizedWeddingPermissionChange,
  resultInput: WeddingPermissionMutationResult,
  eventIdentityInput: PermissionChangeEventIdentity,
): PermissionScopeChangeCapture {
  assertAuthorizedWeddingPermissionChange(operation);
  if (!consumedChanges.has(operation)) {
    throw new PermissionScopeChangeError("access_denied");
  }
  consumedChanges.delete(operation);
  const result = mutationResultSchema.safeParse(resultInput);
  const identity = eventIdentitySchema.safeParse(eventIdentityInput);
  if (!result.success || !identity.success) {
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  let membership: WeddingMembership;
  try {
    membership = parseWeddingMembership(result.data.membership);
  } catch {
    throw new PermissionScopeChangeError("authorization_unavailable");
  }
  if (
    result.data.membershipId !== operation.membershipId ||
    result.data.weddingId !== operation.weddingId ||
    result.data.previousPermissionScopeVersion !==
      operation.expectedPermissionScopeVersion ||
    result.data.permissionScopeVersion ===
      operation.expectedPermissionScopeVersion ||
    !membershipsEqual(membership, operation.membership) ||
    identity.data.auditEventId === identity.data.outboxEventId
  ) {
    throw new PermissionScopeChangeError("stale");
  }
  const audit = createAuditEventEnvelope(operation.authorization, {
    eventId: identity.data.auditEventId,
    eventType: "authorization.permission_scope_changed",
    schemaVersion: 1,
    occurredAt: identity.data.occurredAt,
    subjectType: "wedding_membership",
    subjectId: operation.membershipId,
    metadata: {
      change: operation.change,
      effectiveAccess: operation.effectiveAccess,
      previousPermissionScopeVersion: operation.expectedPermissionScopeVersion,
      permissionScopeVersion: result.data.permissionScopeVersion,
    },
  });
  const invalidation = createOutboxEventEnvelope(operation.authorization, {
    eventId: identity.data.outboxEventId,
    eventType: "authorization.permission_scope_invalidated",
    schemaVersion: 1,
    occurredAt: identity.data.occurredAt,
    payload: {
      change: operation.change,
      effectiveAccess: operation.effectiveAccess,
      membershipId: operation.membershipId,
      permissionScopeVersion: result.data.permissionScopeVersion,
      scope: "wedding",
      scopeId: operation.weddingId,
    },
  });
  return Object.freeze({ audit, invalidation });
}
