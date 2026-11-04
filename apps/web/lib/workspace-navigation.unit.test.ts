import { describe, expect, it } from "vitest";

import {
  assertWeddingShellDestination,
  resolveWeddingShellNavigation,
  selectMobilePrimaryDestinations,
  WeddingNavigationAccessError,
} from "./workspace-navigation";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const otherWeddingId = "019a1f5e-70a0-7000-8000-000000000003";
const now = new Date("2026-10-30T10:00:00.000Z");

function membership(
  role: "partner" | "planner" | "coordinator" | "helper" | "read_only_guest",
  overrides: readonly object[] = [],
) {
  return {
    actorId,
    weddingId,
    role,
    status: "active",
    accessExpiresAt:
      role === "partner" || role === "planner"
        ? null
        : "2026-11-01T00:00:00.000Z",
    permissionOverrides: overrides,
  };
}

const workspaces = [
  {
    weddingId,
    name: "Jordan & Alex",
    weddingDate: "2027-06-12",
    lastOpenedAt: "2026-10-30T09:00:00.000Z",
    membership: membership("partner"),
  },
  {
    weddingId: otherWeddingId,
    name: "Morgan & Riley",
    weddingDate: null,
    lastOpenedAt: "2026-10-29T09:00:00.000Z",
    membership: {
      ...membership("planner"),
      weddingId: otherWeddingId,
    },
  },
];

describe("authoritative wedding shell navigation", () => {
  it("uses the approved order and full partner visibility", () => {
    const model = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("partner"),
      workspaces,
      requestedPath: `/weddings/${weddingId}/vendors`,
      evaluatedAt: now,
    });
    expect(model.destinations.map(({ id }) => id)).toEqual([
      "dashboard",
      "timeline",
      "decisions",
      "vendors",
      "budget",
      "guests",
      "schedule",
      "contacts",
      "documents-notes",
      "inspiration",
      "reports",
      "settings",
    ]);
    expect(model.activeDestination).toBe("vendors");
    expect(model.workspaceOptions).toHaveLength(2);
    expect(model.workspaceOptions[1]).toMatchObject({
      dateLabel: "Date not set",
      href: `/weddings/${otherWeddingId}/dashboard`,
    });
  });

  it("shows scoped helper areas while keeping download/export and settings hidden", () => {
    const helper = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("helper", [
        {
          area: "budget",
          action: "view",
          effect: "allow",
          scope: "explicitly_shared",
        },
      ]),
      workspaces: [workspaces[0]],
      evaluatedAt: now,
    });
    expect(helper.destinations.map(({ id }) => id)).toEqual([
      "dashboard",
      "timeline",
      "decisions",
      "vendors",
      "budget",
      "guests",
      "schedule",
      "contacts",
      "documents-notes",
      "inspiration",
    ]);
    expect(
      selectMobilePrimaryDestinations(helper.destinations).map(({ id }) => id),
    ).toEqual(["dashboard", "timeline", "guests", "budget"]);
    expect(helper.destinations.some(({ id }) => id === "reports")).toBe(false);
    expect(helper.destinations.some(({ id }) => id === "settings")).toBe(false);
  });

  it("maps coordinator defaults to timeline, schedule and essential contacts", () => {
    const coordinator = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("coordinator"),
      workspaces: [workspaces[0]],
      evaluatedAt: now,
    });
    expect(coordinator.destinations.map(({ id }) => id)).toEqual([
      "dashboard",
      "timeline",
      "schedule",
      "contacts",
    ]);
  });

  it("denies unauthorized and cross-wedding deep links instead of relying on hidden UI", () => {
    const coordinator = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("coordinator"),
      workspaces: [workspaces[0]],
      evaluatedAt: now,
    });
    expect(() => assertWeddingShellDestination(coordinator, "guests")).toThrow(
      WeddingNavigationAccessError,
    );
    for (const requestedPath of [
      `/weddings/${weddingId}/guests`,
      `/weddings/${otherWeddingId}/timeline`,
      `/weddings/${weddingId}/unknown`,
    ]) {
      expect(() =>
        resolveWeddingShellNavigation({
          actorId,
          weddingId,
          membership: membership("coordinator"),
          workspaces: [workspaces[0]],
          requestedPath,
          evaluatedAt: now,
        }),
      ).toThrow(WeddingNavigationAccessError);
    }
  });

  it("fails closed for actor mismatch, revoked/expired membership and untrusted workspace options", () => {
    const invalidMemberships = [
      { ...membership("helper"), actorId: otherWeddingId },
      { ...membership("helper"), status: "revoked" },
      { ...membership("helper"), accessExpiresAt: now.toISOString() },
    ];
    for (const candidate of invalidMemberships) {
      expect(() =>
        resolveWeddingShellNavigation({
          actorId,
          weddingId,
          membership: candidate,
          workspaces: [workspaces[0]],
          evaluatedAt: now,
        }),
      ).toThrow(WeddingNavigationAccessError);
    }
    expect(() =>
      resolveWeddingShellNavigation({
        actorId,
        weddingId,
        membership: membership("partner"),
        workspaces: [
          {
            ...workspaces[0],
            membership: {
              ...membership("partner"),
              actorId: otherWeddingId,
            },
          },
        ],
        evaluatedAt: now,
      }),
    ).toThrow(WeddingNavigationAccessError);
  });

  it("excludes inaccessible workspace options and orders accessible weddings by recency", () => {
    expect(() =>
      resolveWeddingShellNavigation({
        actorId,
        weddingId,
        membership: membership("partner"),
        workspaces: [
          workspaces[0],
          {
            ...workspaces[1],
            membership: {
              ...membership("planner"),
              weddingId: otherWeddingId,
              status: "revoked",
            },
          },
        ],
        evaluatedAt: now,
      }),
    ).toThrow(WeddingNavigationAccessError);

    const ordered = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("partner"),
      workspaces: [
        workspaces[0],
        { ...workspaces[1], lastOpenedAt: "2026-10-31T09:00:00.000Z" },
      ],
      evaluatedAt: now,
    });
    expect(ordered.workspaceOptions.map(({ weddingId }) => weddingId)).toEqual([
      otherWeddingId,
      weddingId,
    ]);
  });

  it("uses the authorized current membership for the displayed current role", () => {
    const current = resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: membership("coordinator"),
      workspaces: [
        {
          ...workspaces[0],
          membership: membership("helper", [
            {
              area: "budget",
              action: "view",
              effect: "allow",
              scope: "explicitly_shared",
            },
          ]),
        },
      ],
      evaluatedAt: now,
    });

    expect(current.roleLabel).toBe("Coordinator");
    expect(current.workspaceOptions[0]?.roleLabel).toBe("Coordinator");
    expect(current.destinations.map(({ id }) => id)).toEqual([
      "dashboard",
      "timeline",
      "schedule",
      "contacts",
    ]);
  });
});
