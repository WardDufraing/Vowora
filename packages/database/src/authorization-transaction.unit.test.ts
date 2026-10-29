import { describe, expect, it, vi } from "vitest";

import {
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
  type ServerAuthorizationState,
  type WeddingRolePreset,
} from "@vowora/domain";

import {
  assertAuthorizedRepositoryCall,
  type AuthorizedTenantTransaction,
  type TransactionHost,
  withAuthorizedTenantTransaction,
} from "./tenant.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const recordId = "019a1f5e-70a0-7000-8000-000000000003";
const otherRecordId = "019a1f5e-70a0-7000-8000-000000000004";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

function mutableAuthorizationState(
  options: {
    relationship?: "workspace" | "assigned" | "explicitly_shared";
    role?: WeddingRolePreset;
  } = {},
) {
  let permissionScopeVersion = "wedding:10";
  let relationship = options.relationship ?? "workspace";
  let status: "active" | "revoked" = "active";
  const role = options.role ?? "partner";
  const authorizationSessions: unknown[] = [];
  const state: ServerAuthorizationState = {
    async loadWeddingMembership(input) {
      if (input.authorizationSession !== undefined) {
        authorizationSessions.push(input.authorizationSession);
      }
      return {
        membership: {
          actorId,
          weddingId,
          role,
          status,
          accessExpiresAt: null,
          permissionOverrides: [],
        },
        permissionScopeVersion,
      };
    },
    async loadWeddingRecord(input) {
      if (input.authorizationSession !== undefined) {
        authorizationSessions.push(input.authorizationSession);
      }
      return {
        weddingId,
        area: "tasks",
        relationship,
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
  return {
    authorizationSessions,
    changeScopeVersion(value: string) {
      permissionScopeVersion = value;
    },
    reassign(value: typeof relationship) {
      relationship = value;
    },
    revoke() {
      status = "revoked";
    },
    state,
  };
}

async function viewOperation(state: ServerAuthorizationState) {
  return authorizeWeddingServerOperation(
    { actorId },
    {
      action: "view",
      correlationId,
      recordId,
      resource: "existing",
      weddingId,
    },
    state,
  );
}

describe("authorized tenant transaction", () => {
  it("revalidates in the transaction and passes the exact capability to repositories", async () => {
    const session = { database: true as const };
    const host: TransactionHost<typeof session> = {
      transaction: vi.fn(async (callback) => callback(session)),
    };
    const mutable = mutableAuthorizationState();
    const operation = await viewOperation(mutable.state);
    let leakedCall: AuthorizedTenantTransaction<typeof session> | undefined;

    const result = await withAuthorizedTenantTransaction(
      host,
      operation,
      async (call) => {
        leakedCall = call;
        expect(call.authorization).toBe(operation.authorization);
        expect(call.operation).toBe(operation);
        expect(call.session).toBe(session);
        expect(() =>
          assertAuthorizedRepositoryCall(call, {
            area: "tasks",
            action: "view",
            resource: { kind: "existing", id: recordId },
            visibility: "wedding_shared",
          }),
        ).not.toThrow();
        return "committed";
      },
    );

    expect(result).toBe("committed");
    expect(host.transaction).toHaveBeenCalledOnce();
    expect(mutable.authorizationSessions).toEqual([session, session]);
    expect(() =>
      assertAuthorizedRepositoryCall(leakedCall!, {
        area: "tasks",
        action: "view",
        resource: { kind: "existing", id: recordId },
        visibility: "wedding_shared",
      }),
    ).toThrow();
  });

  it("rejects a structurally forged repository call", async () => {
    const operation = await viewOperation(mutableAuthorizationState().state);
    expect(() =>
      assertAuthorizedRepositoryCall(
        {
          authorization: operation.authorization,
          operation,
          session: { database: true },
        },
        {
          area: "tasks",
          action: "view",
          resource: { kind: "existing", id: recordId },
          visibility: "wedding_shared",
        },
      ),
    ).toThrow();
  });

  it("prevents a task View capability from reaching another repository contract", async () => {
    const session = { database: true as const };
    const host: TransactionHost<typeof session> = {
      transaction: vi.fn(async (callback) => callback(session)),
    };
    const operation = await viewOperation(mutableAuthorizationState().state);

    await withAuthorizedTenantTransaction(host, operation, async (call) => {
      for (const requirement of [
        {
          area: "tasks",
          action: "edit",
          resource: { kind: "existing", id: recordId },
          visibility: "wedding_shared",
        },
        {
          area: "tasks",
          action: "edit",
          resource: { kind: "new" },
          visibility: "wedding_shared",
        },
        {
          area: "tasks",
          action: "view",
          resource: { kind: "existing", id: otherRecordId },
          visibility: "wedding_shared",
        },
        {
          area: "budget",
          action: "view",
          resource: { kind: "existing", id: recordId },
          visibility: "wedding_shared",
        },
        {
          area: "tasks",
          action: "view",
          resource: { kind: "existing", id: recordId },
          visibility: "organization_private",
        },
      ] as const) {
        expect(() => assertAuthorizedRepositoryCall(call, requirement)).toThrow(
          ServerAuthorizationError,
        );
      }
    });
  });

  it("rejects structural clones before a transaction opens", async () => {
    const host: TransactionHost<{ database: true }> = {
      transaction: vi.fn(async (callback) => callback({ database: true })),
    };
    const operation = await viewOperation(mutableAuthorizationState().state);

    expect(() =>
      withAuthorizedTenantTransaction(
        host,
        { ...operation },
        async () => undefined,
      ),
    ).toThrow(ServerAuthorizationError);
    expect(host.transaction).not.toHaveBeenCalled();
  });

  it("consumes a capability once", async () => {
    const callback = vi.fn(async () => undefined);
    const host: TransactionHost<{ database: true }> = {
      transaction: vi.fn(async (work) => work({ database: true })),
    };
    const operation = await viewOperation(mutableAuthorizationState().state);

    await withAuthorizedTenantTransaction(host, operation, callback);
    await expect(
      withAuthorizedTenantTransaction(host, operation, callback),
    ).rejects.toMatchObject({ failure: "access_denied" });
    expect(callback).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "revocation",
      (state: ReturnType<typeof mutableAuthorizationState>) => state.revoke(),
    ],
    [
      "permission scope version change",
      (state: ReturnType<typeof mutableAuthorizationState>) =>
        state.changeScopeVersion("wedding:11"),
    ],
  ])("rejects stale authorization after %s", async (_name, mutate) => {
    const mutable = mutableAuthorizationState();
    const operation = await viewOperation(mutable.state);
    mutate(mutable);
    const callback = vi.fn(async () => undefined);

    await expect(
      withAuthorizedTenantTransaction(
        { transaction: async (work) => work({ database: true }) },
        operation,
        callback,
      ),
    ).rejects.toMatchObject({ failure: "access_denied" });
    expect(callback).not.toHaveBeenCalled();
  });

  it.each([
    ["reassignment", "helper", "assigned"],
    ["unsharing", "read_only_guest", "explicitly_shared"],
  ] as const)(
    "rejects stale authorization after %s",
    async (_name, role, initialRelationship) => {
      const mutable = mutableAuthorizationState({
        relationship: initialRelationship,
        role,
      });
      const operation = await viewOperation(mutable.state);
      mutable.reassign("workspace");
      const callback = vi.fn(async () => undefined);

      await expect(
        withAuthorizedTenantTransaction(
          { transaction: async (work) => work({ database: true }) },
          operation,
          callback,
        ),
      ).rejects.toMatchObject({ failure: "access_denied" });
      expect(callback).not.toHaveBeenCalled();
    },
  );
});
