import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { organizationMessages } from "../../../../lib/organization-messages";
import { StaffInvitationForm } from "./staff-invitation-form";

afterEach(() => vi.unstubAllGlobals());

describe("organization staff invitation form", () => {
  it("issues a localized 14-day invitation and can revoke it", async () => {
    const invitation = {
      id: "019a2f36-0eb9-7000-8000-000000000001",
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      invitedEmail: "staff@example.test",
      role: "employee",
      status: "pending",
      expiresAt: "2026-11-24T12:00:00.000Z",
      reminderAt: "2026-11-21T12:00:00.000Z",
      createdAt: "2026-11-10T12:00:00.000Z",
      acceptancePath: "/organization-invitations/secret",
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: invitation }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <StaffInvitationForm
        endpoint="/api/invitations"
        initial={[]}
        locale="nl"
        messages={organizationMessages("nl")}
      />,
    );
    await user.type(
      screen.getByLabelText("E-mailadres van de medewerker"),
      "staff@example.test",
    );
    await user.click(screen.getByRole("button", { name: "Uitnodiging maken" }));
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      email: "staff@example.test",
      role: "employee",
      locale: "nl",
    });
    expect(await screen.findByText(/staff@example\.test/)).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      invitation.acceptancePath,
    );
    await user.click(screen.getByRole("button", { name: "Intrekken" }));
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/invitations/${invitation.id}`,
      { method: "DELETE" },
    );
    expect(screen.queryByText(/staff@example\.test/)).not.toBeInTheDocument();
  });

  it("reissues a recovered invitation without recovering its former bearer token", async () => {
    const initial = {
      id: "019a2f36-0eb9-7000-8000-000000000001",
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      invitedEmail: "manager@example.test",
      role: "manager" as const,
      status: "pending" as const,
      expiresAt: "2026-11-24T12:00:00.000Z",
      reminderAt: "2026-11-21T12:00:00.000Z",
      createdAt: "2026-11-10T12:00:00.000Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: {
            ...initial,
            id: "019a2f36-0eb9-7000-8000-000000000003",
            acceptancePath: "/organization-invitations/new-secret",
          },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <StaffInvitationForm
        endpoint="/api/invitations"
        initial={[initial]}
        locale="en"
        messages={organizationMessages("en")}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reissue" }));
    expect(await screen.findByRole("link")).toHaveAttribute(
      "href",
      "/organization-invitations/new-secret",
    );
  });
});
