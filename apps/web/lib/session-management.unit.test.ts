import { problemDetailsSchema } from "@vowora/contracts";
import { APIError } from "better-auth";
import { describe, expect, it, vi } from "vitest";

import {
  listAccountSessions,
  revokeAccountSession,
} from "./session-management";

const request = new Request("https://app.vowora.test/api/v1/account/sessions", {
  headers: {
    Cookie: "__Secure-vowora.session_token=synthetic",
    "x-correlation-id": "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2",
  },
});

const current = {
  session: {
    id: "019a0000-0000-7000-8000-000000000001",
    createdAt: new Date(),
  },
  user: { id: "019a0000-0000-7000-8000-000000000002" },
};

describe("session management error contract", () => {
  it.each([
    [401, "AUTHENTICATION_REQUIRED"],
    [403, "RECENT_AUTHENTICATION_REQUIRED"],
  ])("normalizes a Better Auth %i race", async (status, code) => {
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(current),
        listSessions: vi
          .fn()
          .mockRejectedValue(
            APIError.fromStatus(status === 401 ? "UNAUTHORIZED" : "FORBIDDEN"),
          ),
      },
    };
    const response = await listAccountSessions(auth as never, request);
    expect(response.status).toBe(status);
    const body = problemDetailsSchema.parse(await response.json());
    expect(body.code).toBe(code);
    expect(response.headers.get("x-correlation-id")).toBe(body.correlationId);
  });

  it("returns not-found for the current session and does not revoke it", async () => {
    const revokeSession = vi.fn();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(current),
        listSessions: vi.fn().mockResolvedValue([
          {
            id: current.session.id,
            token: "synthetic-bearer-token",
            userAgent: "Desktop synthetic browser",
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
          },
        ]),
        revokeSession,
      },
    };
    const response = await revokeAccountSession(
      auth as never,
      new Request(request, { method: "DELETE" }),
      current.session.id,
    );
    expect(response.status).toBe(404);
    const body = problemDetailsSchema.parse(await response.json());
    expect(body.code).toBe("SESSION_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("synthetic-bearer-token");
    expect(revokeSession).not.toHaveBeenCalled();
  });

  it("contains unexpected framework failures", async () => {
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(current),
        listSessions: vi.fn().mockRejectedValue(new Error("private detail")),
      },
    };
    const response = await listAccountSessions(auth as never, request);
    expect(response.status).toBe(500);
    const body = problemDetailsSchema.parse(await response.json());
    expect(body.code).toBe("SESSION_SERVICE_FAILURE");
    expect(JSON.stringify(body)).not.toContain("private detail");
  });
});
