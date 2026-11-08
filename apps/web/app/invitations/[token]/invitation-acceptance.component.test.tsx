import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { weddingMessages } from "../../../lib/wedding-messages";
import { InvitationAcceptance } from "./invitation-acceptance";

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockReset();
});

describe("invitation acceptance", () => {
  it("requires an explicit click and navigates only after acceptance", async () => {
    const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { weddingId } }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <InvitationAcceptance
        endpoint="/api/v1/invitations/safe-token/accept"
        expiresAt="2026-11-21T12:00:00.000Z"
        locale="fr"
        messages={weddingMessages("fr")}
      />,
    );
    expect(fetch).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Accepter l’invitation" }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/invitations/safe-token/accept",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ accept: true }),
      }),
    );
    expect(replace).toHaveBeenCalledWith(`/weddings/${weddingId}/settings`);
  });

  it("announces privacy-safe failure without exposing wedding data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );
    const user = userEvent.setup();
    render(
      <InvitationAcceptance
        endpoint="/api/v1/invitations/safe-token/accept"
        locale="en"
        messages={weddingMessages("en")}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This invitation cannot be accepted with this account.",
    );
  });

  it("renders a specific localized replacement instruction for an expired invitation", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ code: "INVITATION_EXPIRED" }, { status: 410 }),
        ),
    );
    const user = userEvent.setup();
    render(
      <InvitationAcceptance
        endpoint="/api/v1/invitations/pending/id/accept"
        locale="de"
        messages={weddingMessages("de")}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Einladung annehmen" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Diese Einladung ist abgelaufen.",
    );
  });

  it("shows a known expired invitation before acceptance and makes no request", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <InvitationAcceptance
        endpoint="/api/v1/invitations/pending/id/accept"
        expiresAt="2026-11-01T12:00:00.000Z"
        initiallyExpired
        locale="nl"
        messages={weddingMessages("nl")}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Deze uitnodiging is verlopen.",
    );
    expect(
      screen.queryByRole("button", { name: "Uitnodiging accepteren" }),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
