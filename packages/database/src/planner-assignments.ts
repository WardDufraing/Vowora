import { createHash } from "node:crypto";

import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import {
  createAuditEventEnvelope,
  createOutboxEventEnvelope,
  consumeAuthorizedOrganizationLeadTransfer,
  type AuthorizedOrganizationLeadTransfer,
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
function grantsPermission(
  value: unknown,
  area: (typeof weddingPermissionAreas)[number],
  action: (typeof weddingPermissionActions)[number],
) {
  return (
    Array.isArray(value) &&
    value.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const grant = entry as Partial<PermissionOverride>;
      return (
        grant.area === area &&
        grant.action === action &&
        grant.effect === "allow" &&
        grant.scope === "workspace"
      );
    })
  );
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

async function assertActiveWeddingPartner<HKT extends PgQueryResultHKT>(
  session: Pick<PlannerAssignmentDatabase<HKT>, "select">,
  authorization: AuthorizedServerOperation["authorization"],
) {
  const [membership] = await session
    .select({ id: weddingMemberships.id })
    .from(weddingMemberships)
    .where(
      and(
        eq(weddingMemberships.weddingId, authorization.activeWeddingId!),
        eq(weddingMemberships.actorId, authorization.actorId),
        eq(weddingMemberships.role, "partner"),
        eq(weddingMemberships.status, "active"),
        or(
          isNull(weddingMemberships.accessExpiresAt),
          gt(weddingMemberships.accessExpiresAt, sql`current_timestamp`),
        ),
      ),
    )
    .for("update", { of: weddingMemberships })
    .limit(1);
  if (!membership) throw new PlannerAssignmentUnavailableError("access_denied");
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
    await assertActiveWeddingPartner(call.session, call.authorization);
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
        // The self-reference keeps the lifecycle row valid while the partial
        // pending unique index is released. It is replaced with the new id in
        // this same transaction immediately after insertion.
        .set({
          status: "replaced",
          replacedByInvitationId: pending.id,
          updatedAt: now,
        })
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
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    await assertActiveWeddingPartner(call.session, call.authorization);
    return call.session
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
      );
  });
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
    await assertActiveWeddingPartner(call.session, call.authorization);
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
      .for("update")
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
    if (input.isLead)
      await call.session
        .update(weddingOrganizationStaffAssignments)
        .set({ isLead: false, updatedAt: now })
        .where(
          and(
            eq(weddingOrganizationStaffAssignments.accessId, access.id),
            eq(weddingOrganizationStaffAssignments.isLead, true),
            eq(weddingOrganizationStaffAssignments.status, "active"),
          ),
        );
    const grants = overrides(input.permissions);
    const [existingAssignment] = await call.session
      .select()
      .from(weddingOrganizationStaffAssignments)
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(
            weddingOrganizationStaffAssignments.organizationMembershipId,
            member.id,
          ),
        ),
      )
      .for("update")
      .limit(1);
    // The assignment is the authoritative, revocable planner capability. The
    // wedding-membership row is an immutable identity/shell marker after it is
    // inserted; runtime SQL deliberately has no privilege to rewrite its
    // authority fields (which also protects partner rows).
    let weddingMember = existingAssignment
      ? (
          await call.session
            .select()
            .from(weddingMemberships)
            .where(
              and(
                eq(
                  weddingMemberships.id,
                  existingAssignment.weddingMembershipId,
                ),
                eq(weddingMemberships.weddingId, access.weddingId),
                eq(weddingMemberships.actorId, member.actorId),
                eq(weddingMemberships.role, "planner"),
              ),
            )
            .limit(1)
        )[0]
      : undefined;
    if (!weddingMember)
      [weddingMember] = await call.session
        .insert(weddingMemberships)
        .values({
          weddingId: access.weddingId,
          actorId: member.actorId,
          role: "planner",
          status: "active",
          accessExpiresAt: null,
          permissionOverrides: grants,
          permissionScopeVersion: 1,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning();
    if (!weddingMember) throw new PlannerAssignmentConflictError("ineligible");
    const [assignment] = existingAssignment
      ? await call.session
          .update(weddingOrganizationStaffAssignments)
          .set({
            status: "active",
            isLead: input.isLead ?? false,
            permissionOverrides: grants,
            permissionScopeVersion: sql`${weddingOrganizationStaffAssignments.permissionScopeVersion} + 1`,
            revokedAt: null,
            absenceStartsAt: null,
            absenceEndsAt: null,
            updatedAt: now,
          })
          .where(
            eq(weddingOrganizationStaffAssignments.id, existingAssignment.id),
          )
          .returning()
      : await call.session
          .insert(weddingOrganizationStaffAssignments)
          .values({
            accessId: access.id,
            organizationMembershipId: member.id,
            weddingMembershipId: weddingMember.id,
            status: "active",
            isLead: input.isLead ?? false,
            permissionOverrides: grants,
            permissionScopeVersion: 1,
            assignedByActorId: call.authorization.actorId,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
    await facts(
      call.authorization,
      call.session,
      existingAssignment
        ? "wedding.organization_staff_updated"
        : "wedding.organization_staff_assigned",
      "wedding_organization_staff_assignment",
      assignment!.id,
      { weddingId: access.weddingId, isLead: input.isLead ?? false },
      now,
    );
    return assignment!;
  });
}

export async function transferCurrentLeadPlanner<HKT extends PgQueryResultHKT>(
  database: PlannerAssignmentDatabase<HKT>,
  capability: AuthorizedOrganizationLeadTransfer,
  now = new Date(),
) {
  return database.transaction(async (transaction) => {
    const [access] = await transaction
      .select()
      .from(weddingOrganizationAccesses)
      .where(
        and(
          eq(weddingOrganizationAccesses.id, capability.accessId),
          eq(
            weddingOrganizationAccesses.organizationId,
            capability.organizationId,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .for("update")
      .limit(1);
    if (!access) throw new PlannerAssignmentUnavailableError("access_denied");
    const selection = {
      assignment: weddingOrganizationStaffAssignments,
      actorId: organizationMemberships.actorId,
      organizationStatus: organizationMemberships.status,
      weddingStatus: weddingMemberships.status,
      weddingRole: weddingMemberships.role,
      restrictionStatus: weddingOrganizationStaffRestrictions.status,
    } as const;
    const assignmentQuery = () =>
      transaction
        .select(selection)
        .from(weddingOrganizationStaffAssignments)
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
            eq(
              weddingOrganizationStaffRestrictions.accessId,
              weddingOrganizationStaffAssignments.accessId,
            ),
            eq(
              weddingOrganizationStaffRestrictions.organizationMembershipId,
              weddingOrganizationStaffAssignments.organizationMembershipId,
            ),
            eq(weddingOrganizationStaffRestrictions.status, "blocked"),
          ),
        );
    const [currentLead] = await assignmentQuery()
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
          eq(weddingOrganizationStaffAssignments.isLead, true),
          eq(organizationMemberships.actorId, capability.actorId),
          eq(organizationMemberships.status, "active"),
          eq(weddingMemberships.weddingId, access.weddingId),
          eq(weddingMemberships.status, "active"),
          eq(weddingMemberships.role, "planner"),
        ),
      )
      .for("update", { of: weddingOrganizationStaffAssignments })
      .limit(1);
    const [target] = await assignmentQuery()
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
          eq(
            weddingOrganizationStaffAssignments.organizationMembershipId,
            capability.targetOrganizationMembershipId,
          ),
          eq(organizationMemberships.organizationId, access.organizationId),
          eq(organizationMemberships.status, "active"),
          eq(weddingMemberships.weddingId, access.weddingId),
          eq(weddingMemberships.status, "active"),
          eq(weddingMemberships.role, "planner"),
        ),
      )
      .for("update", { of: weddingOrganizationStaffAssignments })
      .limit(1);
    if (
      !currentLead ||
      currentLead.restrictionStatus === "blocked" ||
      !target ||
      target.restrictionStatus === "blocked" ||
      target.assignment.id === currentLead.assignment.id ||
      currentLead.organizationStatus !== "active" ||
      currentLead.weddingStatus !== "active" ||
      currentLead.weddingRole !== "planner" ||
      target.organizationStatus !== "active" ||
      target.weddingStatus !== "active" ||
      target.weddingRole !== "planner"
    )
      throw new PlannerAssignmentUnavailableError("access_denied");
    const consumed = await consumeAuthorizedOrganizationLeadTransfer(
      capability,
      access.weddingId,
    );
    await transaction
      .update(weddingOrganizationStaffAssignments)
      .set({ isLead: false, updatedAt: now })
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.isLead, true),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      );
    const [updated] = await transaction
      .update(weddingOrganizationStaffAssignments)
      .set({ isLead: true, updatedAt: now })
      .where(eq(weddingOrganizationStaffAssignments.id, target.assignment.id))
      .returning();
    if (!updated) throw new PlannerAssignmentUnavailableError("stale");
    await facts(
      consumed.authorization,
      transaction,
      "wedding.lead_planner_changed",
      "wedding_organization_staff_assignment",
      updated.id,
      {
        previousOrganizationMembershipId:
          currentLead.assignment.organizationMembershipId,
        organizationMembershipId: updated.organizationMembershipId,
      },
      now,
    );
    return updated;
  });
}

export async function listOrganizationWeddingAccesses<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertOrganizationManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const organizationId = call.authorization.activeOrganizationId!;
    const accessRows = await call.session
      .select({
        id: weddingOrganizationAccesses.id,
        weddingId: weddingOrganizationAccesses.weddingId,
        weddingName: weddings.name,
        status: weddingOrganizationAccesses.status,
        permissionCeiling: weddingOrganizationAccesses.permissionCeiling,
      })
      .from(weddingOrganizationAccesses)
      .innerJoin(
        weddings,
        eq(weddings.id, weddingOrganizationAccesses.weddingId),
      )
      .where(
        and(
          eq(weddingOrganizationAccesses.organizationId, organizationId),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      );
    const result = [];
    for (const access of accessRows) {
      const assignments = await call.session
        .select({
          id: weddingOrganizationStaffAssignments.id,
          organizationMembershipId:
            weddingOrganizationStaffAssignments.organizationMembershipId,
          role: organizationMemberships.role,
          status: weddingOrganizationStaffAssignments.status,
          isLead: weddingOrganizationStaffAssignments.isLead,
          permissions: weddingOrganizationStaffAssignments.permissionOverrides,
          absenceStartsAt: weddingOrganizationStaffAssignments.absenceStartsAt,
          absenceEndsAt: weddingOrganizationStaffAssignments.absenceEndsAt,
        })
        .from(weddingOrganizationStaffAssignments)
        .innerJoin(
          organizationMemberships,
          eq(
            organizationMemberships.id,
            weddingOrganizationStaffAssignments.organizationMembershipId,
          ),
        )
        .where(
          and(
            eq(weddingOrganizationStaffAssignments.accessId, access.id),
            eq(weddingOrganizationStaffAssignments.status, "active"),
            eq(organizationMemberships.status, "active"),
          ),
        );
      result.push({ ...access, assignments });
    }
    return result;
  });
}

/**
 * Minimal read projection for an employee who is the canonical current lead.
 * It deliberately returns only weddings led by the authenticated actor and
 * staff who are already active assignments for those weddings. It does not
 * confer organization-management access.
 */
export async function listCurrentLeadWeddingAccesses<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  input: { readonly actorId: string; readonly organizationId: string },
) {
  const leadRows = await database
    .select({
      id: weddingOrganizationAccesses.id,
      weddingId: weddingOrganizationAccesses.weddingId,
      weddingName: weddings.name,
      currentMembershipId: organizationMemberships.id,
      currentAssignmentId: weddingOrganizationStaffAssignments.id,
      currentAbsenceStartsAt:
        weddingOrganizationStaffAssignments.absenceStartsAt,
      currentAbsenceEndsAt: weddingOrganizationStaffAssignments.absenceEndsAt,
    })
    .from(weddingOrganizationStaffAssignments)
    .innerJoin(
      weddingOrganizationAccesses,
      and(
        eq(
          weddingOrganizationAccesses.id,
          weddingOrganizationStaffAssignments.accessId,
        ),
        eq(weddingOrganizationAccesses.organizationId, input.organizationId),
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
        eq(organizationMemberships.actorId, input.actorId),
        eq(organizationMemberships.status, "active"),
      ),
    )
    .innerJoin(
      weddingMemberships,
      and(
        eq(
          weddingMemberships.id,
          weddingOrganizationStaffAssignments.weddingMembershipId,
        ),
        eq(weddingMemberships.weddingId, weddingOrganizationAccesses.weddingId),
        eq(weddingMemberships.actorId, input.actorId),
        eq(weddingMemberships.role, "planner"),
        eq(weddingMemberships.status, "active"),
      ),
    )
    .innerJoin(weddings, eq(weddings.id, weddingOrganizationAccesses.weddingId))
    .leftJoin(
      weddingOrganizationStaffRestrictions,
      and(
        eq(
          weddingOrganizationStaffRestrictions.accessId,
          weddingOrganizationStaffAssignments.accessId,
        ),
        eq(
          weddingOrganizationStaffRestrictions.organizationMembershipId,
          weddingOrganizationStaffAssignments.organizationMembershipId,
        ),
        eq(weddingOrganizationStaffRestrictions.status, "blocked"),
      ),
    )
    .where(
      and(
        eq(weddingOrganizationStaffAssignments.status, "active"),
        eq(weddingOrganizationStaffAssignments.isLead, true),
        isNull(weddingOrganizationStaffRestrictions.id),
      ),
    );

  const accesses = [];
  const staffById = new Map<
    string,
    { id: string; name: string; status: "active" }
  >();
  for (const access of leadRows) {
    const assignments = await database
      .select({
        id: weddingOrganizationStaffAssignments.id,
        organizationMembershipId:
          weddingOrganizationStaffAssignments.organizationMembershipId,
        isLead: weddingOrganizationStaffAssignments.isLead,
        name: user.name,
      })
      .from(weddingOrganizationStaffAssignments)
      .innerJoin(
        organizationMemberships,
        and(
          eq(
            organizationMemberships.id,
            weddingOrganizationStaffAssignments.organizationMembershipId,
          ),
          eq(organizationMemberships.organizationId, input.organizationId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .innerJoin(user, eq(user.id, organizationMemberships.actorId))
      .innerJoin(
        weddingMemberships,
        and(
          eq(
            weddingMemberships.id,
            weddingOrganizationStaffAssignments.weddingMembershipId,
          ),
          eq(weddingMemberships.weddingId, access.weddingId),
          eq(weddingMemberships.role, "planner"),
          eq(weddingMemberships.status, "active"),
        ),
      )
      .leftJoin(
        weddingOrganizationStaffRestrictions,
        and(
          eq(
            weddingOrganizationStaffRestrictions.accessId,
            weddingOrganizationStaffAssignments.accessId,
          ),
          eq(
            weddingOrganizationStaffRestrictions.organizationMembershipId,
            weddingOrganizationStaffAssignments.organizationMembershipId,
          ),
          eq(weddingOrganizationStaffRestrictions.status, "blocked"),
        ),
      )
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(weddingOrganizationStaffAssignments.status, "active"),
          isNull(weddingOrganizationStaffRestrictions.id),
        ),
      );
    for (const assignment of assignments)
      staffById.set(assignment.organizationMembershipId, {
        id: assignment.organizationMembershipId,
        name: assignment.name,
        status: "active",
      });
    accesses.push({
      id: access.id,
      weddingId: access.weddingId,
      weddingName: access.weddingName,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        organizationMembershipId: assignment.organizationMembershipId,
        isLead: assignment.isLead,
        ...(assignment.id === access.currentAssignmentId
          ? {
              absenceStartsAt: access.currentAbsenceStartsAt,
              absenceEndsAt: access.currentAbsenceEndsAt,
            }
          : {}),
      })),
      currentMembershipId: access.currentMembershipId,
    });
  }
  return { accesses, staff: [...staffById.values()] };
}

export async function getWeddingOrganizationAccessManagement<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
) {
  assertWeddingManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    await assertActiveWeddingPartner(call.session, call.authorization);
    const [access] = await call.session
      .select({
        id: weddingOrganizationAccesses.id,
        organizationId: weddingOrganizationAccesses.organizationId,
        organizationName: organizations.name,
        permissionCeiling: weddingOrganizationAccesses.permissionCeiling,
      })
      .from(weddingOrganizationAccesses)
      .innerJoin(
        organizations,
        eq(organizations.id, weddingOrganizationAccesses.organizationId),
      )
      .where(
        and(
          eq(
            weddingOrganizationAccesses.weddingId,
            call.authorization.activeWeddingId!,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .limit(1);
    if (!access) return null;
    const assignments = await call.session
      .select({
        id: weddingOrganizationStaffAssignments.id,
        organizationMembershipId:
          weddingOrganizationStaffAssignments.organizationMembershipId,
        name: user.name,
        role: organizationMemberships.role,
        assignmentStatus: weddingOrganizationStaffAssignments.status,
        isLead: weddingOrganizationStaffAssignments.isLead,
        restrictionStatus: weddingOrganizationStaffRestrictions.status,
      })
      .from(weddingOrganizationStaffAssignments)
      .innerJoin(
        organizationMemberships,
        eq(
          organizationMemberships.id,
          weddingOrganizationStaffAssignments.organizationMembershipId,
        ),
      )
      .innerJoin(user, eq(user.id, organizationMemberships.actorId))
      .leftJoin(
        weddingOrganizationStaffRestrictions,
        and(
          eq(weddingOrganizationStaffRestrictions.accessId, access.id),
          eq(
            weddingOrganizationStaffRestrictions.organizationMembershipId,
            organizationMemberships.id,
          ),
        ),
      )
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.accessId, access.id),
          eq(organizationMemberships.status, "active"),
          or(
            eq(weddingOrganizationStaffAssignments.status, "active"),
            eq(weddingOrganizationStaffRestrictions.status, "blocked"),
          ),
        ),
      );
    return { ...access, assignments };
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
    await assertActiveWeddingPartner(call.session, call.authorization);
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
    const [restrictedMember] = await call.session
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.id, input.organizationMembershipId),
          eq(organizationMemberships.organizationId, access.organizationId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!restrictedMember)
      throw new PlannerAssignmentUnavailableError("invalid");
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
    if (
      (input.blocked && existing?.status === "blocked") ||
      (!input.blocked && (!existing || existing.status === "lifted"))
    )
      return true;
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
      await call.session
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
            eq(
              weddingOrganizationStaffAssignments.organizationMembershipId,
              input.organizationMembershipId,
            ),
            eq(weddingOrganizationStaffAssignments.status, "active"),
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

export async function removeOrganizationStaffFromWedding<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  input: { accessId: string; assignmentId: string },
  now = new Date(),
) {
  assertOrganizationManagement(operation);
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const [assignment] = await call.session
      .select({
        id: weddingOrganizationStaffAssignments.id,
        weddingMembershipId:
          weddingOrganizationStaffAssignments.weddingMembershipId,
      })
      .from(weddingOrganizationStaffAssignments)
      .innerJoin(
        weddingOrganizationAccesses,
        and(
          eq(
            weddingOrganizationAccesses.id,
            weddingOrganizationStaffAssignments.accessId,
          ),
          eq(weddingOrganizationAccesses.id, input.accessId),
          eq(
            weddingOrganizationAccesses.organizationId,
            call.authorization.activeOrganizationId!,
          ),
          eq(weddingOrganizationAccesses.status, "active"),
        ),
      )
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.id, input.assignmentId),
          eq(weddingOrganizationStaffAssignments.status, "active"),
        ),
      )
      .for("update", { of: weddingOrganizationStaffAssignments })
      .limit(1);
    if (!assignment) throw new PlannerAssignmentUnavailableError("invalid");
    await call.session
      .update(weddingOrganizationStaffAssignments)
      .set({
        status: "revoked",
        isLead: false,
        revokedAt: now,
        permissionScopeVersion: sql`${weddingOrganizationStaffAssignments.permissionScopeVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(weddingOrganizationStaffAssignments.id, assignment.id));
    await facts(
      call.authorization,
      call.session,
      "wedding.organization_staff_removed",
      "wedding_organization_staff_assignment",
      assignment.id,
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
    await assertActiveWeddingPartner(call.session, call.authorization);
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
      .returning({ id: weddingOrganizationStaffAssignments.id });
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

/**
 * Checks fallback eligibility for the actor already bound to a one-use,
 * centrally-authorized wedding operation. This deliberately does not enumerate
 * recipient actor ids: callers must authorize each prospective recipient and
 * the repository revalidates that exact actor inside the tenant transaction.
 */
export async function resolveCurrentActorPlannerFallback<
  HKT extends PgQueryResultHKT,
>(
  database: PlannerAssignmentDatabase<HKT>,
  operation: AuthorizedServerOperation,
  requested: {
    area: (typeof weddingPermissionAreas)[number];
    action: (typeof weddingPermissionActions)[number];
  },
  now = new Date(),
) {
  if (
    !operation.authorization.activeWeddingId ||
    operation.area !== requested.area ||
    operation.action !== requested.action
  )
    throw new PlannerAssignmentUnavailableError("access_denied");
  return withAuthorizedTenantTransaction(database, operation, async (call) => {
    const selection = {
      assignment: weddingOrganizationStaffAssignments,
      role: organizationMemberships.role,
      orgStatus: organizationMemberships.status,
      weddingStatus: weddingMemberships.status,
      actorId: organizationMemberships.actorId,
      blocked: weddingOrganizationStaffRestrictions.status,
    } as const;
    const baseQuery = () =>
      call.session
        .select(selection)
        .from(weddingOrganizationStaffAssignments)
        .innerJoin(
          weddingOrganizationAccesses,
          and(
            eq(
              weddingOrganizationAccesses.weddingId,
              call.authorization.activeWeddingId!,
            ),
            eq(weddingOrganizationAccesses.status, "active"),
            eq(
              weddingOrganizationStaffAssignments.accessId,
              weddingOrganizationAccesses.id,
            ),
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
          and(
            eq(
              weddingMemberships.id,
              weddingOrganizationStaffAssignments.weddingMembershipId,
            ),
            eq(
              weddingMemberships.weddingId,
              call.authorization.activeWeddingId!,
            ),
          ),
        )
        .leftJoin(
          weddingOrganizationStaffRestrictions,
          and(
            eq(
              weddingOrganizationStaffRestrictions.accessId,
              weddingOrganizationAccesses.id,
            ),
            eq(
              weddingOrganizationStaffRestrictions.organizationMembershipId,
              organizationMemberships.id,
            ),
            eq(weddingOrganizationStaffRestrictions.status, "blocked"),
          ),
        );
    const [row] = await baseQuery()
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.status, "active"),
          eq(organizationMemberships.actorId, call.authorization.actorId),
        ),
      )
      .limit(1);
    const [lead] = await baseQuery()
      .where(
        and(
          eq(weddingOrganizationStaffAssignments.status, "active"),
          eq(weddingOrganizationStaffAssignments.isLead, true),
        ),
      )
      .limit(1);
    const eligible = (candidate: typeof row) =>
      Boolean(
        candidate &&
        candidate.orgStatus === "active" &&
        candidate.weddingStatus === "active" &&
        candidate.blocked !== "blocked" &&
        grantsPermission(
          candidate.assignment.permissionOverrides,
          requested.area,
          requested.action,
        ),
      );
    const leadIsAbsent = Boolean(
      lead?.assignment.absenceStartsAt &&
      lead.assignment.absenceEndsAt &&
      lead.assignment.absenceStartsAt <= now &&
      lead.assignment.absenceEndsAt > now,
    );
    if (eligible(lead) && !leadIsAbsent) {
      return lead!.actorId === call.authorization.actorId
        ? ({ kind: "lead" } as const)
        : ({ kind: "ineligible" } as const);
    }
    if (!eligible(row) || row!.actorId !== call.authorization.actorId)
      return { kind: "ineligible" as const };
    // An unavailable lead is the person being bypassed, even when that person
    // also holds an organization-manager role. Fallback must select a distinct
    // eligible manager and never route the work back to the absent lead.
    if (row!.assignment.isLead) return { kind: "ineligible" as const };
    if (row!.role === "owner" || row!.role === "manager")
      return { kind: "manager_fallback" as const };
    return { kind: "ineligible" as const };
  });
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
