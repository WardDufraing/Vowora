import { z } from "zod";

import {
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";
import {
  evaluateIndependentPlannerPrivateRecordPermission,
  evaluateOrganizationPrivateRecordPermission,
  evaluateWeddingRecordPermission,
  parseIndependentPlannerIdentity,
  parseOrganizationMembership,
  parseWeddingMembership,
  weddingPermissionActions,
  weddingPermissionAreas,
  type RecordRelationship,
  type WeddingPermissionAction,
  type WeddingPermissionArea,
} from "./permissions.js";

const actorSchema = z.strictObject({ actorId: z.uuidv7() });
const permissionScopeVersionSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);
const commonOperationSchema = {
  action: z.enum(weddingPermissionActions),
  correlationId: z.uuid(),
} as const;
const weddingOperationSchema = z.discriminatedUnion("resource", [
  z.strictObject({
    ...commonOperationSchema,
    resource: z.literal("existing"),
    recordId: z.uuidv7(),
    weddingId: z.uuidv7(),
  }),
  z.strictObject({
    ...commonOperationSchema,
    resource: z.literal("new"),
    action: z.literal("edit"),
    area: z.enum(weddingPermissionAreas),
    weddingId: z.uuidv7(),
  }),
]);
const organizationOperationSchema = z.strictObject({
  ...commonOperationSchema,
  organizationId: z.uuidv7(),
  recordId: z.uuidv7(),
});
const independentPlannerOperationSchema = z.strictObject({
  ...commonOperationSchema,
  recordId: z.uuidv7(),
});
const weddingRecordSchema = z.strictObject({
  area: z.enum(weddingPermissionAreas),
  relationship: z.enum([
    "workspace",
    "assigned",
    "explicitly_shared",
    "essential_contact",
  ]),
  visibility: z.literal("wedding_shared"),
  weddingId: z.uuidv7(),
});
const organizationRecordSchema = z.strictObject({
  area: z.enum(weddingPermissionAreas),
  organizationId: z.uuidv7(),
  relationship: z.enum([
    "workspace",
    "assigned",
    "explicitly_shared",
    "essential_contact",
  ]),
  visibility: z.literal("organization_private"),
});
const independentPlannerRecordSchema = z.strictObject({
  area: z.enum(weddingPermissionAreas),
  ownerActorId: z.uuidv7(),
  relationship: z.enum([
    "workspace",
    "assigned",
    "explicitly_shared",
    "essential_contact",
  ]),
  visibility: z.literal("independent_planner_private"),
});

export type AuthenticatedActor = Readonly<z.output<typeof actorSchema>>;
export type WeddingServerOperation = Readonly<
  z.input<typeof weddingOperationSchema>
>;
export type OrganizationServerOperation = Readonly<
  z.input<typeof organizationOperationSchema>
>;
export type IndependentPlannerServerOperation = Readonly<
  z.input<typeof independentPlannerOperationSchema>
>;

interface VersionedMembership {
  readonly membership: unknown;
  readonly permissionScopeVersion: string;
}

export interface WeddingRecordAuthorizationProjection {
  readonly area: WeddingPermissionArea;
  readonly relationship: Exclude<RecordRelationship, "new_record">;
  readonly visibility: "wedding_shared";
  readonly weddingId: string;
}

export interface OrganizationRecordAuthorizationProjection {
  readonly area: WeddingPermissionArea;
  readonly organizationId: string;
  readonly relationship: Exclude<RecordRelationship, "new_record">;
  readonly visibility: "organization_private";
}

export interface IndependentPlannerRecordAuthorizationProjection {
  readonly area: WeddingPermissionArea;
  readonly ownerActorId: string;
  readonly relationship: Exclude<RecordRelationship, "new_record">;
  readonly visibility: "independent_planner_private";
}

/**
 * Server-owned authorization state. Implementations load exact membership and
 * record projections from trusted persistence; request bodies never implement
 * this contract and cannot supply relationship or visibility.
 */
export interface ServerAuthorizationState {
  loadWeddingMembership(input: {
    readonly actorId: string;
    readonly weddingId: string;
  }): Promise<VersionedMembership | undefined>;
  loadWeddingRecord(input: {
    readonly actorId: string;
    readonly recordId: string;
  }): Promise<WeddingRecordAuthorizationProjection | undefined>;
  loadOrganizationMembership(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): Promise<VersionedMembership | undefined>;
  loadOrganizationRecord(input: {
    readonly actorId: string;
    readonly recordId: string;
  }): Promise<OrganizationRecordAuthorizationProjection | undefined>;
  loadIndependentPlannerIdentity(input: {
    readonly actorId: string;
  }): Promise<VersionedMembership | undefined>;
  loadIndependentPlannerRecord(input: {
    readonly actorId: string;
    readonly recordId: string;
  }): Promise<IndependentPlannerRecordAuthorizationProjection | undefined>;
}

export type ServerAuthorizationFailure =
  "authentication_required" | "access_denied" | "authorization_unavailable";

export class ServerAuthorizationError extends Error {
  readonly failure: ServerAuthorizationFailure;

  constructor(failure: ServerAuthorizationFailure) {
    super("The server could not authorize the operation");
    this.name = "ServerAuthorizationError";
    this.failure = failure;
  }
}

export interface AuthorizedServerOperation {
  readonly authorization: AuthorizationContext;
  readonly area: WeddingPermissionArea;
  readonly action: WeddingPermissionAction;
  readonly resourceId?: string;
  readonly visibility:
    "wedding_shared" | "organization_private" | "independent_planner_private";
}

const issuedOperations = new WeakSet<object>();

export function assertAuthorizedServerOperation(
  value: unknown,
): asserts value is AuthorizedServerOperation {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !issuedOperations.has(value)
  ) {
    throw new ServerAuthorizationError("access_denied");
  }
}

function parseActor(input: unknown): AuthenticatedActor {
  const parsed = actorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServerAuthorizationError("authentication_required");
  }
  return parsed.data;
}

function deny(): never {
  throw new ServerAuthorizationError("access_denied");
}

function unavailable(): never {
  throw new ServerAuthorizationError("authorization_unavailable");
}

async function mintOperation(input: {
  actorId: string;
  area: WeddingPermissionArea;
  action: WeddingPermissionAction;
  correlationId: string;
  permissionScopeVersion: string;
  resourceId?: string;
  visibility: AuthorizedServerOperation["visibility"];
  weddingId?: string;
  organizationId?: string;
  privateOwnerActorId?: string;
}): Promise<AuthorizedServerOperation> {
  const authorization = await resolveAuthorizationContext(
    {
      actorId: input.actorId,
      ...(input.weddingId ? { activeWeddingId: input.weddingId } : {}),
      ...(input.organizationId
        ? { activeOrganizationId: input.organizationId }
        : {}),
      ...(input.privateOwnerActorId
        ? { activePrivateOwnerActorId: input.privateOwnerActorId }
        : {}),
      permissionScopeVersion: input.permissionScopeVersion,
      correlationId: input.correlationId,
    },
    { authorize: async () => true },
  );
  const operation = Object.freeze({
    authorization,
    area: input.area,
    action: input.action,
    ...(input.resourceId ? { resourceId: input.resourceId } : {}),
    visibility: input.visibility,
  });
  issuedOperations.add(operation);
  return operation;
}

export async function authorizeWeddingServerOperation(
  actorInput: unknown,
  operationInput: unknown,
  state: ServerAuthorizationState,
  evaluatedAt = new Date(),
): Promise<AuthorizedServerOperation> {
  const actor = parseActor(actorInput);
  const operation = weddingOperationSchema.safeParse(operationInput);
  if (!operation.success) deny();

  let membershipState: VersionedMembership | undefined;
  try {
    membershipState = await state.loadWeddingMembership({
      actorId: actor.actorId,
      weddingId: operation.data.weddingId,
    });
  } catch {
    unavailable();
  }
  if (!membershipState) deny();

  const version = permissionScopeVersionSchema.safeParse(
    membershipState.permissionScopeVersion,
  );
  let membership;
  try {
    membership = parseWeddingMembership(membershipState.membership);
  } catch {
    unavailable();
  }
  if (!version.success) unavailable();

  let area: WeddingPermissionArea;
  let relationship: RecordRelationship;
  let resourceId: string | undefined;
  if (operation.data.resource === "new") {
    area = operation.data.area;
    relationship = "new_record";
  } else {
    let loaded: WeddingRecordAuthorizationProjection | undefined;
    try {
      loaded = await state.loadWeddingRecord({
        actorId: actor.actorId,
        recordId: operation.data.recordId,
      });
    } catch {
      unavailable();
    }
    if (!loaded) deny();
    const record = weddingRecordSchema.safeParse(loaded);
    if (!record.success) unavailable();
    if (record.data.weddingId !== operation.data.weddingId) deny();
    area = record.data.area;
    relationship = record.data.relationship;
    resourceId = operation.data.recordId;
  }

  const decision = evaluateWeddingRecordPermission(
    membership,
    {
      actorId: actor.actorId,
      weddingId: operation.data.weddingId,
      area,
      action: operation.data.action,
      relationship,
      visibility: "wedding_shared",
    },
    evaluatedAt,
  );
  if (!decision.allowed) deny();

  return mintOperation({
    actorId: actor.actorId,
    area,
    action: operation.data.action,
    correlationId: operation.data.correlationId,
    permissionScopeVersion: version.data,
    ...(resourceId ? { resourceId } : {}),
    visibility: "wedding_shared",
    weddingId: operation.data.weddingId,
  });
}

export async function authorizeOrganizationServerOperation(
  actorInput: unknown,
  operationInput: unknown,
  state: ServerAuthorizationState,
): Promise<AuthorizedServerOperation> {
  const actor = parseActor(actorInput);
  const operation = organizationOperationSchema.safeParse(operationInput);
  if (!operation.success) deny();

  let membershipState: VersionedMembership | undefined;
  try {
    membershipState = await state.loadOrganizationMembership({
      actorId: actor.actorId,
      organizationId: operation.data.organizationId,
    });
  } catch {
    unavailable();
  }
  if (!membershipState) deny();

  const version = permissionScopeVersionSchema.safeParse(
    membershipState.permissionScopeVersion,
  );
  let membership;
  try {
    membership = parseOrganizationMembership(membershipState.membership);
  } catch {
    unavailable();
  }
  if (!version.success) unavailable();
  if (
    membership.actorId !== actor.actorId ||
    membership.organizationId !== operation.data.organizationId ||
    membership.status !== "active"
  ) {
    deny();
  }

  let loaded: OrganizationRecordAuthorizationProjection | undefined;
  try {
    loaded = await state.loadOrganizationRecord({
      actorId: actor.actorId,
      recordId: operation.data.recordId,
    });
  } catch {
    unavailable();
  }
  if (!loaded) deny();
  const record = organizationRecordSchema.safeParse(loaded);
  if (!record.success) unavailable();
  if (record.data.organizationId !== operation.data.organizationId) deny();

  const decision = evaluateOrganizationPrivateRecordPermission(membership, {
    actorId: actor.actorId,
    organizationId: operation.data.organizationId,
    area: record.data.area,
    action: operation.data.action,
    relationship: record.data.relationship,
    visibility: record.data.visibility,
  });
  if (!decision.allowed) deny();

  return mintOperation({
    actorId: actor.actorId,
    area: record.data.area,
    action: operation.data.action,
    correlationId: operation.data.correlationId,
    organizationId: operation.data.organizationId,
    permissionScopeVersion: version.data,
    resourceId: operation.data.recordId,
    visibility: "organization_private",
  });
}

export async function authorizeIndependentPlannerServerOperation(
  actorInput: unknown,
  operationInput: unknown,
  state: ServerAuthorizationState,
): Promise<AuthorizedServerOperation> {
  const actor = parseActor(actorInput);
  const operation = independentPlannerOperationSchema.safeParse(operationInput);
  if (!operation.success) deny();

  let identityState: VersionedMembership | undefined;
  try {
    identityState = await state.loadIndependentPlannerIdentity({
      actorId: actor.actorId,
    });
  } catch {
    unavailable();
  }
  if (!identityState) deny();

  const version = permissionScopeVersionSchema.safeParse(
    identityState.permissionScopeVersion,
  );
  let identity;
  try {
    identity = parseIndependentPlannerIdentity(identityState.membership);
  } catch {
    unavailable();
  }
  if (!version.success) unavailable();
  if (identity.actorId !== actor.actorId || identity.status !== "active")
    deny();

  let loaded: IndependentPlannerRecordAuthorizationProjection | undefined;
  try {
    loaded = await state.loadIndependentPlannerRecord({
      actorId: actor.actorId,
      recordId: operation.data.recordId,
    });
  } catch {
    unavailable();
  }
  if (!loaded) deny();
  const record = independentPlannerRecordSchema.safeParse(loaded);
  if (!record.success) unavailable();

  const decision = evaluateIndependentPlannerPrivateRecordPermission(identity, {
    actorId: actor.actorId,
    ownerActorId: record.data.ownerActorId,
    area: record.data.area,
    action: operation.data.action,
    relationship: record.data.relationship,
    visibility: record.data.visibility,
  });
  if (!decision.allowed) deny();

  return mintOperation({
    actorId: actor.actorId,
    area: record.data.area,
    action: operation.data.action,
    correlationId: operation.data.correlationId,
    permissionScopeVersion: version.data,
    privateOwnerActorId: actor.actorId,
    resourceId: operation.data.recordId,
    visibility: "independent_planner_private",
  });
}
