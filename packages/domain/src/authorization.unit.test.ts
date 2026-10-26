import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  AuthorizationContextError,
  assertAuthorizationContext,
  parseAuthorizationContextInput,
  resolveAuthorizationContext,
  type AuthorizationContext,
  type AuthorizationContextInput,
  type AuthorizationContextVerifier,
  type TenantRepositoryCall,
  type TenantScopedRepository,
} from "./index.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

const verifier: AuthorizationContextVerifier = {
  async authorize(candidate) {
    return (
      candidate.actorId === actorId && candidate.activeWeddingId === weddingId
    );
  },
};

const input = {
  actorId,
  activeWeddingId: weddingId,
  permissionScopeVersion: "wedding:7",
  correlationId,
};

describe("authorization context", () => {
  it("resolves and freezes an explicitly verified actor context", async () => {
    const context = await resolveAuthorizationContext(input, verifier);

    expect(context).toEqual(input);
    expect(Object.isFrozen(context)).toBe(true);
    expect(() => assertAuthorizationContext(context)).not.toThrow();
  });

  it("keeps parsed transport metadata distinct from resolved authorization", async () => {
    const candidate = parseAuthorizationContextInput(input);
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(() => assertAuthorizationContext(candidate)).toThrow(
      AuthorizationContextError,
    );
    expectTypeOf<AuthorizationContextInput>().not.toMatchTypeOf<AuthorizationContext>();

    const rejectingVerifier: AuthorizationContextVerifier = {
      authorize: vi.fn(async () => false),
    };
    await expect(
      resolveAuthorizationContext(input, rejectingVerifier),
    ).rejects.toMatchObject({ fields: ["authorization"] });

    const resolved = await resolveAuthorizationContext(input, verifier);
    for (const forged of [candidate, { ...candidate }, { ...resolved }]) {
      expect(() => assertAuthorizationContext(forged)).toThrow(
        AuthorizationContextError,
      );
    }

    const throwingVerifier: AuthorizationContextVerifier = {
      async authorize() {
        throw new Error("private upstream detail");
      },
    };
    await expect(
      resolveAuthorizationContext(input, throwingVerifier),
    ).rejects.toMatchObject({ fields: ["authorization"] });

    const nonBooleanVerifier = {
      async authorize() {
        return "yes";
      },
    } as unknown as AuthorizationContextVerifier;
    await expect(
      resolveAuthorizationContext(input, nonBooleanVerifier),
    ).rejects.toMatchObject({ fields: ["authorization"] });
  });

  it("denies unscoped, malformed and over-posted contexts without reflecting values", async () => {
    const privateValue = "private-invalid-actor";
    for (const invalidInput of [
      {
        actorId,
        permissionScopeVersion: "v1",
        correlationId,
      },
      {
        actorId: privateValue,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId,
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId,
        untrustedGrant: "admin",
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "",
        correlationId,
      },
      {
        actorId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "v1",
        correlationId: "not-a-correlation-id",
      },
    ]) {
      let caught: unknown;
      try {
        await resolveAuthorizationContext(invalidInput, verifier);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AuthorizationContextError);
      expect(String(caught)).not.toContain(privateValue);
    }
  });

  it("requires scoped call context on every declared repository operation", () => {
    type Session = { readonly database: true };
    interface Operations {
      list(call: TenantRepositoryCall<Session>): Promise<readonly string[]>;
      update(
        call: TenantRepositoryCall<Session>,
        id: string,
        value: string,
      ): Promise<void>;
    }
    type Repository = TenantScopedRepository<Session, Operations>;

    expectTypeOf<Parameters<Repository["list"]>[0]>().toEqualTypeOf<
      TenantRepositoryCall<Session>
    >();
    interface InvalidOperations {
      list(): Promise<readonly string[]>;
      metadata: string;
    }
    type InvalidRepository = TenantScopedRepository<Session, InvalidOperations>;
    expectTypeOf<InvalidRepository["list"]>().toEqualTypeOf<never>();
    expectTypeOf<InvalidRepository["metadata"]>().toEqualTypeOf<never>();
  });
});
