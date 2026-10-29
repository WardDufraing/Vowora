export {
  DatabaseConfigurationError,
  parseRuntimeDatabaseConfig,
} from "./config.js";
export { createRuntimeDatabase } from "./client.js";
export { createAuthCredentialLock } from "./auth-credential-lock.js";
export type {
  AuthCredentialLock,
  AuthCredentialLockTarget,
} from "./auth-credential-lock.js";
export { account, session, user, verification } from "./schema.js";
export { AuditEventWriter, OutboxEventWriter } from "./audit-outbox.js";
export type { AuditOutboxSession } from "./audit-outbox.js";
export {
  assertAuthorizedWeddingPermissionChangeCall,
  withAuditedWeddingPermissionChange,
} from "./permission-changes.js";
export type {
  AuthorizedWeddingPermissionChangeCall,
  WeddingPermissionChangeRepository,
  WeddingPermissionMutationRequirement,
} from "./permission-changes.js";
export { createUuidV7, isUuidV7 } from "./uuid.js";
export {
  assertAuthorizedRepositoryCall,
  assertTenantWriteScope,
  tenantScopePredicate,
  TenantScopeViolationError,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
export type {
  AuthorizedTenantTransaction,
  TenantScopeColumns,
  TenantScopeValues,
  TransactionHost,
} from "./tenant.js";
