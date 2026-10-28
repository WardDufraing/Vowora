import { describe, expect, it, vi } from "vitest";
import { pgTable, uuid } from "drizzle-orm/pg-core";

import {
  parseAuthorizationContextInput,
  resolveAuthorizationContext,
  type AuthorizationContext,
  type AuthorizationContextVerifier,
} from "@vowora/domain";

import {
  assertTenantWriteScope,
  TenantScopeViolationError,
  type TransactionHost,
  withTenantTransaction,
} from "./tenant.js";

const contextInput = {
  actorId: "019a1f5e-70a0-7000-8000-000000000001",
  activeWeddingId: "019a1f5e-70a0-7000-8000-000000000002",
  activeOrganizationId: "019a1f5e-70a0-7000-8000-000000000003",
  permissionScopeVersion: "scope:1",
  correlationId: "fd901f2e-3f91-4e12-a32e-cf48c853fd44",
};
const verifier: AuthorizationContextVerifier = {
  async authorize(candidate) {
    return candidate.actorId === contextInput.actorId;
  },
};

function authorization() {
  return resolveAuthorizationContext(contextInput, verifier);
}

const scopedRecord = pgTable("scoped_record", {
  weddingId: uuid("wedding_id"),
  organizationId: uuid("organization_id"),
  privateOwnerActorId: uuid("private_owner_actor_id"),
});
const bothScopes = {
  weddingId: scopedRecord.weddingId,
  organizationId: scopedRecord.organizationId,
};

describe("tenant primitives", () => {
  it("accepts matching write scope and denies missing or different tenants", async () => {
    const context = await authorization();
    expect(() =>
      assertTenantWriteScope(
        context,
        {
          weddingId: context.activeWeddingId,
          organizationId: context.activeOrganizationId,
        },
        bothScopes,
      ),
    ).not.toThrow();
    for (const values of [
      {},
      { weddingId: "019a1f5e-70a0-7000-8000-000000000099" },
      { organizationId: "019a1f5e-70a0-7000-8000-000000000099" },
    ]) {
      expect(() => assertTenantWriteScope(context, values, bothScopes)).toThrow(
        TenantScopeViolationError,
      );
    }
  });

  it("enforces exact actor ownership for independent-planner private writes", async () => {
    const context = await resolveAuthorizationContext(
      {
        actorId: contextInput.actorId,
        activePrivateOwnerActorId: contextInput.actorId,
        permissionScopeVersion: "private:1",
        correlationId: contextInput.correlationId,
      },
      verifier,
    );
    const ownerScope = {
      privateOwnerActorId: scopedRecord.privateOwnerActorId,
    };

    expect(() =>
      assertTenantWriteScope(
        context,
        { privateOwnerActorId: contextInput.actorId },
        ownerScope,
      ),
    ).not.toThrow();
    expect(() =>
      assertTenantWriteScope(
        context,
        { privateOwnerActorId: "019a1f5e-70a0-7000-8000-000000000099" },
        ownerScope,
      ),
    ).toThrow(TenantScopeViolationError);
  });

  it("validates once and supplies one transaction session to the callback", async () => {
    const context = await authorization();
    const session = { marker: "one transaction" };
    const callback = vi.fn(async (transaction) => transaction.session.marker);
    let transactionCalls = 0;
    const host: TransactionHost<typeof session> = {
      async transaction<Result>(
        work: (value: typeof session) => Promise<Result>,
      ): Promise<Result> {
        transactionCalls += 1;
        return work(session);
      },
    };

    await expect(withTenantTransaction(host, context, callback)).resolves.toBe(
      "one transaction",
    );
    expect(transactionCalls).toBe(1);
    expect(callback).toHaveBeenCalledWith({ authorization: context, session });
  });

  it("rejects unresolved context before opening a transaction", () => {
    const transaction = vi.fn();
    const unresolved = parseAuthorizationContextInput(contextInput);

    expect(() =>
      withTenantTransaction(
        { transaction },
        unresolved as unknown as AuthorizationContext,
        async () => undefined,
      ),
    ).toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a clone of a resolved context before opening a transaction", async () => {
    const transaction = vi.fn();
    const resolved = await authorization();

    expect(() =>
      withTenantTransaction(
        { transaction },
        { ...resolved } as AuthorizationContext,
        async () => undefined,
      ),
    ).toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
});
