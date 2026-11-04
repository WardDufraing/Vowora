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

  it("signs out through the same-origin endpoint and leaves the account page", async () => {
    const request = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/sign-out")) {
        return Response.json({ success: true });
      }
      return Response.json({ data: [] });
    });
    vi.stubGlobal("fetch", request);
    const replace = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      replace,
    } as unknown as Location);
    const user = userEvent.setup();
    render(<SessionManager />);
    await user.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(request).toHaveBeenCalledWith("/api/v1/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    });
    expect(replace).toHaveBeenCalledWith("/sign-in");
  });

  it("keeps a failed sign-out message when the session list resolves later", async () => {
    let releaseList: (response: Response) => void = () => {};
    const pendingList = new Promise<Response>((resolve) => {
      releaseList = resolve;
    });
    const request = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/sign-out")) {
        return new Response(null, { status: 403 });
      }
      return pendingList;
    });
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<SessionManager />);
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/api/v1/account/sessions",
        expect.anything(),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "You could not be signed out. Try again.",
    );
    releaseList(Response.json({ data: [] }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "You could not be signed out. Try again.",
      ),
    );
  });

  it("keeps the current session when sign-out is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) =>
        String(input).endsWith("/sign-out")
          ? new Response(null, { status: 403 })
          : Response.json({ data: [] }),
      ),
    );
    const user = userEvent.setup();
    render(<SessionManager />);
    await user.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "You could not be signed out. Try again.",
    );
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
