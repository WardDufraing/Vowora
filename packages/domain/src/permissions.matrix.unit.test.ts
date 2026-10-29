import { describe, expect, it } from "vitest";

import {
  evaluateIndependentPlannerPrivateRecordPermission,
  evaluateOrganizationPrivateRecordPermission,
  evaluateWeddingRecordPermission,
  parseIndependentPlannerIdentity,
  parseOrganizationMembership,
  parseWeddingMembership,
  recordRelationships,
  weddingPermissionActions,
  weddingPermissionAreas,
  weddingRolePresets,
  type RecordRelationship,
  type WeddingPermissionAction,
  type WeddingPermissionArea,
  type WeddingRolePreset,
} from "./index.js";

const actorA = "019a1f5e-70a0-7000-8000-000000000001";
const actorB = "019a1f5e-70a0-7000-8000-000000000002";
const weddingA = "019a1f5e-70a0-7000-8000-000000000010";
const weddingB = "019a1f5e-70a0-7000-8000-000000000011";
const organizationA = "019a1f5e-70a0-7000-8000-000000000020";
const organizationB = "019a1f5e-70a0-7000-8000-000000000021";

function presetAllows(
  role: WeddingRolePreset,
  area: WeddingPermissionArea,
  action: WeddingPermissionAction,
  relationship: RecordRelationship,
): boolean {
  if (role === "partner") {
    return relationship !== "new_record" || action === "edit";
  }
  if (role === "planner" || action !== "view") return false;
  if (relationship === "new_record") return false;
  if (role === "coordinator") {
    return (
      area === "schedule" ||
      (area === "contacts" && relationship === "essential_contact") ||
      (area === "tasks" && relationship === "assigned")
    );
  }
  if (role === "helper") {
    return area === "tasks"
      ? relationship === "assigned" || relationship === "explicitly_shared"
      : relationship === "explicitly_shared";
  }
  return relationship === "explicitly_shared";
}

describe("role-resource-action negative matrix", () => {
  it("matches every default role preset across area, action and record relationship", () => {
    let denied = 0;
    let allowed = 0;
    for (const role of weddingRolePresets) {
      const membership = parseWeddingMembership({
        actorId: actorA,
        weddingId: weddingA,
        role,
        status: "active",
        accessExpiresAt: null,
        permissionOverrides: [],
      });
      for (const area of weddingPermissionAreas) {
        for (const action of weddingPermissionActions) {
          for (const relationship of recordRelationships) {
            const decision = evaluateWeddingRecordPermission(membership, {
              actorId: actorA,
              weddingId: weddingA,
              area,
              action,
              relationship,
              visibility: "wedding_shared",
            });
            const expected = presetAllows(role, area, action, relationship);
            expect(
              decision.allowed,
              `${role}:${area}:${action}:${relationship}`,
            ).toBe(expected);
            if (expected) allowed += 1;
            else denied += 1;
          }
        }
      }
    }
    expect(denied).toBeGreaterThan(allowed);
    expect(denied + allowed).toBe(
      weddingRolePresets.length *
        weddingPermissionAreas.length *
        weddingPermissionActions.length *
        recordRelationships.length,
    );
  });

  it("denies cross-wedding, cross-organization and private-owner confusion", () => {
    const partner = parseWeddingMembership({
      actorId: actorA,
      weddingId: weddingA,
      role: "partner",
      status: "active",
      accessExpiresAt: null,
      permissionOverrides: [],
    });
    expect(
      evaluateWeddingRecordPermission(partner, {
        actorId: actorA,
        weddingId: weddingB,
        area: "tasks",
        action: "view",
        relationship: "workspace",
        visibility: "wedding_shared",
      }),
    ).toEqual({ allowed: false, reason: "cross_tenant" });

    const organizationMember = parseOrganizationMembership({
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
      evaluateOrganizationPrivateRecordPermission(organizationMember, {
        actorId: actorA,
        organizationId: organizationB,
        area: "notes",
        action: "view",
        relationship: "workspace",
        visibility: "organization_private",
      }),
    ).toEqual({ allowed: false, reason: "cross_tenant" });

    const privateIdentity = parseIndependentPlannerIdentity({
      actorId: actorA,
      status: "active",
    });
    expect(
      evaluateIndependentPlannerPrivateRecordPermission(privateIdentity, {
        actorId: actorA,
        ownerActorId: actorB,
        area: "notes",
        action: "view",
        relationship: "workspace",
        visibility: "independent_planner_private",
      }),
    ).toEqual({ allowed: false, reason: "actor_mismatch" });
  });

  it("applies revocation and expiry at the exact evaluation instant", () => {
    for (const membership of [
      {
        actorId: actorA,
        weddingId: weddingA,
        role: "helper" as const,
        status: "revoked" as const,
        accessExpiresAt: null,
        permissionOverrides: [],
      },
      {
        actorId: actorA,
        weddingId: weddingA,
        role: "helper" as const,
        status: "active" as const,
        accessExpiresAt: "2026-10-29T09:00:00.000Z",
        permissionOverrides: [],
      },
    ]) {
      const decision = evaluateWeddingRecordPermission(
        parseWeddingMembership(membership),
        {
          actorId: actorA,
          weddingId: weddingA,
          area: "tasks",
          action: "view",
          relationship: "assigned",
          visibility: "wedding_shared",
        },
        new Date("2026-10-29T09:00:00.000Z"),
      );
      expect(decision).toEqual({
        allowed: false,
        reason: "membership_inactive",
      });
    }
  });
});
