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

function parseEventInput<Output>(
  schema: z.ZodType<Output>,
  input: unknown,
): Output {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = [
      ...new Set(
        parsed.error.issues.map((issue) => issue.path.join(".") || "event"),
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
