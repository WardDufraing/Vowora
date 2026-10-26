import { z } from "zod";

const scopeVersion = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

const authorizationContextSchema = z
  .strictObject({
    actorId: z.uuidv7(),
    activeWeddingId: z.uuidv7().optional(),
    activeOrganizationId: z.uuidv7().optional(),
    permissionScopeVersion: scopeVersion,
    correlationId: z.uuid(),
  })
  .refine(
    ({ activeOrganizationId, activeWeddingId }) =>
      activeOrganizationId !== undefined || activeWeddingId !== undefined,
    { message: "At least one tenant scope is required", path: ["scope"] },
  );

declare const parsedAuthorizationCandidate: unique symbol;
declare const resolvedAuthorizationContext: unique symbol;

export type AuthorizationContextInput = z.input<
  typeof authorizationContextSchema
>;

export type AuthorizationContextCandidate = Readonly<
  z.output<typeof authorizationContextSchema>
> & { readonly [parsedAuthorizationCandidate]: true };

export type AuthorizationContext = AuthorizationContextCandidate & {
  readonly [resolvedAuthorizationContext]: true;
};

export interface AuthorizationContextVerifier {
  /** Verify the actor and requested tenant scope against authoritative
   * authentication, membership and permission state. */
  authorize(candidate: AuthorizationContextCandidate): Promise<boolean>;
}

export class AuthorizationContextError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid authorization context: ${fields.join(", ")}`);
    this.name = "AuthorizationContextError";
    this.fields = fields;
  }
}

const issuedAuthorizationContexts = new WeakSet<object>();

/** Parses untrusted metadata into a frozen candidate. A candidate has no
 * authorization provenance and cannot be supplied to repositories. */
export function parseAuthorizationContextInput(
  input: unknown,
): AuthorizationContextCandidate {
  const parsed = authorizationContextSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [
      ...new Set(
        parsed.error.issues.map((issue) => issue.path.join(".") || "context"),
      ),
    ].sort();
    throw new AuthorizationContextError(fields);
  }
  return Object.freeze(parsed.data) as AuthorizationContextCandidate;
}

/** Resolves a structurally valid candidate through the authoritative boundary
 * before minting the runtime-registered context repositories accept. The
 * verifier is implemented by authentication/permission infrastructure; this
 * foundation intentionally defines no roles or grants. */
export async function resolveAuthorizationContext(
  input: unknown,
  verifier: AuthorizationContextVerifier,
): Promise<AuthorizationContext> {
  const candidate = parseAuthorizationContextInput(input);
  let authorized = false;
  try {
    authorized = await verifier.authorize(candidate);
  } catch {
    throw new AuthorizationContextError(["authorization"]);
  }
  if (authorized !== true)
    throw new AuthorizationContextError(["authorization"]);

  const context = Object.freeze({ ...candidate }) as AuthorizationContext;
  issuedAuthorizationContexts.add(context);
  return context;
}

/** Runtime provenance check used before any scoped SQL or transaction opens. */
export function assertAuthorizationContext(
  value: unknown,
): asserts value is AuthorizationContext {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !issuedAuthorizationContexts.has(value)
  ) {
    throw new AuthorizationContextError(["authorization"]);
  }
}

export interface TenantRepositoryCall<Session> {
  readonly authorization: AuthorizationContext;
  readonly session: Session;
}

/** Validates that every operation in a domain-owned repository declares a
 * scoped call as its first argument. Operations can be reads, writes or
 * domain-specific methods; unscoped and non-function members become `never`
 * and therefore cannot satisfy the contract. */
export type TenantScopedRepository<Session, Operations> = {
  [Operation in keyof Operations]: Operations[Operation] extends (
    ...arguments_: infer Arguments
  ) => infer Result
    ? Arguments extends [TenantRepositoryCall<Session>, ...unknown[]]
      ? (...arguments_: Arguments) => Result
      : never
    : never;
};

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
