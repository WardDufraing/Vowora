import { describe, expect, it } from "vitest";

import {
  authorizeOrganizationCreation,
  authorizeOrganizationInvitationClaim,
  consumeAuthorizedOrganizationCreation,
  consumeAuthorizedOrganizationInvitationClaim,
} from "./organizations.js";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const correlationId = "019a2f36-0eb9-7000-8000-000000000003";
const creationRequestId = "019a2f36-0eb9-7000-8000-000000000004";

describe("organization bootstrap authorization", () => {
  it("validates and consumes creation once", async () => {
    const command = authorizeOrganizationCreation({
      actorId,
      correlationId,
      creationRequestId,
      name: "  North Star Weddings  ",
    });
    const consumed = await consumeAuthorizedOrganizationCreation(
      command,
      organizationId,
    );
    expect(consumed.command.name).toBe("North Star Weddings");
    expect(consumed.authorization.activeOrganizationId).toBe(organizationId);
    await expect(
      consumeAuthorizedOrganizationCreation(command, organizationId),
    ).rejects.toThrow();
  });

  it("validates and consumes a claim once", async () => {
    const command = authorizeOrganizationInvitationClaim({
      actorId,
      correlationId,
      token: "x".repeat(43),
    });
    await expect(
      consumeAuthorizedOrganizationInvitationClaim(command, organizationId),
    ).resolves.toMatchObject({
      authorization: { actorId, activeOrganizationId: organizationId },
    });
    await expect(
      consumeAuthorizedOrganizationInvitationClaim(command, organizationId),
    ).rejects.toThrow();
  });

  it("supports a verified-email invitation identifier without accepting ambiguous claims", () => {
    expect(() =>
      authorizeOrganizationInvitationClaim({
        actorId,
        correlationId,
        invitationId: organizationId,
      }),
    ).not.toThrow();
    expect(() =>
      authorizeOrganizationInvitationClaim({
        actorId,
        correlationId,
        invitationId: organizationId,
        token: "x".repeat(43),
      }),
    ).toThrow();
  });

  it("rejects malformed organization operations", () => {
    expect(() =>
      authorizeOrganizationCreation({ actorId, name: "Org" }),
    ).toThrow();
    expect(() =>
      authorizeOrganizationInvitationClaim({
        actorId,
        correlationId,
        token: "short",
      }),
    ).toThrow();
  });
});
