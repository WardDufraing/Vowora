import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const cursorPayloadSchema = z.strictObject({
  v: z.literal(1),
  actorId: z.string().min(1).max(128),
  weddingId: z.uuidv7(),
  permissionScopeVersion: z.string().min(1).max(256),
  kind: z.enum(["task", "milestone"]),
  sort: z.literal("id_asc"),
  limit: z.number().int().min(1).max(100),
  afterId: z.uuidv7(),
});

type PlanningCursorPayload = z.infer<typeof cursorPayloadSchema>;

export class PlanningCursorError extends Error {
  constructor() {
    super("The planning cursor is invalid");
    this.name = "PlanningCursorError";
  }
}

function signature(secret: string, payload: string) {
  return createHmac("sha256", secret)
    .update("vowora:planning-cursor:v1\0")
    .update(payload)
    .digest();
}

export function encodePlanningCursor(
  secret: string,
  input: Omit<PlanningCursorPayload, "v" | "sort">,
) {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, sort: "id_asc", ...input }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${signature(secret, payload).toString("base64url")}`;
}

export function decodePlanningCursor(
  secret: string,
  cursor: string,
  expected: Omit<PlanningCursorPayload, "v" | "sort" | "afterId">,
) {
  const [payload, supplied, extra] = cursor.split(".");
  if (!payload || !supplied || extra !== undefined)
    throw new PlanningCursorError();
  let suppliedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(supplied, "base64url");
  } catch {
    throw new PlanningCursorError();
  }
  const expectedSignature = signature(secret, payload);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  )
    throw new PlanningCursorError();
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new PlanningCursorError();
  }
  const result = cursorPayloadSchema.safeParse(parsed);
  if (!result.success) throw new PlanningCursorError();
  const value = result.data;
  if (
    value.actorId !== expected.actorId ||
    value.weddingId !== expected.weddingId ||
    value.permissionScopeVersion !== expected.permissionScopeVersion ||
    value.kind !== expected.kind ||
    value.limit !== expected.limit
  )
    throw new PlanningCursorError();
  return value.afterId;
}
