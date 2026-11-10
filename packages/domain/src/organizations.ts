import { z } from "zod";

import {
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";

const creationSchema = z.strictObject({
  actorId: z.uuidv7(),
  correlationId: z.uuid(),
  creationRequestId: z.uuid(),
  name: z.string().trim().min(1).max(120),
});

const claimSchema = z
  .strictObject({
    actorId: z.uuidv7(),
    correlationId: z.uuid(),
    token: z.string().min(32).max(256).optional(),
    invitationId: z.uuidv7().optional(),
  })
  .refine((value) => Boolean(value.token) !== Boolean(value.invitationId), {
    path: ["invitation"],
  });

declare const organizationCreationBrand: unique symbol;
declare const organizationClaimBrand: unique symbol;

export type AuthorizedOrganizationCreation = Readonly<
  z.output<typeof creationSchema>
> & { readonly [organizationCreationBrand]: true };
export type AuthorizedOrganizationInvitationClaim = Readonly<
  z.output<typeof claimSchema>
> & { readonly [organizationClaimBrand]: true };

export class OrganizationAuthorizationError extends Error {
  constructor(readonly fields: readonly string[]) {
    super("The organization operation is not authorized");
    this.name = "OrganizationAuthorizationError";
  }
}

const issuedCreations = new WeakSet<object>();
const availableCreations = new WeakSet<object>();
const issuedClaims = new WeakSet<object>();
const availableClaims = new WeakSet<object>();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new OrganizationAuthorizationError(
      [
        ...new Set(
          result.error.issues.map((issue) => issue.path.join(".") || "request"),
        ),
      ].sort(),
    );
  }
  return result.data;
}

export function authorizeOrganizationCreation(
  input: unknown,
): AuthorizedOrganizationCreation {
  const command = Object.freeze(
    parse(creationSchema, input),
  ) as AuthorizedOrganizationCreation;
  issuedCreations.add(command);
  availableCreations.add(command);
  return command;
}

export function authorizeOrganizationInvitationClaim(
  input: unknown,
): AuthorizedOrganizationInvitationClaim {
  const command = Object.freeze(
    parse(claimSchema, input),
  ) as AuthorizedOrganizationInvitationClaim;
  issuedClaims.add(command);
  availableClaims.add(command);
  return command;
}

export function assertAuthorizedOrganizationCreation(
  value: unknown,
): asserts value is AuthorizedOrganizationCreation {
  if (
    typeof value !== "object" ||
    value === null ||
    !issuedCreations.has(value)
  ) {
    throw new OrganizationAuthorizationError(["authorization"]);
  }
}

export function assertAuthorizedOrganizationInvitationClaim(
  value: unknown,
): asserts value is AuthorizedOrganizationInvitationClaim {
  if (typeof value !== "object" || value === null || !issuedClaims.has(value)) {
    throw new OrganizationAuthorizationError(["authorization"]);
  }
}

async function organizationContext(
  actorId: string,
  correlationId: string,
  organizationId: string,
): Promise<AuthorizationContext> {
  const parsedId = z.uuidv7().safeParse(organizationId);
  if (!parsedId.success)
    throw new OrganizationAuthorizationError(["organizationId"]);
  return resolveAuthorizationContext(
    {
      actorId,
      activeOrganizationId: parsedId.data,
      permissionScopeVersion: "1",
      correlationId,
    },
    { authorize: async () => true },
  );
}

export async function consumeAuthorizedOrganizationCreation(
  command: AuthorizedOrganizationCreation,
  organizationId: string,
) {
  assertAuthorizedOrganizationCreation(command);
  if (!availableCreations.delete(command)) {
    throw new OrganizationAuthorizationError(["authorization"]);
  }
  return Object.freeze({
    authorization: await organizationContext(
      command.actorId,
      command.correlationId,
      organizationId,
    ),
    command,
  });
}

export async function consumeAuthorizedOrganizationInvitationClaim(
  command: AuthorizedOrganizationInvitationClaim,
  organizationId: string,
) {
  assertAuthorizedOrganizationInvitationClaim(command);
  if (!availableClaims.delete(command)) {
    throw new OrganizationAuthorizationError(["authorization"]);
  }
  return Object.freeze({
    authorization: await organizationContext(
      command.actorId,
      command.correlationId,
      organizationId,
    ),
    command,
  });
}
