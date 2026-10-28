import { z } from "zod";

export const weddingPermissionAreas = [
  "tasks",
  "schedule",
  "guests",
  "contacts",
  "vendors",
  "budget",
  "documents",
  "notes",
  "decisions",
] as const;

export const weddingPermissionActions = [
  "view",
  "edit",
  "download_export",
] as const;

export const weddingRolePresets = [
  "partner",
  "planner",
  "coordinator",
  "helper",
  "read_only_guest",
] as const;

export const recordRelationships = [
  "workspace",
  "assigned",
  "explicitly_shared",
  "new_record",
] as const;

export type WeddingPermissionArea = (typeof weddingPermissionAreas)[number];
export type WeddingPermissionAction = (typeof weddingPermissionActions)[number];
export type WeddingRolePreset = (typeof weddingRolePresets)[number];
export type RecordRelationship = (typeof recordRelationships)[number];

const permissionScopeSchema = z.enum([
  "workspace",
  "assigned",
  "explicitly_shared",
  "assigned_or_shared",
]);

export type PermissionScope = z.output<typeof permissionScopeSchema>;

const permissionOverrideSchema = z.strictObject({
  area: z.enum(weddingPermissionAreas),
  action: z.enum(weddingPermissionActions),
  effect: z.enum(["allow", "deny"]),
  scope: permissionScopeSchema.optional(),
});

export type PermissionOverride = Readonly<
  z.output<typeof permissionOverrideSchema>
>;

const weddingMembershipSchema = z.strictObject({
  actorId: z.uuidv7(),
  weddingId: z.uuidv7(),
  role: z.enum(weddingRolePresets),
  permissionOverrides: z.array(permissionOverrideSchema).max(128).default([]),
});

const organizationMembershipSchema = z.strictObject({
  actorId: z.uuidv7(),
  organizationId: z.uuidv7(),
  permissionOverrides: z.array(permissionOverrideSchema).max(128).default([]),
});

type ParsedWeddingMembership = z.output<typeof weddingMembershipSchema>;
type ParsedOrganizationMembership = z.output<
  typeof organizationMembershipSchema
>;

export type WeddingMembership = Readonly<
  Omit<ParsedWeddingMembership, "permissionOverrides"> & {
    readonly permissionOverrides: readonly PermissionOverride[];
  }
>;
export type OrganizationMembership = Readonly<
  Omit<ParsedOrganizationMembership, "permissionOverrides"> & {
    readonly permissionOverrides: readonly PermissionOverride[];
  }
>;

export type PermissionDecisionReason =
  | "allowed"
  | "actor_mismatch"
  | "cross_tenant"
  | "private_record"
  | "record_out_of_scope"
  | "permission_denied";

export interface PermissionDecision {
  readonly allowed: boolean;
  readonly reason: PermissionDecisionReason;
}

export interface WeddingRecordPermissionRequest {
  readonly actorId: string;
  readonly weddingId: string;
  readonly area: WeddingPermissionArea;
  readonly action: WeddingPermissionAction;
  readonly relationship: RecordRelationship;
  readonly visibility: "wedding_shared";
}

export interface OrganizationPrivateRecordPermissionRequest {
  readonly actorId: string;
  readonly organizationId: string;
  readonly area: WeddingPermissionArea;
  readonly action: WeddingPermissionAction;
  readonly relationship: RecordRelationship;
  readonly visibility: "organization_private";
}

export class PermissionModelValidationError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid permission model: ${fields.join(", ")}`);
    this.name = "PermissionModelValidationError";
    this.fields = fields;
  }
}

function parseMembership(
  schema: typeof weddingMembershipSchema,
  input: unknown,
): WeddingMembership;
function parseMembership(
  schema: typeof organizationMembershipSchema,
  input: unknown,
): OrganizationMembership;
function parseMembership(
  schema: typeof weddingMembershipSchema | typeof organizationMembershipSchema,
  input: unknown,
): WeddingMembership | OrganizationMembership {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new PermissionModelValidationError(
      [
        ...new Set(
          parsed.error.issues.map(
            (issue) => issue.path.join(".") || "membership",
          ),
        ),
      ].sort(),
    );
  }

  const duplicateKeys = new Set<string>();
  for (const override of parsed.data.permissionOverrides) {
    const key = `${override.area}:${override.action}`;
    if (duplicateKeys.has(key)) {
      throw new PermissionModelValidationError(["permissionOverrides"]);
    }
    duplicateKeys.add(key);
    if (override.effect === "allow" && override.scope === undefined) {
      throw new PermissionModelValidationError(["permissionOverrides.scope"]);
    }
    if (override.effect === "deny" && override.scope !== undefined) {
      throw new PermissionModelValidationError(["permissionOverrides.scope"]);
    }
  }

  return Object.freeze({
    ...parsed.data,
    permissionOverrides: Object.freeze(
      parsed.data.permissionOverrides.map((override) =>
        Object.freeze({ ...override }),
      ),
    ),
  });
}

/** Parses an authoritative wedding-membership projection before policy use. */
export function parseWeddingMembership(input: unknown): WeddingMembership {
  return parseMembership(weddingMembershipSchema, input);
}

/** Parses an authoritative organization-membership projection before policy use. */
export function parseOrganizationMembership(
  input: unknown,
): OrganizationMembership {
  return parseMembership(organizationMembershipSchema, input);
}

const everyArea = weddingPermissionAreas;

function grant(
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
  scope: PermissionScope,
): PermissionOverride {
  return Object.freeze({ area, action, effect: "allow", scope });
}

const partnerPreset = Object.freeze(
  everyArea.flatMap((area) =>
    weddingPermissionActions.map((action) => grant(area, action, "workspace")),
  ),
);

const plannerPreset = Object.freeze([] as PermissionOverride[]);

const coordinatorPreset = Object.freeze([
  grant("schedule", "view", "workspace"),
  grant("contacts", "view", "explicitly_shared"),
  grant("tasks", "view", "assigned"),
]);

const helperPreset = Object.freeze([
  grant("tasks", "view", "assigned_or_shared"),
  ...everyArea
    .filter((area) => area !== "tasks")
    .map((area) => grant(area, "view", "explicitly_shared")),
]);

const readOnlyGuestPreset = Object.freeze(
  everyArea.map((area) => grant(area, "view", "explicitly_shared")),
);

const rolePresets: Readonly<
  Record<WeddingRolePreset, readonly PermissionOverride[]>
> = Object.freeze({
  partner: partnerPreset,
  planner: plannerPreset,
  coordinator: coordinatorPreset,
  helper: helperPreset,
  read_only_guest: readOnlyGuestPreset,
});

function findGrant(
  grants: readonly PermissionOverride[],
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
): PermissionOverride | undefined {
  return grants.find(
    (candidate) => candidate.area === area && candidate.action === action,
  );
}

function scopeAllows(
  scope: PermissionScope,
  relationship: RecordRelationship,
): boolean {
  if (scope === "workspace") return true;
  if (scope === "assigned_or_shared") {
    return relationship === "assigned" || relationship === "explicitly_shared";
  }
  return scope === relationship;
}

function effectiveGrant(
  preset: readonly PermissionOverride[],
  overrides: readonly PermissionOverride[],
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
): PermissionOverride | undefined {
  return findGrant(overrides, area, action) ?? findGrant(preset, area, action);
}

function actionAllowed(
  preset: readonly PermissionOverride[],
  overrides: readonly PermissionOverride[],
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
  relationship: RecordRelationship,
): boolean {
  const actionGrant = effectiveGrant(preset, overrides, area, action);
  if (actionGrant?.effect !== "allow" || actionGrant.scope === undefined) {
    return false;
  }

  if (relationship === "new_record") {
    if (action !== "edit") return false;
    const viewGrant = effectiveGrant(preset, overrides, area, "view");
    return viewGrant?.effect === "allow" && viewGrant.scope !== undefined;
  }
  if (!scopeAllows(actionGrant.scope, relationship)) return false;

  if (action === "view") return true;
  const viewGrant = effectiveGrant(preset, overrides, area, "view");
  return (
    viewGrant?.effect === "allow" &&
    viewGrant.scope !== undefined &&
    scopeAllows(viewGrant.scope, relationship)
  );
}

function denialReason(
  preset: readonly PermissionOverride[],
  overrides: readonly PermissionOverride[],
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
  relationship: RecordRelationship,
): PermissionDecisionReason {
  const actionGrant = effectiveGrant(preset, overrides, area, action);
  if (actionGrant?.effect !== "allow" || actionGrant.scope === undefined) {
    return "permission_denied";
  }
  if (relationship === "new_record") {
    if (action !== "edit") return "record_out_of_scope";
    return "permission_denied";
  }
  if (!scopeAllows(actionGrant.scope, relationship)) {
    return "record_out_of_scope";
  }
  if (action === "view") return "permission_denied";

  const viewGrant = effectiveGrant(preset, overrides, area, "view");
  if (viewGrant?.effect !== "allow" || viewGrant.scope === undefined) {
    return "permission_denied";
  }
  return scopeAllows(viewGrant.scope, relationship)
    ? "permission_denied"
    : "record_out_of_scope";
}

/**
 * Evaluates shared wedding-record access. Partner equality is structural:
 * partner overrides cannot narrow one partner relative to the other. Other
 * roles start from their preset and use explicit per-area overrides.
 */
export function evaluateWeddingRecordPermission(
  membership: WeddingMembership,
  request: WeddingRecordPermissionRequest,
): PermissionDecision {
  if (membership.actorId !== request.actorId) {
    return { allowed: false, reason: "actor_mismatch" };
  }
  if (membership.weddingId !== request.weddingId) {
    return { allowed: false, reason: "cross_tenant" };
  }

  const preset = rolePresets[membership.role];
  const overrides =
    membership.role === "partner" ? [] : membership.permissionOverrides;
  if (
    !actionAllowed(
      preset,
      overrides,
      request.area,
      request.action,
      request.relationship,
    )
  ) {
    return {
      allowed: false,
      reason: denialReason(
        preset,
        overrides,
        request.area,
        request.action,
        request.relationship,
      ),
    };
  }
  return { allowed: true, reason: "allowed" };
}

/**
 * Evaluates planner-private business data solely through an organization
 * membership. Wedding membership, including partner status, is intentionally
 * insufficient for private organization records.
 */
export function evaluateOrganizationPrivateRecordPermission(
  membership: OrganizationMembership | undefined,
  request: OrganizationPrivateRecordPermissionRequest,
): PermissionDecision {
  if (membership === undefined) {
    return { allowed: false, reason: "private_record" };
  }
  if (membership.actorId !== request.actorId) {
    return { allowed: false, reason: "actor_mismatch" };
  }
  if (membership.organizationId !== request.organizationId) {
    return { allowed: false, reason: "cross_tenant" };
  }
  if (
    !actionAllowed(
      plannerPreset,
      membership.permissionOverrides,
      request.area,
      request.action,
      request.relationship,
    )
  ) {
    return {
      allowed: false,
      reason: denialReason(
        plannerPreset,
        membership.permissionOverrides,
        request.area,
        request.action,
        request.relationship,
      ),
    };
  }
  return { allowed: true, reason: "allowed" };
}

/** Partner memberships are protected from unilateral removal by any member. */
export function canRemoveWeddingMembership(
  actor: WeddingMembership,
  target: WeddingMembership,
): boolean {
  return (
    actor.weddingId === target.weddingId &&
    actor.role === "partner" &&
    target.role !== "partner"
  );
}
