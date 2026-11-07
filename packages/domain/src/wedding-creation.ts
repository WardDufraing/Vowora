import { z } from "zod";

import {
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./authorization.js";

const commandSchema = z.strictObject({
  actorId: z.uuidv7(),
  correlationId: z.uuid(),
  creationRequestId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  weddingDate: z.iso.date().nullable(),
  timeZone: z.string().min(1).max(64),
});

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

declare const authorizedWeddingCreation: unique symbol;

export type CoupleWeddingCreationInput = Readonly<
  z.input<typeof commandSchema>
>;

export type AuthorizedCoupleWeddingCreation = Readonly<
  z.output<typeof commandSchema>
> & { readonly [authorizedWeddingCreation]: true };

export interface ConsumedCoupleWeddingCreation {
  readonly authorization: AuthorizationContext;
  readonly command: AuthorizedCoupleWeddingCreation;
}

export class WeddingCreationAuthorizationError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super("The wedding creation request is not authorized");
    this.name = "WeddingCreationAuthorizationError";
    this.fields = fields;
  }
}

const issued = new WeakSet<object>();
const available = new WeakSet<object>();

/**
 * Authorizes the couple self-service bootstrap path. The caller supplies the
 * actor from an authenticated server session. Professional-planner creation
 * deliberately has no public command until authoritative professional
 * identity persistence exists.
 */
export function authorizeCoupleWeddingCreation(
  input: unknown,
): AuthorizedCoupleWeddingCreation {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success || !isIanaTimeZone(parsed.data.timeZone)) {
    const fields = parsed.success
      ? ["timeZone"]
      : [
          ...new Set(
            parsed.error.issues.map(
              (issue) => issue.path.join(".") || "request",
            ),
          ),
        ].sort();
    throw new WeddingCreationAuthorizationError(fields);
  }
  const command = Object.freeze(parsed.data) as AuthorizedCoupleWeddingCreation;
  issued.add(command);
  available.add(command);
  return command;
}

export function assertAuthorizedCoupleWeddingCreation(
  value: unknown,
): asserts value is AuthorizedCoupleWeddingCreation {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !issued.has(value)
  ) {
    throw new WeddingCreationAuthorizationError(["authorization"]);
  }
}

/** Consumes one bootstrap command and binds its authorization to the new ID. */
export async function consumeAuthorizedCoupleWeddingCreation(
  value: unknown,
  weddingId: string,
): Promise<ConsumedCoupleWeddingCreation> {
  assertAuthorizedCoupleWeddingCreation(value);
  if (!available.has(value)) {
    throw new WeddingCreationAuthorizationError(["authorization"]);
  }
  const parsedWeddingId = z.uuidv7().safeParse(weddingId);
  if (!parsedWeddingId.success) {
    throw new WeddingCreationAuthorizationError(["weddingId"]);
  }
  available.delete(value);
  const authorization = await resolveAuthorizationContext(
    {
      actorId: value.actorId,
      activeWeddingId: parsedWeddingId.data,
      permissionScopeVersion: "1",
      correlationId: value.correlationId,
    },
    { authorize: async () => true },
  );
  return Object.freeze({ authorization, command: value });
}
