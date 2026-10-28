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
    activePrivateOwnerActorId: z.uuidv7().optional(),
    permissionScopeVersion: scopeVersion,
    correlationId: z.uuid(),
  })
  .refine(
    ({ activeOrganizationId, activePrivateOwnerActorId, activeWeddingId }) =>
      activeOrganizationId !== undefined ||
      activeWeddingId !== undefined ||
      activePrivateOwnerActorId !== undefined,
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
  if (authorized !== true) {
    throw new AuthorizationContextError(["authorization"]);
  }

  const context = Object.freeze({ ...candidate }) as AuthorizationContext;
  issuedAuthorizationContexts.add(context);
  return context;
}

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

export type TenantScopedRepository<Session, Operations> = {
  [Operation in keyof Operations]: Operations[Operation] extends (
    ...arguments_: infer Arguments
  ) => infer Result
    ? Arguments extends [TenantRepositoryCall<Session>, ...unknown[]]
      ? (...arguments_: Arguments) => Result
      : never
    : never;
};
