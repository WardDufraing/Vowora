import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionManager } from "./session-manager";

afterEach(() => vi.unstubAllGlobals());

describe("session manager", () => {
  it("labels the current session and revokes another without exposing tokens", async () => {
    const sessions = [
      {
        id: "019a0000-0000-7000-8000-000000000001",
        current: true,
        device: "Desktop browser",
        createdAt: "2026-10-27T08:00:00.000Z",
        lastActiveAt: "2026-10-27T08:00:00.000Z",
        expiresAt: "2026-11-27T08:00:00.000Z",
      },
      {
        id: "019a0000-0000-7000-8000-000000000002",
        current: false,
        device: "Mobile browser",
        createdAt: "2026-10-27T08:00:00.000Z",
        lastActiveAt: "2026-10-27T08:00:00.000Z",
        expiresAt: "2026-11-27T08:00:00.000Z",
      },
    ];
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: sessions }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ data: [sessions[0]] }));
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<SessionManager />);
    expect(await screen.findByText(/current session/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Revoke session" }));
    expect(request.mock.calls[1]?.[0]).toContain(sessions[1]!.id);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Session access revoked.",
    );
    expect(screen.queryByText(/session_token/)).not.toBeInTheDocument();
  });

  it("asks for sign-in again when the session is no longer fresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 403 })),
    );
    render(<SessionManager />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Sign in again before managing sessions.",
      ),
    );
  });

  it.each([
    ["a rejected request", new TypeError("network failed")],
    ["a malformed response", undefined],
  ])("recovers from %s while loading", async (_label, failure) => {
    const request = vi.fn<typeof fetch>();
    if (failure) request.mockRejectedValue(failure);
    else request.mockResolvedValue(Response.json({ data: "private" }));
    vi.stubGlobal("fetch", request);
    render(<SessionManager />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Sessions could not be loaded.",
      ),
    );
  });

  it("preserves a failed reload message after successful revocation", async () => {
    const sessions = [
      {
        id: "019a0000-0000-7000-8000-000000000001",
        current: true,
        device: "Desktop browser",
        createdAt: "2026-10-27T08:00:00.000Z",
        lastActiveAt: "2026-10-27T08:00:00.000Z",
        expiresAt: "2026-11-27T08:00:00.000Z",
      },
      {
        id: "019a0000-0000-7000-8000-000000000002",
        current: false,
        device: "Mobile browser",
        createdAt: "2026-10-27T08:00:00.000Z",
        lastActiveAt: "2026-10-27T08:00:00.000Z",
        expiresAt: "2026-11-27T08:00:00.000Z",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ data: sessions }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response(null, { status: 403 })),
    );
    const user = userEvent.setup();
    render(<SessionManager />);
    await user.click(
      await screen.findByRole("button", { name: "Revoke session" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sign in again before managing sessions.",
    );
    expect(
      screen.getByRole("button", { name: "Revoke session" }),
    ).toBeEnabled();
  });
});
