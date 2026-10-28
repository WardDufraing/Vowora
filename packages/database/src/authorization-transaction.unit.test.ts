import { describe, expect, it, vi } from "vitest";

import {
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
  type ServerAuthorizationState,
} from "@vowora/domain";

import {
  type TransactionHost,
  withAuthorizedTenantTransaction,
} from "./tenant.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const recordId = "019a1f5e-70a0-7000-8000-000000000003";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function authorizationState(): ServerAuthorizationState {
  return {
    async loadWeddingMembership() {
      return {
        membership: {
          actorId,
          weddingId,
          role: "partner",
          status: "active",
          accessExpiresAt: null,
          permissionOverrides: [],
        },
        permissionScopeVersion: "wedding:10",
      };
    },
    async loadWeddingRecord() {
      return {
        weddingId,
        area: "tasks",
        relationship: "workspace",
        visibility: "wedding_shared",
      };
    },
    async loadOrganizationMembership() {
      return undefined;
    },
    async loadOrganizationRecord() {
      return undefined;
    },
    async loadIndependentPlannerIdentity() {
      return undefined;
    },
    async loadIndependentPlannerRecord() {
      return undefined;
    },
  };
}

describe("authorized tenant transaction", () => {
  it("opens one transaction only after central authorization", async () => {
    const session = { database: true as const };
    const host: TransactionHost<typeof session> = {
      transaction: vi.fn(async (callback) => callback(session)),
    };
    const operation = await authorizeWeddingServerOperation(
      { actorId },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
      },
      authorizationState(),
    );

    const result = await withAuthorizedTenantTransaction(
      host,
      operation,
      async (call) => {
        expect(call.authorization).toBe(operation.authorization);
        expect(call.session).toBe(session);
        return "committed";
      },
    );

    expect(result).toBe("committed");
    expect(host.transaction).toHaveBeenCalledOnce();
  });

  it("rejects structural clones and forged operations before a transaction opens", async () => {
    const host: TransactionHost<{ database: true }> = {
      transaction: vi.fn(async (callback) => callback({ database: true })),
    };
    const operation = await authorizeWeddingServerOperation(
      { actorId },
      {
        action: "view",
        correlationId,
        recordId,
        resource: "existing",
        weddingId,
      },
      authorizationState(),
    );

    expect(() =>
      withAuthorizedTenantTransaction(
        host,
        { ...operation },
        async () => undefined,
      ),
    ).toThrow(ServerAuthorizationError);
    expect(host.transaction).not.toHaveBeenCalled();
  });
});
