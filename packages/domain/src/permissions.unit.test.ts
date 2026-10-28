import { describe, expect, it } from "vitest";

import {
  canRemoveWeddingMembership,
  evaluateIndependentPlannerPrivateRecordPermission,
  evaluateOrganizationPrivateRecordPermission,
  evaluateWeddingRecordPermission,
  parseIndependentPlannerIdentity,
  parseOrganizationMembership,
  parseWeddingMembership,
  PermissionModelValidationError,
  weddingPermissionAreas,
  type PermissionOverride,
  type WeddingPermissionAction,
  type WeddingRecordPermissionRequest,
} from "./index.js";

const actorA = "019a1f5e-70a0-7000-8000-000000000001";
const actorB = "019a1f5e-70a0-7000-8000-000000000002";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const organizationA = "019a1f5e-70a0-7000-8000-000000000020";
const organizationB = "019a1f5e-70a0-7000-8000-000000000021";

function weddingMembership(
  actorId: string,
  role: "partner" | "planner" | "coordinator" | "helper" | "read_only_guest",
  permissionOverrides: readonly PermissionOverride[] = [],
  weddingId = weddingA,
) {
  return parseWeddingMembership({
    actorId,
    weddingId,
    role,
    status: "active",
    accessExpiresAt: null,
    permissionOverrides,
  });
}

function sharedRequest(
  actorId: string,
  action: WeddingPermissionAction,
  overrides: Partial<WeddingRecordPermissionRequest> = {},
): WeddingRecordPermissionRequest {
  return {
    actorId,
    weddingId: weddingA,
    area: "tasks",
    action,
    relationship: "workspace",
    visibility: "wedding_shared",
    ...overrides,
  };
}

describe("permission membership parsing", () => {
  it("freezes validated memberships and rejects ambiguous or malformed grants", () => {
    const membership = weddingMembership(actorA, "helper", [
      {
        area: "documents",
        action: "view",
        effect: "allow",
        scope: "explicitly_shared",
      },
    ]);
    expect(Object.isFrozen(membership)).toBe(true);
    expect(Object.isFrozen(membership.permissionOverrides)).toBe(true);
    expect(Object.isFrozen(membership.permissionOverrides[0])).toBe(true);

    for (const permissionOverrides of [
      [
        {
          area: "documents",
          action: "view",
          effect: "allow",
        },
      ],
      [
        {
          area: "documents",
          action: "view",
          effect: "deny",
          scope: "workspace",
        },
      ],
      [
        {
          area: "documents",
          action: "view",
          effect: "deny",
        },
        {
          area: "documents",
          action: "view",
          effect: "allow",
          scope: "workspace",
        },
      ],
    ]) {
      expect(() =>
        parseWeddingMembership({
          actorId: actorA,
          weddingId: weddingA,
          role: "helper",
          status: "active",
          accessExpiresAt: null,
          permissionOverrides,
        }),
      ).toThrow(PermissionModelValidationError);
    }

    expect(() =>
      parseWeddingMembership({
        actorId: actorA,
        weddingId: weddingA,
        role: "partner",
        status: "active",
        accessExpiresAt: "2026-10-28T12:00:00.000Z",
        permissionOverrides: [],
      }),
    ).toThrow(PermissionModelValidationError);
  });

  it("does not reflect private malformed values in validation errors", () => {
    const privateValue = "private-person@example.com";
    let caught: unknown;
    try {
      parseWeddingMembership({
        actorId: privateValue,
        weddingId: weddingA,
        role: "partner",
        status: "active",
        accessExpiresAt: null,
        permissionOverrides: [],
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(PermissionModelValidationError);
    expect(String(caught)).not.toContain(privateValue);
  });
});

describe("wedding role presets and grants", () => {
  it("gives both partners identical control of every shared wedding area", () => {
    const firstPartner = weddingMembership(actorA, "partner");
    const secondPartner = weddingMembership(actorB, "partner", [
      { area: "budget", action: "view", effect: "deny" },
    ]);

    for (const area of weddingPermissionAreas) {
      for (const action of ["view", "edit", "download_export"] as const) {
        const relationship = area === "tasks" ? "assigned" : "workspace";
        expect(
          evaluateWeddingRecordPermission(
            firstPartner,
            sharedRequest(actorA, action, { area, relationship }),
          ),
        ).toEqual({ allowed: true, reason: "allowed" });
        expect(
          evaluateWeddingRecordPermission(
            secondPartner,
            sharedRequest(actorB, action, { area, relationship }),
          ),
        ).toEqual({ allowed: true, reason: "allowed" });
      }
    }
  });

  it("protects partners from unilateral removal while allowing partner removal of collaborators", () => {
    const partnerA = weddingMembership(actorA, "partner");
    const partnerB = weddingMembership(actorB, "partner");
    const helper = weddingMembership(actorB, "helper");
    const otherWeddingHelper = weddingMembership(
      actorB,
      "helper",
      [],
      weddingB,
    );

    expect(canRemoveWeddingMembership(partnerA, partnerB)).toBe(false);
    expect(canRemoveWeddingMembership(partnerB, partnerA)).toBe(false);
    expect(canRemoveWeddingMembership(partnerA, helper)).toBe(true);
    expect(canRemoveWeddingMembership(helper, partnerA)).toBe(false);
    expect(canRemoveWeddingMembership(partnerA, otherWeddingHelper)).toBe(
      false,
    );
    expect(
      canRemoveWeddingMembership(
        parseWeddingMembership({ ...partnerA, status: "revoked" }),
        helper,
      ),
    ).toBe(false);
  });

  it("limits coordinator defaults to the schedule, essential contacts and assigned tasks", () => {
    const coordinator = weddingMembership(actorA, "coordinator");

    expect(
      evaluateWeddingRecordPermission(
        coordinator,
        sharedRequest(actorA, "view", {
          area: "schedule",
          relationship: "workspace",
        }),
      ),
    ).toEqual({ allowed: true, reason: "allowed" });
    expect(
      evaluateWeddingRecordPermission(
        coordinator,
        sharedRequest(actorA, "view", {
          area: "contacts",
          relationship: "essential_contact",
        }),
      ),
    ).toEqual({ allowed: true, reason: "allowed" });
    expect(
      evaluateWeddingRecordPermission(
        coordinator,
        sharedRequest(actorA, "view", {
          relationship: "assigned",
        }),
      ),
    ).toEqual({ allowed: true, reason: "allowed" });

    for (const request of [
      sharedRequest(actorA, "view", {
        area: "contacts",
        relationship: "workspace",
      }),
      sharedRequest(actorA, "view", {
        area: "contacts",
        relationship: "explicitly_shared",
      }),
      sharedRequest(actorA, "view"),
      sharedRequest(actorA, "edit", { relationship: "assigned" }),
      sharedRequest(actorA, "download_export", {
        area: "schedule",
      }),
      sharedRequest(actorA, "view", { area: "budget" }),
    ]) {
      expect(
        evaluateWeddingRecordPermission(coordinator, request).allowed,
      ).toBe(false);
    }
  });

  it("limits helpers to assigned tasks and explicitly shared records", () => {
    const helper = weddingMembership(actorA, "helper");

    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "view", { relationship: "assigned" }),
      ).allowed,
    ).toBe(true);
    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "view", {
          area: "documents",
          relationship: "explicitly_shared",
        }),
      ).allowed,
    ).toBe(true);
    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "view", {
          area: "documents",
          relationship: "workspace",
        }),
      ),
    ).toEqual({ allowed: false, reason: "record_out_of_scope" });
    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "edit", { relationship: "assigned" }),
      ),
    ).toEqual({ allowed: false, reason: "permission_denied" });
  });

  it("applies explicit per-area overrides and requires view for edit or export", () => {
    const planner = weddingMembership(actorA, "planner", [
      {
        area: "vendors",
        action: "view",
        effect: "allow",
        scope: "workspace",
      },
      {
        area: "vendors",
        action: "edit",
        effect: "allow",
        scope: "assigned_or_shared",
      },
      {
        area: "documents",
        action: "download_export",
        effect: "allow",
        scope: "explicitly_shared",
      },
    ]);

    expect(
      evaluateWeddingRecordPermission(
        planner,
        sharedRequest(actorA, "view", { area: "vendors" }),
      ).allowed,
    ).toBe(true);
    expect(
      evaluateWeddingRecordPermission(
        planner,
        sharedRequest(actorA, "edit", {
          area: "vendors",
          relationship: "explicitly_shared",
        }),
      ).allowed,
    ).toBe(true);
    expect(
      evaluateWeddingRecordPermission(
        planner,
        sharedRequest(actorA, "edit", {
          area: "vendors",
          relationship: "workspace",
        }),
      ),
    ).toEqual({ allowed: false, reason: "record_out_of_scope" });
    expect(
      evaluateWeddingRecordPermission(
        planner,
        sharedRequest(actorA, "download_export", {
          area: "documents",
          relationship: "explicitly_shared",
        }),
      ),
    ).toEqual({ allowed: false, reason: "permission_denied" });
  });

  it("treats Edit as permission to create in the area while preserving record scope", () => {
    const helper = weddingMembership(actorA, "helper", [
      {
        area: "tasks",
        action: "edit",
        effect: "allow",
        scope: "assigned_or_shared",
      },
    ]);

    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "edit", {
          relationship: "new_record",
        }),
      ),
    ).toEqual({ allowed: true, reason: "allowed" });
    expect(
      evaluateWeddingRecordPermission(
        helper,
        sharedRequest(actorA, "edit", {
          relationship: "workspace",
        }),
      ),
    ).toEqual({ allowed: false, reason: "record_out_of_scope" });
  });

  it("lets explicit deny overrides remove preset access without removing membership", () => {
    const coordinator = weddingMembership(actorA, "coordinator", [
      { area: "schedule", action: "view", effect: "deny" },
    ]);

    expect(
      evaluateWeddingRecordPermission(
        coordinator,
        sharedRequest(actorA, "view", { area: "schedule" }),
      ),
    ).toEqual({ allowed: false, reason: "permission_denied" });
    expect(coordinator.role).toBe("coordinator");
  });

  it("denies actor and wedding mismatches before considering grants", () => {
    const partner = weddingMembership(actorA, "partner");
    expect(
      evaluateWeddingRecordPermission(partner, sharedRequest(actorB, "view")),
    ).toEqual({ allowed: false, reason: "actor_mismatch" });
    expect(
      evaluateWeddingRecordPermission(
        partner,
        sharedRequest(actorA, "view", { weddingId: weddingB }),
      ),
    ).toEqual({ allowed: false, reason: "cross_tenant" });
  });

  it("checks runtime visibility and immediately denies revoked or expired memberships", () => {
    const partner = weddingMembership(actorA, "partner");
    expect(
      evaluateWeddingRecordPermission(partner, {
        ...sharedRequest(actorA, "view"),
        visibility: "organization_private",
      } as unknown as WeddingRecordPermissionRequest),
    ).toEqual({ allowed: false, reason: "private_record" });

    const revoked = parseWeddingMembership({
      ...partner,
      status: "revoked",
    });
    expect(
      evaluateWeddingRecordPermission(revoked, sharedRequest(actorA, "view")),
    ).toEqual({ allowed: false, reason: "membership_inactive" });

    const expiring = parseWeddingMembership({
      ...weddingMembership(actorA, "coordinator"),
      accessExpiresAt: "2026-10-28T12:00:00.000Z",
    });
    const scheduleRequest = sharedRequest(actorA, "view", {
      area: "schedule",
    });
    expect(
      evaluateWeddingRecordPermission(
        expiring,
        scheduleRequest,
        new Date("2026-10-28T12:00:00.000Z"),
      ),
    ).toEqual({ allowed: false, reason: "membership_inactive" });
    expect(
      evaluateWeddingRecordPermission(
        expiring,
        scheduleRequest,
        new Date("2026-10-28T11:59:59.999Z"),
      ),
    ).toEqual({ allowed: true, reason: "allowed" });
  });
});

describe("planner-private record visibility", () => {
  const privateRequest = {
    actorId: actorA,
    organizationId: organizationA,
    area: "notes",
    action: "view",
    relationship: "workspace",
    visibility: "organization_private",
  } as const;

  it("denies wedding partners and absent organization memberships", () => {
    const partner = weddingMembership(actorA, "partner");
    expect(partner.role).toBe("partner");
    expect(
      evaluateOrganizationPrivateRecordPermission(undefined, privateRequest),
    ).toEqual({ allowed: false, reason: "private_record" });
  });

  it("requires an explicit organization grant and exact organization scope", () => {
    const membership = parseOrganizationMembership({
      actorId: actorA,
      organizationId: organizationA,
      status: "active",
      permissionOverrides: [
        {
          area: "notes",
          action: "view",
          effect: "allow",
          scope: "workspace",
        },
      ],
    });
    expect(
      evaluateOrganizationPrivateRecordPermission(membership, privateRequest),
    ).toEqual({ allowed: true, reason: "allowed" });
    expect(
      evaluateOrganizationPrivateRecordPermission(membership, {
        ...privateRequest,
        organizationId: organizationB,
      }),
    ).toEqual({ allowed: false, reason: "cross_tenant" });
    expect(
      evaluateOrganizationPrivateRecordPermission(membership, {
        ...privateRequest,
        actorId: actorB,
      }),
    ).toEqual({ allowed: false, reason: "actor_mismatch" });
    expect(
      evaluateOrganizationPrivateRecordPermission(membership, {
        ...privateRequest,
        action: "edit",
      }),
    ).toEqual({ allowed: false, reason: "permission_denied" });

    expect(
      evaluateOrganizationPrivateRecordPermission(
        parseOrganizationMembership({ ...membership, status: "revoked" }),
        privateRequest,
      ),
    ).toEqual({ allowed: false, reason: "membership_inactive" });
  });

  it("keeps independent-planner records with their exact owner after wedding access ends", () => {
    const identity = parseIndependentPlannerIdentity({
      actorId: actorA,
      status: "active",
    });
    const request = {
      actorId: actorA,
      ownerActorId: actorA,
      area: "notes",
      action: "edit",
      relationship: "workspace",
      visibility: "independent_planner_private",
    } as const;

    expect(
      evaluateIndependentPlannerPrivateRecordPermission(identity, request),
    ).toEqual({ allowed: true, reason: "allowed" });
    expect(
      evaluateIndependentPlannerPrivateRecordPermission(identity, {
        ...request,
        ownerActorId: actorB,
      }),
    ).toEqual({ allowed: false, reason: "actor_mismatch" });
    expect(
      evaluateIndependentPlannerPrivateRecordPermission(
        parseIndependentPlannerIdentity({
          actorId: actorA,
          status: "revoked",
        }),
        request,
      ),
    ).toEqual({ allowed: false, reason: "membership_inactive" });
  });
});
