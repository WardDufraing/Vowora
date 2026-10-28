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
export { createUuidV7, isUuidV7 } from "./uuid.js";
export {
  assertTenantWriteScope,
  tenantScopePredicate,
  TenantScopeViolationError,
  withAuthorizedTenantTransaction,
  withTenantTransaction,
} from "./tenant.js";
export type {
  TenantScopeColumns,
  TenantScopeValues,
  TenantTransaction,
  TransactionHost,
} from "./tenant.js";
