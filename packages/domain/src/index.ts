export {
  assertAuthorizationContext,
  AuthorizationContextError,
  parseAuthorizationContextInput,
  resolveAuthorizationContext,
} from "./authorization.js";
export type {
  AuthorizationContext,
  AuthorizationContextCandidate,
  AuthorizationContextInput,
  AuthorizationContextVerifier,
  TenantRepositoryCall,
  TenantScopedRepository,
} from "./authorization.js";

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
  assertAuthorizedServerOperation,
  authorizeIndependentPlannerServerOperation,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
} from "./server-authorization.js";
export type {
  AuthenticatedActor,
  AuthorizedServerOperation,
  IndependentPlannerRecordAuthorizationProjection,
  IndependentPlannerServerOperation,
  OrganizationRecordAuthorizationProjection,
  OrganizationServerOperation,
  ServerAuthorizationFailure,
  ServerAuthorizationState,
  WeddingRecordAuthorizationProjection,
  WeddingServerOperation,
} from "./server-authorization.js";
