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
        messages={weddingMessages("fr")}
        token="safe-token"
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
        messages={weddingMessages("en")}
        token="safe-token"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This invitation cannot be accepted with this account.",
    );
  });
});
