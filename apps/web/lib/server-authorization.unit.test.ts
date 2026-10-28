import { problemDetailsSchema } from "@vowora/contracts";
import type { ServerAuthorizationState } from "@vowora/domain";
import { describe, expect, it, vi } from "vitest";

import { authorizeApiOperation } from "./server-authorization";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const otherWeddingId = "019a1f5e-70a0-7000-8000-000000000003";
const recordId = "019a1f5e-70a0-7000-8000-000000000004";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function auth(userId: string | null = actorId) {
  return {
    api: {
      getSession: vi.fn(async () =>
        userId === null ? null : { user: { id: userId } },
      ),
    },
  };
}

function state(
  overrides: Partial<ServerAuthorizationState> = {},
): ServerAuthorizationState {
  return {
    loadWeddingMembership: vi.fn(async () => ({
      membership: {
        actorId,
        weddingId,
        role: "partner",
        status: "active",
        accessExpiresAt: null,
        permissionOverrides: [],
      },
      permissionScopeVersion: "wedding:9",
    })),
    loadWeddingRecord: vi.fn(async () => ({
      weddingId,
      area: "tasks" as const,
      relationship: "workspace" as const,
      visibility: "wedding_shared" as const,
    })),
    loadOrganizationMembership: vi.fn(async () => undefined),
    loadOrganizationRecord: vi.fn(async () => undefined),
    loadIndependentPlannerIdentity: vi.fn(async () => undefined),
    loadIndependentPlannerRecord: vi.fn(async () => undefined),
    ...overrides,
  };
}

function request() {
  return new Request("https://app.vowora.test/api/v1/weddings/record", {
    headers: { "x-correlation-id": correlationId },
  });
}

async function problem(response: Response) {
  return problemDetailsSchema.parse(await response.json());
}

describe("API server authorization boundary", () => {
  it("denies anonymous access before tenant state is loaded", async () => {
    const authorizationState = state();
    const result = await authorizeApiOperation(
      auth(null),
      request(),
      {
        tenant: "wedding",
        operation: {
          action: "view",
          recordId,
          resource: "existing",
          weddingId,
        },
      },
      authorizationState,
    );

    expect(result.authorized).toBe(false);
    if (result.authorized) return;
    expect(result.response.status).toBe(401);
    expect(await problem(result.response)).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
      correlationId,
    });
    expect(authorizationState.loadWeddingMembership).not.toHaveBeenCalled();
  });

  it("uses the authenticated session actor and returns the opaque operation", async () => {
    const authorizationState = state();
    const result = await authorizeApiOperation(
      auth(),
      request(),
      {
        tenant: "wedding",
        operation: {
          action: "view",
          recordId,
          resource: "existing",
          weddingId,
        },
      },
      authorizationState,
    );

    expect(result.authorized).toBe(true);
    if (!result.authorized) return;
    expect(result.operation.authorization).toMatchObject({
      actorId,
      activeWeddingId: weddingId,
      correlationId,
    });
    expect(authorizationState.loadWeddingMembership).toHaveBeenCalledWith({
      actorId,
      weddingId,
    });
  });

  it("routes independent-planner private records through actor-owner scope", async () => {
    const authorizationState = state({
      loadIndependentPlannerIdentity: async () => ({
        membership: { actorId, status: "active" },
        permissionScopeVersion: "private-owner:3",
      }),
      loadIndependentPlannerRecord: async () => ({
        area: "notes",
        ownerActorId: actorId,
        relationship: "workspace",
        visibility: "independent_planner_private",
      }),
    });
    const result = await authorizeApiOperation(
      auth(),
      request(),
      {
        tenant: "private_owner",
        operation: { action: "view", recordId },
      },
      authorizationState,
    );

    expect(result.authorized).toBe(true);
    if (!result.authorized) return;
    expect(result.operation).toMatchObject({
      visibility: "independent_planner_private",
      authorization: {
        actorId,
        activePrivateOwnerActorId: actorId,
      },
    });
  });

  it("returns the same privacy-safe denial for cross-tenant and role failures", async () => {
    const denials = [
      state({
        loadWeddingRecord: async () => ({
          weddingId: otherWeddingId,
          area: "tasks",
          relationship: "workspace",
          visibility: "wedding_shared",
        }),
      }),
      state({ loadWeddingMembership: async () => undefined }),
    ];

    for (const authorizationState of denials) {
      const result = await authorizeApiOperation(
        auth(),
        request(),
        {
          tenant: "wedding",
          operation: {
            action: "view",
            recordId,
            resource: "existing",
            weddingId,
          },
        },
        authorizationState,
      );
      expect(result.authorized).toBe(false);
      if (result.authorized) continue;
      expect(result.response.status).toBe(403);
      const body = await problem(result.response);
      expect(body).toMatchObject({
        code: "ACCESS_DENIED",
        detail: "The requested operation is not permitted.",
      });
      expect(JSON.stringify(body)).not.toContain(otherWeddingId);
      expect(JSON.stringify(body)).not.toContain(actorId);
    }
  });

  it("rejects over-posted policy facts instead of trusting client context", async () => {
    const authorizationState = state();
    const result = await authorizeApiOperation(
      auth(),
      request(),
      {
        tenant: "wedding",
        operation: {
          action: "view",
          recordId,
          resource: "existing",
          weddingId,
          relationship: "workspace",
          visibility: "wedding_shared",
          actorId,
        } as never,
      },
      authorizationState,
    );

    expect(result.authorized).toBe(false);
    if (result.authorized) return;
    expect(result.response.status).toBe(403);
    expect(authorizationState.loadWeddingMembership).not.toHaveBeenCalled();
  });

  it("fails closed with Problem Details when session or policy state is unavailable", async () => {
    const throwingAuth = auth();
    throwingAuth.api.getSession.mockRejectedValueOnce(
      new Error("private auth provider detail"),
    );
    for (const [sessionAuth, authorizationState] of [
      [throwingAuth, state()],
      [
        auth(),
        state({
          loadWeddingMembership: async () => {
            throw new Error("private database detail");
          },
        }),
      ],
    ] as const) {
      const result = await authorizeApiOperation(
        sessionAuth,
        request(),
        {
          tenant: "wedding",
          operation: {
            action: "view",
            recordId,
            resource: "existing",
            weddingId,
          },
        },
        authorizationState,
      );
      expect(result.authorized).toBe(false);
      if (result.authorized) continue;
      expect(result.response.status).toBe(503);
      const body = await problem(result.response);
      expect(body.code).toBe("AUTHORIZATION_UNAVAILABLE");
      expect(JSON.stringify(body)).not.toContain("private");
    }
  });
});
