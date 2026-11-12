import { createHash } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  type AuthorizedServerOperation,
  type PermissionOverride,
  weddingPermissionActions,
  weddingPermissionAreas,
} from "@vowora/domain";

import {
  appendAuthorizedAuditEvent,
  appendAuthorizedOutboxEvent,
  type AuditOutboxSession,
} from "./audit-outbox.js";
import {
  auditEvents,
  organizationMemberships,
  organizations,
  outboxEvents,
  user,
  weddingMemberships,
  weddingOrganizationAccesses,
  weddingOrganizationInvitations,
  weddingOrganizationStaffAssignments,
  weddingOrganizationStaffRestrictions,
  weddings,
} from "./schema.js";
import {
  assertAuthorizedRepositoryCall,
  withAuthorizedTenantTransaction,
} from "./tenant.js";
import { createUuidV7 } from "./uuid.js";

type Schema = {
  auditEvents: typeof auditEvents;
  organizationMemberships: typeof organizationMemberships;
  organizations: typeof organizations;
  outboxEvents: typeof outboxEvents;
  user: typeof user;
  weddingMemberships: typeof weddingMemberships;
  weddingOrganizationAccesses: typeof weddingOrganizationAccesses;
  weddingOrganizationInvitations: typeof weddingOrganizationInvitations;
  weddingOrganizationStaffAssignments: typeof weddingOrganizationStaffAssignments;
  weddingOrganizationStaffRestrictions: typeof weddingOrganizationStaffRestrictions;
  weddings: typeof weddings;
};
export type PlannerAssignmentDatabase<
  HKT extends PgQueryResultHKT = PgQueryResultHKT,
> = PgDatabase<HKT, Schema>;

export type PermissionCeilingEntry = Readonly<{
  area: (typeof weddingPermissionAreas)[number];
  actions: readonly (typeof weddingPermissionActions)[number][];
}>;
export class PlannerAssignmentConflictError extends Error {
  constructor(
    readonly reason:
      | "idempotency"
      | "pending_exists"
      | "active_exists"
      | "lead_exists"
      | "ineligible",
  ) {
    super("The planner assignment conflicts with current state");
    this.name = "PlannerAssignmentConflictError";
  }
}
export class PlannerAssignmentUnavailableError extends Error {
  constructor(
    readonly reason: "invalid" | "expired" | "access_denied" | "stale",
  ) {
    super("The planner assignment is unavailable");
    this.name = "PlannerAssignmentUnavailableError";
  }
}
function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function validateCeiling(value: readonly PermissionCeilingEntry[]) {
  const seen = new Set<string>();
  if (value.length > weddingPermissionAreas.length)
    throw new PlannerAssignmentUnavailableError("invalid");
  for (const entry of value) {
    if (
      !weddingPermissionAreas.includes(entry.area) ||
      entry.actions.length === 0
    )
      throw new PlannerAssignmentUnavailableError("invalid");
    for (const action of entry.actions) {
      if (
        !weddingPermissionActions.includes(action) ||
        seen.has(`${entry.area}:${action}`)
      )
        throw new PlannerAssignmentUnavailableError("invalid");
      seen.add(`${entry.area}:${action}`);
    }
    if (
      entry.actions.some((action) => action !== "view") &&
      !entry.actions.includes("view")
    )
      throw new PlannerAssignmentUnavailableError("invalid");
  }
  return [...seen].sort();
}
function overrides(
  entries: readonly PermissionCeilingEntry[],
): PermissionOverride[] {
  return validateCeiling(entries).map((key) => {
    const [area, action] = key.split(":") as [
      (typeof weddingPermissionAreas)[number],
      (typeof weddingPermissionActions)[number],
    ];
    return { area, action, effect: "allow", scope: "workspace" };
  });
}
function assertSubset(
  requested: readonly PermissionCeilingEntry[],
  ceiling: readonly PermissionCeilingEntry[],
) {
  const allowed = new Set(validateCeiling(ceiling));
  if (validateCeiling(requested).some((key) => !allowed.has(key)))
    throw new PlannerAssignmentConflictError("ineligible");
}
function assertWeddingManagement(operation: AuthorizedServerOperation) {
  if (
    operation.area !== "settings" ||
    operation.action !== "edit" ||
    !operation.authorization.activeWeddingId
  )
    throw new PlannerAssignmentUnavailableError("access_denied");
}
function assertOrganizationManagement(operation: AuthorizedServerOperation) {
  if (
    operation.area !== "settings" ||
    operation.action !== "edit" ||
    !operation.authorization.activeOrganizationId
  )
    throw new PlannerAssignmentUnavailableError("access_denied");
}

export async function issueWeddingOrganizationInvitation<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: {
    organizationId: string;
    ceiling: readonly PermissionCeilingEntry[];
    requestId: string;
    reissueInvitationId?: string;
    now?: Date;
  },
) {
  assertWeddingManagement(operation);
  const normalized = validateCeiling(input.ceiling);
  const now = input.now ?? new Date();
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    assertAuthorizedRepositoryCall(call, {
      area: "settings",
      action: "edit",
      resource: { kind: "existing", id: operation.resourceId! },
      visibility: "wedding_shared",
    });
    const weddingId = call.authorization.activeWeddingId!;
    await call.session
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, weddingId))
      .for("update");
    const [org] = await call.session
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);
    if (!org) throw new PlannerAssignmentUnavailableError("invalid");
    const fingerprint = hash({
      organizationId: input.organizationId,
      ceiling: normalized,
      reissueInvitationId: input.reissueInvitationId ?? null,
    });
    const [replay] = await call.session
      .select()
      .from(weddingOrganizationInvitations)
      .where(
        and(
          eq(weddingOrganizationInvitations.weddingId, weddingId),
          eq(
            weddingOrganizationInvitations.issuedByActorId,
            call.authorization.actorId,
          ),
          eq(weddingOrganizationInvitations.issuanceRequestId, input.requestId),
        ),
      )
      .limit(1);
    if (replay) {
      if (replay.issuanceRequestFingerprint !== fingerprint)
        throw new PlannerAssignmentConflictError("idempotency");
      return {
        invitation: replay,
        organizationName: org.name,
        replayed: true,
      } as const;
    }
    const [active] = await call.session
      .select({ id: weddingOrganizationAccesses.id })
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.weddingId, weddingId),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .limit(1);
    if (active) throw new PlannerAssignmentConflictError("active_exists");
    const [pending] = await call.session
      .select()
      .from(weddingOrganizationInvitations)
      .where(
        and(
          eq(weddingOrganizationInvitations.weddingId, weddingId),
          eq(weddingOrganizationInvitations.status, "pending"),
        ),
      )
      .limit(1);
    if (pending && pending.id !== input.reissueInvitationId)
      throw new PlannerAssignmentConflictError("pending_exists");
    if (
      input.reissueInvitationId &&
      (!pending || pending.id !== input.reissueInvitationId)
    )
      throw new PlannerAssignmentUnavailableError("invalid");
    if (pending)
      await call.session
        .update(weddingOrganizationInvitations)
        .set({ status: "replaced", updatedAt: now })
        .where(
          and(
            eq(weddingOrganizationInvitations.id, pending.id),
            eq(weddingOrganizationInvitations.status, "pending"),
          ),
        );
    const expiresAt = new Date(now.getTime() + 14 * 86400000);
    const id = createUuidV7();
    const [created] = await call.session
      .insert(weddingOrganizationInvitations)
      .values({
        id,
        weddingId,
        organizationId: input.organizationId,
        status: "pending",
        permissionCeiling: input.ceiling as PermissionCeilingEntry[],
        issuedByActorId: call.authorization.actorId,
        issuanceRequestId: input.requestId,
        issuanceRequestFingerprint: fingerprint,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) {
      const [concurrent] = await call.session
        .select()
        .from(weddingOrganizationInvitations)
        .where(
          and(
            eq(weddingOrganizationInvitations.weddingId, weddingId),
            eq(
              weddingOrganizationInvitations.issuedByActorId,
              call.authorization.actorId,
            ),
            eq(
              weddingOrganizationInvitations.issuanceRequestId,
              input.requestId,
            ),
          ),
        )
        .limit(1);
      if (concurrent?.issuanceRequestFingerprint === fingerprint)
        return {
          invitation: concurrent,
          organizationName: org.name,
          replayed: true,
        } as const;
      throw new PlannerAssignmentConflictError(
        concurrent ? "idempotency" : "pending_exists",
      );
    }
    if (pending)
      await call.session
        .update(weddingOrganizationInvitations)
        .set({ replacedByInvitationId: id, updatedAt: now })
        .where(eq(weddingOrganizationInvitations.id, pending.id));
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_invited",
      "wedding_organization_invitation",
      id,
      {
        weddingId,
        organizationId: input.organizationId,
        expiresAt: expiresAt.toISOString(),
      },
      now,
    );
    return {
      invitation: created,
      organizationName: org.name,
      replayed: false,
    } as const;
  });
}

export async function listWeddingOrganizationInvitations<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertWeddingManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) =>
    call.session
      .select({
        invitation: weddingOrganizationInvitations,
        organizationName: organizations.name,
      })
      .from(weddingOrganizationInvitations)
      .innerJoin(
        organizations,
        eq(organizations.id, weddingOrganizationInvitations.organizationId),
      )
      .where(
        eq(
          weddingOrganizationInvitations.weddingId,
          call.authorization.activeWeddingId!,
        ),
      ),
  );
}
export async function revokeWeddingOrganizationInvitation<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  invitationId: string,
  now = new Date(),
) {
  assertWeddingManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const [row] = await call.session
      .update(weddingOrganizationInvitations)
      .set({
        status: "revoked",
        revokedByActorId: call.authorization.actorId,
        revokedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingOrganizationInvitations.id, invitationId),
          eq(
            weddingOrganizationInvitations.weddingId,
            call.authorization.activeWeddingId!,
          ),
          eq(weddingOrganizationInvitations.status, "pending"),
        ),
      )
      .returning();
    if (!row) return false;
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_invitation_revoked",
      "wedding_organization_invitation",
      row.id,
      {},
      now,
    );
    return true;
  });
}

export async function listOrganizationWeddingInvitations<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertOrganizationManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) =>
    call.session
      .select({
        invitation: weddingOrganizationInvitations,
        weddingName: weddings.name,
      })
      .from(weddingOrganizationInvitations)
      .innerJoin(
        weddings,
        eq(weddings.id, weddingOrganizationInvitations.weddingId),
      )
      .where(
        and(
          eq(
            weddingOrganizationInvitations.organizationId,
            call.authorization.activeOrganizationId!,
          ),
          eq(weddingOrganizationInvitations.status, "pending"),
        ),
      ),
  );
}
export async function respondWeddingOrganizationInvitation<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  invitationId: string,
  decision: "accept" | "reject",
  now = new Date(),
) {
  assertOrganizationManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const organizationId = call.authorization.activeOrganizationId!;
    const [candidate] = await call.session
      .select()
      .from(weddingOrganizationInvitations)
      .where(
        and(
          eq(weddingOrganizationInvitations.id, invitationId),
          eq(weddingOrganizationInvitations.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (!candidate) throw new PlannerAssignmentUnavailableError("invalid");
    await call.session
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, candidate.weddingId))
      .for("update");
    const [invitation] = await call.session
      .select()
      .from(weddingOrganizationInvitations)
      .where(eq(weddingOrganizationInvitations.id, invitationId))
      .for("update")
      .limit(1);
    if (!invitation || invitation.status !== "pending")
      throw new PlannerAssignmentUnavailableError("stale");
    if (invitation.expiresAt <= now)
      throw new PlannerAssignmentUnavailableError("expired");
    if (decision === "reject") {
      await call.session
        .update(weddingOrganizationInvitations)
        .set({
          status: "rejected",
          rejectedByActorId: call.authorization.actorId,
          rejectedAt: now,
          updatedAt: now,
        })
        .where(eq(weddingOrganizationInvitations.id, invitationId));
      await facts(
        call.authorization,
        call.session,
        "wedding.organization_invitation_rejected",
        "wedding_organization_invitation",
        invitationId,
        {},
        now,
      );
      return { accepted: false } as const;
    }
    const [other] = await call.session
      .select({ id: weddingOrganizationAccesses.id })
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.weddingId, invitation.weddingId),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .limit(1);
    if (other) throw new PlannerAssignmentConflictError("active_exists");
    const [access] = await call.session
      .insert(weddingOrganizationAccesses)
      .values({
        weddingId: invitation.weddingId,
        organizationId,
        invitationId,
        status: "active",
        permissionCeiling:
          invitation.permissionCeiling as PermissionCeilingEntry[],
        permissionScopeVersion: 1,
        grantedByActorId: invitation.issuedByActorId,
        grantedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await call.session
      .update(weddingOrganizationInvitations)
      .set({
        status: "accepted",
        acceptedByActorId: call.authorization.actorId,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(eq(weddingOrganizationInvitations.id, invitationId));
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_access_granted",
      "wedding_organization_access",
      access!.id,
      { weddingId: invitation.weddingId },
      now,
    );
    return { accepted: true, access } as const;
  });
}

export async function assignOrganizationStaffToWedding<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: {
    accessId: string;
    organizationMembershipId: string;
    permissions: readonly PermissionCeilingEntry[];
    isLead?: boolean;
    now?: Date;
  },
) {
  assertOrganizationManagement(operation);
  const now = input.now ?? new Date();
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const organizationId = call.authorization.activeOrganizationId!;
    const [access] = await call.session
      .select()
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.id, input.accessId),
          eq(weddingOrganizationAccesses.organizationId, organizationId),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!access) throw new PlannerAssignmentUnavailableError("invalid");
    assertSubset(
      input.permissions,
      access.permissionCeiling as PermissionCeilingEntry[],
    );
    const [member] = await call.session
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.id, input.organizationMembershipId),
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!member) throw new PlannerAssignmentConflictError("ineligible");
    const [blocked] = await call.session
      .select({ id: weddingOrganizationStaffRestrictions.id })
      .from(weddingOrganizationStaffRestrictions)
      .where(
        and(
          eq(weddingOrganizationStaffRestrictions.accessId, access.id),
          eq(
            weddingOrganizationStaffRestrictions.organizationMembershipId,
            member.id,
          ),
          eq(weddingOrganizationStaffRestrictions.status, "blocked"),
        ),
      )
      .limit(1);
    if (blocked) throw new PlannerAssignmentConflictError("ineligible");
    if (input.isLead) {
      const [lead] = await call.session
        .select({ id: weddingOrganizationStaffAssignments.id })
        .from(weddingOrganizationStaffAssignments)
        .where(
          and(
            eq(weddingOrganizationStaffAssignments.accessId, access.id),
            eq(weddingOrganizationStaffAssignments.isLead, true),
            eq(weddingOrganizationStaffAssignments.status, "active"),
          ),
        )
        .limit(1);
      if (lead) throw new PlannerAssignmentConflictError("lead_exists");
    }
    const [weddingMember] = await call.session
      .insert(weddingMemberships)
      .values({
        weddingId: access.weddingId,
        actorId: member.actorId,
        role: "planner",
        status: "active",
        accessExpiresAt: null,
        permissionOverrides: overrides(input.permissions),
        permissionScopeVersion: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!weddingMember) throw new PlannerAssignmentConflictError("ineligible");
    const [assignment] = await call.session
      .insert(weddingOrganizationStaffAssignments)
      .values({
        accessId: access.id,
        organizationMembershipId: member.id,
        weddingMembershipId: weddingMember.id,
        status: "active",
        isLead: input.isLead ?? false,
        permissionOverrides: overrides(input.permissions),
        permissionScopeVersion: 1,
        assignedByActorId: call.authorization.actorId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_staff_assigned",
      "wedding_organization_staff_assignment",
      assignment!.id,
      { weddingId: access.weddingId, isLead: input.isLead ?? false },
      now,
    );
    return assignment!;
  });
}

export async function setPlannerStaffRestriction<HKT extends PgQueryResultHKT>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: {
    accessId: string;
    organizationMembershipId: string;
    blocked: boolean;
  },
  now = new Date(),
) {
  assertWeddingManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const weddingId = call.authorization.activeWeddingId!;
    const [access] = await call.session
      .select()
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.id, input.accessId),
          eq(weddingOrganizationAccesses.weddingId, weddingId),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!access) throw new PlannerAssignmentUnavailableError("invalid");
    const [existing] = await call.session
      .select()
      .from(weddingOrganizationStaffRestrictions)
      .where(
        and(
          eq(weddingOrganizationStaffRestrictions.accessId, access.id),
          eq(
            weddingOrganizationStaffRestrictions.organizationMembershipId,
            input.organizationMembershipId,
          ),
        ),
      )
      .limit(1);
    if (input.blocked) {
      if (existing)
        await call.session
          .update(weddingOrganizationStaffRestrictions)
          .set({
            status: "blocked",
            changedByActorId: call.authorization.actorId,
            blockedAt: now,
            liftedAt: null,
            updatedAt: now,
          })
          .where(eq(weddingOrganizationStaffRestrictions.id, existing.id));
      else
        await call.session.insert(weddingOrganizationStaffRestrictions).values({
          accessId: access.id,
          organizationMembershipId: input.organizationMembershipId,
          status: "blocked",
          changedByActorId: call.authorization.actorId,
          blockedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      const assignments = await call.session
        .update(weddingOrganizationStaffAssignments)
        .set({
          status: "revoked",
          isLead: false,
          revokedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(weddingOrganizationStaffAssignments.accessId, access.id),
            eq(
              weddingOrganizationStaffAssignments.organizationMembershipId,
              input.organizationMembershipId,
            ),
            eq(weddingOrganizationStaffAssignments.status, "active"),
          ),
        )
        .returning({
          weddingMembershipId:
            weddingOrganizationStaffAssignments.weddingMembershipId,
        });
      if (assignments.length)
        await call.session
          .update(weddingMemberships)
          .set({ status: "revoked", updatedAt: now })
          .where(
            inArray(
              weddingMemberships.id,
              assignments.map((row) => row.weddingMembershipId),
            ),
          );
    } else if (existing)
      await call.session
        .update(weddingOrganizationStaffRestrictions)
        .set({
          status: "lifted",
          changedByActorId: call.authorization.actorId,
          liftedAt: now,
          updatedAt: now,
        })
        .where(eq(weddingOrganizationStaffRestrictions.id, existing.id));
    await facts(
      call.authorization,
      call.session,
      input.blocked
        ? "wedding.organization_staff_blocked"
        : "wedding.organization_staff_unblocked",
      "organization_membership",
      input.organizationMembershipId,
      {},
      now,
    );
    return true;
  });
}

export async function revokeWeddingOrganizationAccess<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  accessId: string,
  now = new Date(),
) {
  assertWeddingManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const [access] = await call.session
      .update(weddingOrganizationAccesses)
      .set({
        status: "revoked",
        revokedByActorId: call.authorization.actorId,
        revokedAt: now,
        permissionScopeVersion: sql`${weddingOrganizationAccesses.permissionScopeVersion} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingOrganizationAccesses.id, accessId),
          eq(
            weddingOrganizationAccesses.weddingId,
            call.authorization.activeWeddingId!,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .returning();
    if (!access) return false;
    const assignments = await call.session
      .update(weddingOrganizationStaffAssignments)
      .set({
        status: "revoked",
        isLead: false,
        revokedAt: now,
        permissionScopeVersion: sql`${weddingOrganizationStaffAssignments.permissionScopeVersion} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      )
      .returning({
        weddingMembershipId:
          weddingOrganizationStaffAssignments.weddingMembershipId,
      });
    if (assignments.length)
      await call.session
        .update(weddingMemberships)
        .set({
          status: "revoked",
          permissionScopeVersion: sql`${weddingMemberships.permissionScopeVersion} + 1`,
          updatedAt: now,
        })
        .where(
          inArray(
            weddingMemberships.id,
            assignments.map((row) => row.weddingMembershipId),
          ),
        );
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_access_revoked",
      "wedding_organization_access",
      access.id,
      { affectedStaff: assignments.length },
      now,
    );
    return true;
  });
}

export async function resolveEligiblePlannerFallback<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  accessId: string,
  now = new Date(),
) {
  const rows = await database
    .select({
      assignment: weddingOrganizationStaffAssignments,
      role: organizationMemberships.role,
      orgStatus: organizationMemberships.status,
      weddingStatus: weddingMemberships.status,
      actorId: organizationMemberships.actorId,
      blocked: weddingOrganizationStaffRestrictions.status,
    })
    .from(weddingOrganizationStaffAssignments)
    .innerJoin(
      weddingOrganizationAccesses,
      and(
        eq(weddingOrganizationAccesses.id, accessId),
        eq(weddingOrganizationAccesses.status, "active"),
      ),
    )
    .innerJoin(
      organizationMemberships,
      eq(
        organizationMemberships.id,
        weddingOrganizationStaffAssignments.organizationMembershipId,
      ),
    )
    .innerJoin(
      weddingMemberships,
      eq(
        weddingMemberships.id,
        weddingOrganizationStaffAssignments.weddingMembershipId,
      ),
    )
    .leftJoin(
      weddingOrganizationStaffRestrictions,
      and(
        eq(weddingOrganizationStaffRestrictions.accessId, accessId),
        eq(
          weddingOrganizationStaffRestrictions.organizationMembershipId,
          organizationMemberships.id,
        ),
        eq(weddingOrganizationStaffRestrictions.status, "blocked"),
      ),
    )
    .where(
      and(
        eq(weddingOrganizationStaffAssignments.accessId, accessId),
        eq(weddingOrganizationStaffAssignments.status, "active"),
      ),
    );
  const eligible = rows.filter(
    (row) =>
      row.orgStatus === "active" &&
      row.weddingStatus === "active" &&
      row.blocked !== "blocked",
  );
  const lead = eligible.find(
    (row) =>
      row.assignment.isLead &&
      !(
        row.assignment.absenceStartsAt &&
        row.assignment.absenceEndsAt &&
        row.assignment.absenceStartsAt <= now &&
        row.assignment.absenceEndsAt > now
      ),
  );
  if (lead) return { kind: "lead" as const, actorIds: [lead.actorId] };
  return {
    kind: "manager_fallback" as const,
    actorIds: eligible
      .filter((row) => row.role === "owner" || row.role === "manager")
      .map((row) => row.actorId),
  };
}

export async function setLeadPlannerAbsence<HKT extends PgQueryResultHKT>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: { accessId: string; startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
) {
  if (
    operation.area !== "tasks" ||
    operation.action !== "edit" ||
    !operation.authorization.activeWeddingId
  )
    throw new PlannerAssignmentUnavailableError("access_denied");
  if (
    (input.startsAt === null) !== (input.endsAt === null) ||
    (input.startsAt && input.endsAt && input.startsAt >= input.endsAt)
  )
    throw new PlannerAssignmentUnavailableError("invalid");
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const [assignment] = await call.session
      .select({
        id: weddingOrganizationStaffAssignments.id,
        organizationMembershipId:
          weddingOrganizationStaffAssignments.organizationMembershipId,
      })
      .from(weddingOrganizationStaffAssignments)
      .innerJoin(
        weddingOrganizationAccesses,
        and(
          eq(
            weddingOrganizationAccesses.id,
            weddingOrganizationStaffAssignments.accessId,
          ),
          eq(
            weddingOrganizationAccesses.weddingId,
            call.authorization.activeWeddingId!,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .innerJoin(
        organizationMemberships,
        and(
          eq(
            organizationMemberships.id,
            weddingOrganizationStaffAssignments.organizationMembershipId,
          ),
          eq(organizationMemberships.actorId, call.authorization.actorId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, input.accessId),
          eq(weddingOrganizationStaffAssignments.isLead, true),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!assignment)
      throw new PlannerAssignmentUnavailableError("access_denied");
    const [blocked] = await call.session
      .select({ id: weddingOrganizationStaffRestrictions.id })
      .from(weddingOrganizationStaffRestrictions)
      .where(
        and(
          eq(weddingOrganizationStaffRestrictions.accessId, input.accessId),
          eq(
            weddingOrganizationStaffRestrictions.organizationMembershipId,
            assignment.organizationMembershipId,
          ),
          eq(weddingOrganizationStaffRestrictions.status, "blocked"),
        ),
      )
      .limit(1);
    if (blocked) throw new PlannerAssignmentUnavailableError("access_denied");
    await call.session
      .update(weddingOrganizationStaffAssignments)
      .set({
        absenceStartsAt: input.startsAt,
        absenceEndsAt: input.endsAt,
        updatedAt: now,
      })
      .where(eq(weddingOrganizationStaffAssignments.id, assignment.id));
    await facts(
      call.authorization,
      call.session,
      "wedding.lead_absence_changed",
      "wedding_organization_staff_assignment",
      assignment.id,
      {
        startsAt: input.startsAt?.toISOString() ?? null,
        endsAt: input.endsAt?.toISOString() ?? null,
      },
      now,
    );
    return true;
  });
}

async function facts(
  operation: AuthorizedServerOperation["authorization"],
  session: AuditOutboxSession,
  eventType: string,
  subjectType: string,
  subjectId: string,
  metadata: Record<string, unknown>,
  now: Date,
) {
  const occurredAt = now.toISOString();
  await appendAuthorizedAuditEvent(
    operation,
    session,
    createAuditEventEnvelope(operation, {
      eventId: createUuidV7(),
      eventType,
      schemaVersion: 1,
      occurredAt,
      subjectType,
      subjectId,
      metadata,
    }),
  );
  await appendAuthorizedOutboxEvent(
    operation,
    session,
    createOutboxEventEnvelope(operation, {
      eventId: createUuidV7(),
      eventType,
      schemaVersion: 1,
      occurredAt,
      payload: { subjectId, ...metadata },
    }),
  );
}
