import { z } from "zod";

import { resolveAuthorizationContext } from "./authorization.js";

const noteSchema = z
  .strictObject({
    actorId: z.uuidv7(),
    correlationId: z.uuid(),
    organizationId: z.uuidv7(),
    action: z.enum(["list", "create", "update", "archive"]),
    noteId: z.uuidv7().optional(),
  })
  .superRefine((value, context) => {
    const requiresNote =
      value.action === "update" || value.action === "archive";
    if (requiresNote !== Boolean(value.noteId)) {
      context.addIssue({
        code: "custom",
        path: ["noteId"],
        message: requiresNote
          ? "A note is required for this action"
          : "This action cannot target a note",
      });
    }
  });
const handoverSchema = z.strictObject({
  actorId: z.uuidv7(),
  correlationId: z.uuid(),
  organizationId: z.uuidv7(),
  accessId: z.uuidv7(),
  mode: z.enum(["guided", "immediate"]),
  requestId: z.uuid(),
});

declare const noteBrand: unique symbol;
declare const handoverBrand: unique symbol;
export type AuthorizedOrganizationPrivateNote = Readonly<
  z.output<typeof noteSchema>
> & { readonly [noteBrand]: true };
export type AuthorizedOrganizationHandover = Readonly<
  z.output<typeof handoverSchema>
> & { readonly [handoverBrand]: true };

const issuedNotes = new WeakSet<object>();
const availableNotes = new WeakSet<object>();
const issuedHandovers = new WeakSet<object>();
const availableHandovers = new WeakSet<object>();

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error("The organization-private operation is invalid");
  return result.data;
}

export function authorizeOrganizationPrivateNote(
  value: unknown,
): AuthorizedOrganizationPrivateNote {
  const command = Object.freeze(
    parse(noteSchema, value),
  ) as AuthorizedOrganizationPrivateNote;
  issuedNotes.add(command);
  availableNotes.add(command);
  return command;
}

export function authorizeOrganizationHandover(
  value: unknown,
): AuthorizedOrganizationHandover {
  const command = Object.freeze(
    parse(handoverSchema, value),
  ) as AuthorizedOrganizationHandover;
  issuedHandovers.add(command);
  availableHandovers.add(command);
  return command;
}

async function consume<
  T extends { actorId: string; correlationId: string; organizationId: string },
>(
  value: unknown,
  issued: WeakSet<object>,
  available: WeakSet<object>,
  version: string,
  activeWeddingId?: string,
) {
  if (
    typeof value !== "object" ||
    value === null ||
    !issued.has(value) ||
    !available.delete(value)
  ) {
    throw new Error("The organization-private authorization is unavailable");
  }
  const command = value as T;
  return Object.freeze({
    command,
    authorization: await resolveAuthorizationContext(
      {
        actorId: command.actorId,
        activeWeddingId,
        activeOrganizationId: command.organizationId,
        permissionScopeVersion: version,
        correlationId: command.correlationId,
      },
      { authorize: async () => true },
    ),
  });
}

export function consumeAuthorizedOrganizationPrivateNote(
  command: AuthorizedOrganizationPrivateNote,
  version: number,
) {
  return consume(
    command,
    issuedNotes,
    availableNotes,
    `private-note:${version}`,
  );
}

export function consumeAuthorizedOrganizationHandover(
  command: AuthorizedOrganizationHandover,
  version: number,
  weddingId: string,
) {
  return consume(
    command,
    issuedHandovers,
    availableHandovers,
    `handover:${version}`,
    z.uuidv7().parse(weddingId),
  );
}
