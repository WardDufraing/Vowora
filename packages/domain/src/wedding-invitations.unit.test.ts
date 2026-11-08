import { describe, expect, it } from "vitest";

import {
  authorizeWeddingInvitationClaim,
  consumeAuthorizedWeddingInvitationClaim,
  WeddingInvitationClaimAuthorizationError,
} from "./wedding-invitations.js";

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const invitationId = "019a1f5e-70a0-7000-8000-000000000003";
const correlationId = "fd901f2e-3f91-4e12-a32e-cf48c853fd44";

describe("wedding invitation claim capability", () => {
  it("binds one use to the actor, invitation, wedding and correlation", async () => {
    const claim = authorizeWeddingInvitationClaim({
      actorId,
      correlationId,
      invitationId,
      weddingId,
    });
    const authorization = await consumeAuthorizedWeddingInvitationClaim(claim);
    expect(authorization).toMatchObject({
      actorId,
      activeWeddingId: weddingId,
      correlationId,
      permissionScopeVersion: `invitation:${invitationId}`,
    });
    await expect(
      consumeAuthorizedWeddingInvitationClaim(claim),
    ).rejects.toThrow(WeddingInvitationClaimAuthorizationError);
  });

  it("rejects malformed or structurally forged claims", async () => {
    expect(() =>
      authorizeWeddingInvitationClaim({
        actorId: "attacker",
        correlationId,
        invitationId,
        weddingId,
      }),
    ).toThrow(WeddingInvitationClaimAuthorizationError);
    await expect(
      consumeAuthorizedWeddingInvitationClaim({
        actorId,
        correlationId,
        invitationId,
        weddingId,
      }),
    ).rejects.toThrow(WeddingInvitationClaimAuthorizationError);
  });
});
