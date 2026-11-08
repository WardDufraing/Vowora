import { z } from "zod";

import {
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";

const claimSchema = z.strictObject({
  actorId: z.uuidv7(),
  correlationId: z.uuid(),
  invitationId: z.uuidv7(),
  weddingId: z.uuidv7(),
});

declare const authorizedInvitationClaim: unique symbol;

export type AuthorizedWeddingInvitationClaim = Readonly<
  z.output<typeof claimSchema>
> & { readonly [authorizedInvitationClaim]: true };

export class WeddingInvitationClaimAuthorizationError extends Error {
  constructor() {
    super("The wedding invitation claim is not authorized");
    this.name = "WeddingInvitationClaimAuthorizationError";
  }
}

const issued = new WeakSet<object>();
const available = new WeakSet<object>();

/**
 * Mints the one-time event capability only after persistence has locked and
 * validated the invitation, verified account email, and expiry. It cannot be
 * used to establish invitation eligibility by itself.
 */
export function authorizeWeddingInvitationClaim(
  input: unknown,
): AuthorizedWeddingInvitationClaim {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) throw new WeddingInvitationClaimAuthorizationError();
  const claim = Object.freeze(parsed.data) as AuthorizedWeddingInvitationClaim;
  issued.add(claim);
  available.add(claim);
  return claim;
}

export async function consumeAuthorizedWeddingInvitationClaim(
  value: unknown,
): Promise<AuthorizationContext> {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !issued.has(value) ||
    !available.has(value)
  ) {
    throw new WeddingInvitationClaimAuthorizationError();
  }
  available.delete(value);
  const claim = value as AuthorizedWeddingInvitationClaim;
  return resolveAuthorizationContext(
    {
      actorId: claim.actorId,
      activeWeddingId: claim.weddingId,
      permissionScopeVersion: `invitation:${claim.invitationId}`,
      correlationId: claim.correlationId,
    },
    { authorize: async () => true },
  );
}
