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
    expect(
      (fetch.mock.calls[0]?.[1]?.headers as Record<string, string>)[
        "idempotency-key"
      ],
    ).toMatch(/^[0-9a-f-]{36}$/);
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
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          ...initial,
          id: "019a2f36-0eb9-7000-8000-000000000003",
          acceptancePath: "/organization-invitations/new-secret",
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);
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
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      email: "manager@example.test",
      locale: "en",
      reissueInvitationId: initial.id,
      role: "manager",
    });
    expect(await screen.findByRole("link")).toHaveAttribute(
      "href",
      "/organization-invitations/new-secret",
    );
  });

  it("reuses its request key after an ambiguous issue failure", async () => {
    const currentInvitation = {
      id: "019a2f36-0eb9-7000-8000-000000000005",
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      invitedEmail: "retry@example.test",
      role: "manager" as const,
      status: "pending" as const,
      expiresAt: "2026-11-24T12:00:00.000Z",
      reminderAt: "2026-11-21T12:00:00.000Z",
      createdAt: "2026-11-10T12:00:00.000Z",
    };
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ data: [currentInvitation] }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <StaffInvitationForm
        endpoint="/api/invitations"
        initial={[]}
        locale="en"
        messages={organizationMessages("en")}
      />,
    );
    await user.type(
      screen.getByLabelText("Staff email address"),
      "retry@example.test",
    );
    await user.click(screen.getByRole("button", { name: "Create invitation" }));
    await user.click(screen.getByRole("button", { name: "Create invitation" }));
    const firstHeaders = fetch.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    const secondHeaders = fetch.mock.calls[1]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(firstHeaders["idempotency-key"]).toBe(
      secondHeaders["idempotency-key"],
    );
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/invitations");
    expect(await screen.findByText(/retry@example\.test/)).toHaveTextContent(
      "Manager",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses a new request key after a definitive stale retry conflict", async () => {
    const invitation = {
      id: "019a2f36-0eb9-7000-8000-000000000006",
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      invitedEmail: "retry@example.test",
      role: "employee" as const,
      status: "pending" as const,
      expiresAt: "2026-11-24T12:00:00.000Z",
      reminderAt: "2026-11-21T12:00:00.000Z",
      createdAt: "2026-11-10T12:00:00.000Z",
      acceptancePath: "/organization-invitations/new-secret",
    };
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ data: [] }))
      .mockResolvedValueOnce(Response.json({ data: invitation }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <StaffInvitationForm
        endpoint="/api/invitations"
        initial={[]}
        locale="en"
        messages={organizationMessages("en")}
      />,
    );
    await user.type(
      screen.getByLabelText("Staff email address"),
      "retry@example.test",
    );
    const submit = screen.getByRole("button", { name: "Create invitation" });
    await user.click(submit);
    await user.click(submit);
    await user.click(submit);

    const firstHeaders = fetch.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    const staleRetryHeaders = fetch.mock.calls[1]?.[1]?.headers as Record<
      string,
      string
    >;
    const newAttemptHeaders = fetch.mock.calls[3]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(staleRetryHeaders["idempotency-key"]).toBe(
      firstHeaders["idempotency-key"],
    );
    expect(newAttemptHeaders["idempotency-key"]).not.toBe(
      firstHeaders["idempotency-key"],
    );
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/invitations");
    expect(await screen.findByRole("link")).toHaveAttribute(
      "href",
      invitation.acceptancePath,
    );
  });
});
