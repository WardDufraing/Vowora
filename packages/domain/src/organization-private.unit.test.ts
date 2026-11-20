import { describe, expect, it } from "vitest";

import {
  authorizeOrganizationHandover,
  authorizeOrganizationPrivateNote,
  consumeAuthorizedOrganizationHandover,
  consumeAuthorizedOrganizationPrivateNote,
} from "./organization-private.js";

const actorId = "019a2f36-0eb9-7000-8000-000000000001";
const organizationId = "019a2f36-0eb9-7000-8000-000000000002";
const correlationId = "019a2f36-0eb9-7000-8000-000000000003";
const noteId = "019a2f36-0eb9-7000-8000-000000000004";
const accessId = "019a2f36-0eb9-7000-8000-000000000005";
const requestId = "019a2f36-0eb9-7000-8000-000000000006";
const weddingId = "019a2f36-0eb9-7000-8000-000000000007";

describe("organization-private authorization", () => {
  it("binds a note mutation to its target and consumes it once", async () => {
    const command = authorizeOrganizationPrivateNote({
      actorId,
      correlationId,
      organizationId,
      action: "update",
      noteId,
    });

    await expect(
      consumeAuthorizedOrganizationPrivateNote(command, 4),
    ).resolves.toMatchObject({
      command: { action: "update", noteId },
      authorization: {
        actorId,
        activeOrganizationId: organizationId,
        permissionScopeVersion: "private-note:4",
      },
    });
    await expect(
      consumeAuthorizedOrganizationPrivateNote(command, 4),
    ).rejects.toThrow("authorization is unavailable");
  });

  it("rejects missing, extraneous, and malformed note targets", () => {
    expect(() =>
      authorizeOrganizationPrivateNote({
        actorId,
        correlationId,
        organizationId,
        action: "archive",
      }),
    ).toThrow();
    expect(() =>
      authorizeOrganizationPrivateNote({
        actorId,
        correlationId,
        organizationId,
        action: "list",
        noteId,
      }),
    ).toThrow();
  });

  it("binds handover mode, access, and request identity and consumes it once", async () => {
    const command = authorizeOrganizationHandover({
      actorId,
      correlationId,
      organizationId,
      accessId,
      mode: "guided",
      requestId,
    });

    await expect(
      consumeAuthorizedOrganizationHandover(command, 7, weddingId),
    ).resolves.toMatchObject({
      command: { accessId, mode: "guided", requestId },
      authorization: {
        actorId,
        activeOrganizationId: organizationId,
        activeWeddingId: weddingId,
        permissionScopeVersion: "handover:7",
      },
    });
    await expect(
      consumeAuthorizedOrganizationHandover(command, 7, weddingId),
    ).rejects.toThrow("authorization is unavailable");
  });
});
