import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  assertAuthorizedCoupleWeddingCreation,
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  consumeAuthorizedCoupleWeddingCreation,
  type AuthorizedCoupleWeddingCreation,
  type AuthorizedServerOperation,
  type ServerAuthorizationState,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
} from "./audit-outbox.js";
import {
  auditEvents,
  outboxEvents,
  weddingMemberships,
  weddings,
} from "./schema.js";
import {
  assertAuthorizedRepositoryCall,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
import { createUuidV7 } from "./uuid.js";

type WeddingSchema = {
  auditEvents: typeof auditEvents;
  outboxEvents: typeof outboxEvents;
  weddingMemberships: typeof weddingMemberships;
  weddings: typeof weddings;
};

export type WeddingDatabase<HKT extends PgQueryResultHKT = PgQueryResultHKT> =
  PgDatabase<HKT, WeddingSchema>;

export class WeddingCreationConflictError extends Error {
  constructor() {
    super("The idempotency key was already used for another request");
    this.name = "WeddingCreationConflictError";
  }
}

export class WeddingSettingsConflictError extends Error {
  constructor() {
    super("The wedding settings changed before this update");
    this.name = "WeddingSettingsConflictError";
  }
}

export class WeddingSettingsValidationError extends Error {
  constructor() {
    super("The wedding settings are invalid");
    this.name = "WeddingSettingsValidationError";
  }
}

export interface WeddingView {
  readonly id: string;
  readonly name: string;
  readonly weddingDate: string | null;
  readonly timeZone: string;
  readonly settingsVersion: number;
}

function creationFingerprint(command: AuthorizedCoupleWeddingCreation): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        name: command.name,
        weddingDate: command.weddingDate,
        timeZone: command.timeZone,
      }),
    )
    .digest("hex");
}

function view(row: typeof weddings.$inferSelect): WeddingView {
  return Object.freeze({
    id: row.id,
    name: row.name,
    weddingDate: row.weddingDate,
    timeZone: row.timeZone,
    settingsVersion: row.settingsVersion,
  });
}

/** Bootstrap transaction for the approved couple self-service path. */
export async function createCoupleWedding<HKT extends PgQueryResultHKT>(
  database: WeddingDatabase<HKT>,
  command: AuthorizedCoupleWeddingCreation,
): Promise<{ readonly wedding: WeddingView; readonly replayed: boolean }> {
  assertAuthorizedCoupleWeddingCreation(command);
  const weddingId = createUuidV7();
  const consumed = await consumeAuthorizedCoupleWeddingCreation(
    command,
    weddingId,
  );
  const fingerprint = creationFingerprint(command);
  const now = new Date();
  return database.transaction(async (transaction) => {
    const inserted = await transaction
      .insert(weddings)
      .values({
        id: weddingId,
        name: command.name,
        weddingDate: command.weddingDate,
        timeZone: command.timeZone,
        creationMode: "couple",
        creatorActorId: command.actorId,
        creationRequestId: command.creationRequestId,
        creationRequestFingerprint: fingerprint,
        settingsVersion: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [weddings.creatorActorId, weddings.creationRequestId],
      })
      .returning();

    if (inserted.length === 0) {
      const [existing] = await transaction
        .select()
        .from(weddings)
        .where(
          and(
            eq(weddings.creatorActorId, command.actorId),
            eq(weddings.creationRequestId, command.creationRequestId),
          ),
        )
        .limit(1);
      if (!existing || existing.creationRequestFingerprint !== fingerprint) {
        throw new WeddingCreationConflictError();
      }
      return Object.freeze({ wedding: view(existing), replayed: true });
    }

    await transaction.insert(weddingMemberships).values({
      weddingId,
      actorId: command.actorId,
      role: "partner",
      status: "active",
      accessExpiresAt: null,
      permissionOverrides: [],
      permissionScopeVersion: 1,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      consumed.authorization,
      transaction,
      createAuditEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.workspace_created",
        schemaVersion: 1,
        occurredAt,
        subjectType: "wedding",
        subjectId: weddingId,
        metadata: { creationMode: "couple", settingsVersion: 1 },
      }),
    );
    await appendAuthorizedOutboxEvent(
      consumed.authorization,
      transaction,
      createOutboxEventEnvelope(consumed.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.workspace_created",
        schemaVersion: 1,
        occurredAt,
        payload: { weddingId, settingsVersion: 1 },
      }),
    );
    return Object.freeze({ wedding: view(inserted[0]!), replayed: false });
  });
}

export interface WeddingSettingsPatch {
  readonly expectedVersion: number;
  readonly name: string;
  readonly weddingDate: string | null;
  readonly timeZone: string;
}

function assertSettingsPatch(patch: WeddingSettingsPatch): void {
  let validDate = patch.weddingDate === null;
  if (
    patch.weddingDate !== null &&
    /^\d{4}-\d{2}-\d{2}$/.test(patch.weddingDate)
  ) {
    const [year, month, day] = patch.weddingDate.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day!));
    validDate =
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month! - 1 &&
      parsed.getUTCDate() === day;
  }
  let validTimeZone = false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: patch.timeZone }).format();
    validTimeZone = true;
  } catch {
    validTimeZone = false;
  }
  if (
    !Number.isInteger(patch.expectedVersion) ||
    patch.expectedVersion < 1 ||
    patch.name !== patch.name.trim() ||
    patch.name.length < 1 ||
    patch.name.length > 120 ||
    !validDate ||
    !validTimeZone
  ) {
    throw new WeddingSettingsValidationError();
  }
}

export interface AuthorizedWeddingSettingsView {
  readonly wedding: WeddingView;
  readonly membership: {
    readonly actorId: string;
    readonly weddingId: string;
    readonly role: string;
    readonly status: string;
    readonly accessExpiresAt: string | null;
    readonly permissionOverrides: unknown;
  };
  readonly lastOpenedAt: string;
}

export async function readWeddingSettings<HKT extends PgQueryResultHKT>(
  database: WeddingDatabase<HKT>,
  operation: AuthorizedServerOperation,
): Promise<AuthorizedWeddingSettingsView | undefined> {
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "view",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const weddingId = call.authorization.activeWeddingId!;
    const [row] = await call.session
      .select({ wedding: weddings, membership: weddingMemberships })
      .from(weddings)
      .innerJoin(
        weddingMemberships,
        and(
          eq(weddingMemberships.weddingId, weddings.id),
          eq(weddingMemberships.actorId, call.authorization.actorId),
        ),
      )
      .where(eq(weddings.id, weddingId))
      .limit(1);
    if (!row) return undefined;
    return Object.freeze({
      wedding: view(row.wedding),
      membership: Object.freeze({
        actorId: row.membership.actorId,
        weddingId: row.membership.weddingId,
        role: row.membership.role,
        status: row.membership.status,
        accessExpiresAt: row.membership.accessExpiresAt?.toISOString() ?? null,
        permissionOverrides: row.membership.permissionOverrides,
      }),
      lastOpenedAt: row.membership.lastOpenedAt.toISOString(),
    });
  });
}

export async function updateWeddingSettings<HKT extends PgQueryResultHKT>(
  database: WeddingDatabase<HKT>,
  operation: AuthorizedServerOperation,
  patch: WeddingSettingsPatch,
): Promise<WeddingView> {
  assertSettingsPatch(patch);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const weddingId = call.authorization.activeWeddingId!;
    const now = new Date();
    const [updated] = await call.session
      .update(weddings)
      .set({
        name: patch.name,
        weddingDate: patch.weddingDate,
        timeZone: patch.timeZone,
        settingsVersion: patch.expectedVersion + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddings.id, weddingId),
          eq(weddings.settingsVersion, patch.expectedVersion),
        ),
      )
      .returning();
    if (!updated) throw new WeddingSettingsConflictError();

    const occurredAt = now.toISOString();
    await appendAuthorizedAuditEvent(
      call.authorization,
      call.session,
      createAuditEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.settings_updated",
        schemaVersion: 1,
        occurredAt,
        subjectType: "wedding",
        subjectId: weddingId,
        metadata: {
          previousVersion: patch.expectedVersion,
          settingsVersion: updated.settingsVersion,
        },
      }),
    );
    await appendAuthorizedOutboxEvent(
      call.authorization,
      call.session,
      createOutboxEventEnvelope(call.authorization, {
        eventId: createUuidV7(),
        eventType: "wedding.settings_updated",
        schemaVersion: 1,
        occurredAt,
        payload: { weddingId, settingsVersion: updated.settingsVersion },
      }),
    );
    return view(updated);
  });
}

/** Trusted persistence adapter used by 04-b authorization and revalidation. */
export class DatabaseWeddingAuthorizationState<
  HKT extends PgQueryResultHKT,
> implements ServerAuthorizationState {
  constructor(private readonly database: WeddingDatabase<HKT>) {}

  private session(value: unknown): WeddingDatabase<HKT> {
    return (value ?? this.database) as WeddingDatabase<HKT>;
  }

  async loadWeddingMembership(input: {
    readonly actorId: string;
    readonly authorizationSession?: unknown;
    readonly weddingId: string;
  }) {
    const [row] = await this.session(input.authorizationSession)
      .select()
      .from(weddingMemberships)
      .where(
        and(
          eq(weddingMemberships.actorId, input.actorId),
          eq(weddingMemberships.weddingId, input.weddingId),
        ),
      )
      .limit(1);
    if (!row) return undefined;
    return {
      membership: {
        actorId: row.actorId,
        weddingId: row.weddingId,
        role: row.role,
        status: row.status,
        accessExpiresAt: row.accessExpiresAt?.toISOString() ?? null,
        permissionOverrides: row.permissionOverrides,
      },
      permissionScopeVersion: String(row.permissionScopeVersion),
    };
  }

  async loadWeddingRecord(input: {
    readonly actorId: string;
    readonly authorizationSession?: unknown;
    readonly recordId: string;
  }) {
    const [row] = await this.session(input.authorizationSession)
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, input.recordId))
      .limit(1);
    return row
      ? {
          area: "settings" as const,
          relationship: "workspace" as const,
          visibility: "wedding_shared" as const,
          weddingId: row.id,
        }
      : undefined;
  }

  async loadOrganizationMembership() {
    return undefined;
  }
  async loadOrganizationRecord() {
    return undefined;
  }
  async loadIndependentPlannerIdentity() {
    return undefined;
  }
  async loadIndependentPlannerRecord() {
    return undefined;
  }
}
