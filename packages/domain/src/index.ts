export {
  assertAuthorizationContext,
  AuthorizationContextError,
} from "./authorization.js";
export type { AuthorizationContext } from "./authorization.js";

export {
  assertAuditEventEnvelope,
  assertOutboxEventEnvelope,
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  EventEnvelopeValidationError,
} from "./events.js";
export type {
  AuditEventEnvelope,
  AuditEventInput,
  EventEnvelopeIdentity,
  EventJsonValue,
  EventTenantScope,
  OutboxEventEnvelope,
  OutboxEventInput,
} from "./events.js";
export {
  createPermissionScopeChangeCapture,
  effectiveAccessChanges,
  permissionChangeKinds,
  PermissionScopeChangeValidationError,
} from "./permission-changes.js";
export type {
  EffectiveAccessChange,
  PermissionChangeKind,
  PermissionScopeChangeCapture,
  PermissionScopeChangeInput,
} from "./permission-changes.js";
export {
  canRemoveWeddingMembership,
  evaluateIndependentPlannerPrivateRecordPermission,
  evaluateOrganizationPrivateRecordPermission,
  evaluateWeddingRecordPermission,
  parseIndependentPlannerIdentity,
  parseOrganizationMembership,
  parseWeddingMembership,
  PermissionModelValidationError,
  recordRelationships,
  weddingPermissionActions,
  weddingPermissionAreas,
  weddingRolePresets,
} from "./permissions.js";
export type {
  IndependentPlannerIdentity,
  IndependentPlannerPrivateRecordPermissionRequest,
  OrganizationMembership,
  OrganizationPrivateRecordPermissionRequest,
  PermissionDecision,
  PermissionDecisionReason,
  PermissionOverride,
  PermissionScope,
  RecordRelationship,
  WeddingMembership,
  WeddingPermissionAction,
  WeddingPermissionArea,
  WeddingRecordPermissionRequest,
  WeddingRolePreset,
} from "./permissions.js";
export {
  assertAuthorizedOperationRequirement,
  assertAuthorizedServerOperation,
  authorizeIndependentPlannerServerOperation,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
  consumeAuthorizedServerOperation,
  ServerAuthorizationError,
} from "./server-authorization.js";
export type {
  AuthenticatedActor,
  AuthorizedServerOperation,
  AuthorizedOperationRequirement,
  IndependentPlannerRecordAuthorizationProjection,
  IndependentPlannerServerOperation,
  OrganizationRecordAuthorizationProjection,
  OrganizationServerOperation,
  ServerAuthorizationFailure,
  ServerAuthorizationState,
  WeddingRecordAuthorizationProjection,
  WeddingServerOperation,
} from "./server-authorization.js";
