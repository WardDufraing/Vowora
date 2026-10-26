import { describe, expect, it } from "vitest";

import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  EventEnvelopeValidationError,
} from "./events.js";
import {
  parseAuthorizationContextInput,
  resolveAuthorizationContext,
  type AuthorizationContext,
} from "./index.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const organizationId = "019a1f5e-70a0-7000-8000-000000000003";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";
const eventId = "019a1f5e-70a0-7000-8000-000000000010";
const occurredAt = "2026-10-26T10:00:00.000Z";

async function authorization() {
  return resolveAuthorizationContext(
    {
      actorId,
      activeWeddingId: weddingId,
      activeOrganizationId: organizationId,
      permissionScopeVersion: "synthetic:1",
      correlationId,
    },
    { authorize: async () => true },
  );
}

describe("audit and outbox event envelopes", () => {
  it("stamps immutable audit and outbox envelopes from trusted scope", async () => {
    const context = await authorization();
    const audit = createAuditEventEnvelope(context, {
      eventId,
      eventType: "wedding.settings_changed",
      schemaVersion: 1,
      occurredAt,
      subjectType: "wedding",
      subjectId: weddingId,
      metadata: { changedFields: ["timezone"] },
    });
    const outbox = createOutboxEventEnvelope(context, {
      eventId,
      eventType: "wedding.settings_changed",
      schemaVersion: 1,
      occurredAt,
      payload: { weddingId },
    });

    for (const envelope of [audit, outbox]) {
      expect(envelope).toMatchObject({
        actorId,
        weddingId,
        organizationId,
        correlationId,
        eventId,
        schemaVersion: 1,
      });
      expect(Object.isFrozen(envelope)).toBe(true);
    }
    expect(Object.isFrozen(audit.metadata)).toBe(true);
    expect(Object.isFrozen(outbox.payload)).toBe(true);
  });

  it("rejects malformed, over-posted and non-JSON data without reflecting values", async () => {
    const context = await authorization();
    const privateValue = "private-invalid-event-name";
    for (const input of [
      {
        eventId,
        eventType: privateValue,
        schemaVersion: 1,
        occurredAt,
        payload: {},
      },
      {
        eventId,
        eventType: "wedding.changed",
        schemaVersion: 0,
        occurredAt,
        payload: {},
      },
      {
        eventId,
        eventType: "wedding.changed",
        schemaVersion: 1,
        occurredAt,
        payload: { unsupported: undefined },
      },
      {
        eventId,
        eventType: "wedding.changed",
        schemaVersion: 1,
        occurredAt,
        payload: {},
        untrustedTenant: weddingId,
      },
    ]) {
      let caught: unknown;
      try {
        createOutboxEventEnvelope(context, input as never);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(EventEnvelopeValidationError);
      expect(String(caught)).not.toContain(privateValue);
    }
  });

  it("rejects unresolved and cloned authorization before creating events", async () => {
    const resolved = await authorization();
    const unresolved = parseAuthorizationContextInput({
      actorId,
      activeWeddingId: weddingId,
      permissionScopeVersion: "synthetic:1",
      correlationId,
    });
    const input = {
      eventId,
      eventType: "wedding.changed",
      schemaVersion: 1,
      occurredAt,
      payload: {},
    } as const;

    for (const forged of [unresolved, { ...resolved }]) {
      expect(() =>
        createOutboxEventEnvelope(
          forged as unknown as AuthorizationContext,
          input,
        ),
      ).toThrow();
    }
  });
});
