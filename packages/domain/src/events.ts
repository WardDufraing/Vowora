import { z } from "zod";

import {
  assertAuthorizationContext,
  type AuthorizationContext,
} from "./index.js";

export type EventJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly EventJsonValue[]
  | { readonly [key: string]: EventJsonValue };

const eventJsonValueSchema: z.ZodType<EventJsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(eventJsonValueSchema),
    z.record(z.string(), eventJsonValueSchema),
  ]),
);

const eventJsonObjectSchema = z.record(z.string(), eventJsonValueSchema);
const maximumEventJsonBytes = 16_384;
const maximumEventJsonDepth = 16;
const maximumEventJsonEntries = 512;
const maximumEventJsonKeyLength = 128;
const maximumEventJsonStringLength = 4_096;
const eventNameSchema = z
  .string()
  .min(3)
  .max(128)
  .regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);

const eventInputBaseSchema = z.strictObject({
  eventId: z.uuidv7(),
  eventType: eventNameSchema,
  schemaVersion: z.number().int().positive().max(32_767),
  occurredAt: z.iso.datetime({ offset: true }),
});

const auditEventInputSchema = eventInputBaseSchema.extend({
  subjectType: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  subjectId: z.uuidv7(),
  metadata: eventJsonObjectSchema,
});

const outboxEventInputSchema = eventInputBaseSchema.extend({
  payload: eventJsonObjectSchema,
});

export type AuditEventInput = Readonly<z.input<typeof auditEventInputSchema>>;
export type OutboxEventInput = Readonly<z.input<typeof outboxEventInputSchema>>;

export interface EventTenantScope {
  readonly weddingId?: string;
  readonly organizationId?: string;
}

export interface EventEnvelopeIdentity extends EventTenantScope {
  readonly eventId: string;
  readonly eventType: string;
  readonly schemaVersion: number;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface AuditEventEnvelope extends EventEnvelopeIdentity {
  readonly subjectType: string;
  readonly subjectId: string;
  readonly metadata: Readonly<Record<string, EventJsonValue>>;
}

export interface OutboxEventEnvelope extends EventEnvelopeIdentity {
  readonly payload: Readonly<Record<string, EventJsonValue>>;
}

export class EventEnvelopeValidationError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid event envelope: ${fields.join(", ")}`);
    this.name = "EventEnvelopeValidationError";
    this.fields = fields;
  }
}

const issuedAuditEvents = new WeakSet<object>();
const issuedOutboxEvents = new WeakSet<object>();

function freezeJson<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value))
    return value;
  for (const nested of Object.values(value)) freezeJson(nested);
  return Object.freeze(value);
}

function validateEventJson(field: "metadata" | "payload", value: unknown) {
  const reject = (): never => {
    throw new EventEnvelopeValidationError([field]);
  };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    reject();
  }

  const seen = new WeakSet<object>();
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let entries = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;
    const candidate = current.value;
    if (candidate === null || typeof candidate === "boolean") continue;
    if (typeof candidate === "string") {
      if (candidate.length > maximumEventJsonStringLength) reject();
      continue;
    }
    if (typeof candidate === "number") {
      if (!Number.isFinite(candidate)) reject();
      continue;
    }
    if (typeof candidate !== "object") {
      reject();
    }
    const objectCandidate = candidate as object;
    if (current.depth > maximumEventJsonDepth || seen.has(objectCandidate))
      reject();
    seen.add(objectCandidate);

    if (Object.getOwnPropertySymbols(objectCandidate).length > 0) reject();

    if (Array.isArray(objectCandidate)) {
      if (objectCandidate.length > maximumEventJsonEntries) reject();
    } else {
      const prototype = Object.getPrototypeOf(objectCandidate);
      if (prototype !== Object.prototype && prototype !== null) reject();
    }
    const descriptors = Object.getOwnPropertyDescriptors(objectCandidate);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      entries += 1;
      if (
        entries > maximumEventJsonEntries ||
        key.length > maximumEventJsonKeyLength ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined
      ) {
        reject();
      }
      pending.push({ value: descriptor.value, depth: current.depth + 1 });
    }
  }

  const serialized = JSON.stringify(value);
  if (
    serialized === undefined ||
    new TextEncoder().encode(serialized).byteLength > maximumEventJsonBytes
  ) {
    reject();
  }
}

function parseEventInput<Output>(
  schema: z.ZodType<Output>,
  input: unknown,
): Output {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = [
      ...new Set(
        parsed.error.issues.map((issue) => {
          const root = String(issue.path[0] ?? "event");
          return root === "payload" || root === "metadata"
            ? root
            : issue.path.join(".") || "event";
        }),
      ),
    ].sort();
    throw new EventEnvelopeValidationError(fields);
  }
  return parsed.data;
}

function identityFromAuthorization(authorization: AuthorizationContext) {
  assertAuthorizationContext(authorization);
  return {
    actorId: authorization.actorId,
    correlationId: authorization.correlationId,
    ...(authorization.activeWeddingId === undefined
      ? {}
      : { weddingId: authorization.activeWeddingId }),
    ...(authorization.activeOrganizationId === undefined
      ? {}
      : { organizationId: authorization.activeOrganizationId }),
  };
}

/** Creates a privacy-minimized audit envelope from validated application data.
 * Metadata must contain only the identifiers/state needed for the audit use
 * case; domain services remain responsible for excluding secrets and PII. */
export function createAuditEventEnvelope(
  authorization: AuthorizationContext,
  input: AuditEventInput,
): AuditEventEnvelope {
  validateEventJson(
    "metadata",
    typeof input === "object" && input !== null
      ? (input as AuditEventInput).metadata
      : undefined,
  );
  const parsed = parseEventInput(auditEventInputSchema, input);
  const event = freezeJson({
    ...parsed,
    ...identityFromAuthorization(authorization),
  });
  issuedAuditEvents.add(event);
  return event;
}

/** Creates a versioned domain-event envelope. Dispatchers and consumers must
 * use eventId as their idempotency key and revalidate current authorization
 * when executing a background action. */
export function createOutboxEventEnvelope(
  authorization: AuthorizationContext,
  input: OutboxEventInput,
): OutboxEventEnvelope {
  validateEventJson(
    "payload",
    typeof input === "object" && input !== null
      ? (input as OutboxEventInput).payload
      : undefined,
  );
  const parsed = parseEventInput(outboxEventInputSchema, input);
  const event = freezeJson({
    ...parsed,
    ...identityFromAuthorization(authorization),
  });
  issuedOutboxEvents.add(event);
  return event;
}

function assertIssuedEvent(
  value: unknown,
  registry: WeakSet<object>,
): asserts value is object {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    !registry.has(value)
  ) {
    throw new EventEnvelopeValidationError(["event"]);
  }
}

export function assertAuditEventEnvelope(
  value: unknown,
): asserts value is AuditEventEnvelope {
  assertIssuedEvent(value, issuedAuditEvents);
}

export function assertOutboxEventEnvelope(
  value: unknown,
): asserts value is OutboxEventEnvelope {
  assertIssuedEvent(value, issuedOutboxEvents);
}
