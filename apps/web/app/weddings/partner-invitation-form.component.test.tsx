import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { weddingMessages } from "../../lib/wedding-messages";
import { PartnerInvitationForm } from "./partner-invitation-form";

afterEach(() => vi.unstubAllGlobals());

describe("partner invitation form", () => {
  it("submits only the invited email and renders a localized secure-link state", async () => {
    const invitationId = "019a1f5e-70a0-7000-8000-000000000003";
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: [] }))
      .mockResolvedValueOnce(
        Response.json({
          data: {
            acceptancePath: "/invitations/secret-token",
            id: invitationId,
            invitedEmail: "partner@example.test",
            expiresAt: "2026-11-21T12:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PartnerInvitationForm
        endpoint="/api/v1/weddings/wedding-id/invitations"
        locale="nl"
        messages={weddingMessages("nl")}
      />,
    );
    await user.type(
      screen.getByLabelText("E-mailadres van je partner"),
      "partner@example.test",
    );
    await user.click(
      screen.getByRole("button", { name: "Uitnodiging aanmaken" }),
    );
    await screen.findByRole("status");
    expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body))).toEqual({
      email: "partner@example.test",
      locale: "nl",
    });
    expect(
      screen.getByRole("button", { name: "Uitnodigingslink kopiëren" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Uitnodiging intrekken" }),
    );
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/v1/weddings/wedding-id/invitations/${invitationId}`,
      { method: "DELETE" },
    );
    expect(await screen.findByText("Uitnodiging ingetrokken.")).toBeVisible();
  });

  it("recovers a pending invitation after reload without recovering its bearer link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: [
            {
              id: "019a1f5e-70a0-7000-8000-000000000003",
              invitedEmail: "partner@example.test",
              expiresAt: "2026-11-21T12:00:00.000Z",
            },
          ],
        }),
      ),
    );
    render(
      <PartnerInvitationForm
        endpoint="/api"
        locale="en"
        messages={weddingMessages("en")}
      />,
    );
    expect(await screen.findByText("partner@example.test")).toBeVisible();
    expect(screen.getByText(/November 21, 2026/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Copy invitation link" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke invitation" }),
    ).toBeVisible();
  });

  it("announces an error and keeps the form available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 409 })),
    );
    const user = userEvent.setup();
    render(
      <PartnerInvitationForm
        endpoint="/api"
        locale="de"
        messages={weddingMessages("de")}
      />,
    );
    await user.type(
      screen.getByLabelText("E-Mail-Adresse des Partners"),
      "partner@example.test",
    );
    await user.click(
      screen.getByRole("button", { name: "Einladung erstellen" }),
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(screen.getByLabelText("E-Mail-Adresse des Partners")).toBeVisible();
  });
});
