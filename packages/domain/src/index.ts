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

declare const validatedAuthorizationContext: unique symbol;

export type AuthorizationContext = Readonly<
  z.output<typeof authorizationContextSchema>
> & { readonly [validatedAuthorizationContext]: true };

export type AuthorizationContextInput = z.input<
  typeof authorizationContextSchema
>;

export class AuthorizationContextError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid authorization context: ${fields.join(", ")}`);
    this.name = "AuthorizationContextError";
    this.fields = fields;
  }
}

/** Validates the transport shape of server-resolved authorization metadata.
 * This does not authenticate the actor or prove membership. The upstream
 * authentication and permission boundary must resolve those facts before it
 * calls an application service; client-submitted IDs are never sufficient. */
export function parseAuthorizationContext(
  input: unknown,
): AuthorizationContext {
  const parsed = authorizationContextSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [
      ...new Set(
        parsed.error.issues.map((issue) => issue.path.join(".") || "context"),
      ),
    ].sort();
    throw new AuthorizationContextError(fields);
  }
  return Object.freeze(parsed.data) as AuthorizationContext;
}

export interface TenantScopedRepository<
  Session,
  Record,
  CreateInput,
  Identifier = string,
> {
  findById(
    session: Session,
    authorization: AuthorizationContext,
    id: Identifier,
  ): Promise<Record | null>;
  create(
    session: Session,
    authorization: AuthorizationContext,
    input: CreateInput,
  ): Promise<Record>;
}
