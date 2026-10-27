import { describe, expect, it, vi } from "vitest";

import { createAuthCredentialLock } from "./auth-credential-lock.js";

function harness(found: boolean) {
  const events: string[] = [];
  const client = {
    query: vi.fn(async (text: string, values?: readonly unknown[]) => {
      events.push(`${text}:${values?.[0] ?? ""}`);
      return {
        rows: text.startsWith("SELECT") && found ? [{ id: "user-id" }] : [],
      };
    }),
    release: vi.fn(() => events.push("release")),
  };
  return {
    events,
    client,
    lock: createAuthCredentialLock({
      connect: vi.fn(async () => client),
    }),
  };
}

describe("auth credential lock", () => {
  it("holds one user's row lock through the credential operation", async () => {
    const { events, lock } = harness(true);
    await expect(
      lock({ email: "Partner@Example.Test" }, async () => {
        events.push("operation");
        return "done";
      }),
    ).resolves.toBe("done");
    expect(events).toEqual([
      "BEGIN:",
      "SELECT id::text AS id FROM auth_user WHERE email = $1 FOR NO KEY UPDATE:partner@example.test",
      "operation",
      "COMMIT:",
      "release",
    ]);
  });

  it("does not hold a connection for an unknown identity", async () => {
    const { events, lock } = harness(false);
    await lock({ resetToken: "synthetic-token" }, async () => {
      events.push("operation");
    });
    expect(events).toEqual([
      "BEGIN:",
      "SELECT u.id::text AS id FROM auth_verification v JOIN auth_user u ON u.id::text = v.value WHERE v.identifier = $1 FOR NO KEY UPDATE OF u:reset-password:synthetic-token",
      "ROLLBACK:",
      "release",
      "operation",
    ]);
  });

  it("rolls back and releases when the protected operation fails", async () => {
    const { events, lock } = harness(true);
    await expect(
      lock({ email: "partner@example.test" }, async () => {
        events.push("operation");
        throw new Error("synthetic failure");
      }),
    ).rejects.toThrow("synthetic failure");
    expect(events.slice(-3)).toEqual(["operation", "ROLLBACK:", "release"]);
  });
});
