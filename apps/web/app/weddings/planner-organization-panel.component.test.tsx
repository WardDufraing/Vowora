import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerOrganizationPanel } from "./planner-organization-panel";
afterEach(() => vi.unstubAllGlobals());
describe("planner organization invitation", () => {
  it("submits a deny-by-default explicit localized ceiling with a stable key", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerOrganizationPanel
        weddingId="019a2f36-0eb9-7000-8000-000000000001"
        locale="nl"
        initialAccess={null}
        initialInvitations={[]}
      />,
    );
    await user.type(
      screen.getByLabelText("Organisatie-ID"),
      "019a2f36-0eb9-7000-8000-000000000002",
    );
    await user.click(screen.getByLabelText("Taken: Bewerken"));
    await user.click(
      screen.getByRole("button", { name: "Organisatie uitnodigen" }),
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      permissionCeiling: [{ area: "tasks", actions: ["edit", "view"] }],
    });
    expect(
      (fetch.mock.calls[0]?.[1]?.headers as Record<string, string>)[
        "idempotency-key"
      ],
    ).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByText("Uitnodiging verzonden")).toBeVisible();
  });
  it("keeps one key for ambiguous retries and changes it with the payload", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerOrganizationPanel
        weddingId="019a2f36-0eb9-7000-8000-000000000001"
        locale="en"
        initialAccess={null}
        initialInvitations={[]}
      />,
    );
    const organization = screen.getByLabelText("Organization ID");
    await user.type(organization, "019a2f36-0eb9-7000-8000-000000000002");
    await user.click(screen.getByLabelText("Tasks: Edit"));
    const submit = screen.getByRole("button", { name: "Invite organization" });
    await user.click(submit);
    await user.click(submit);
    const first = (fetch.mock.calls[0]?.[1]?.headers as Record<string, string>)[
      "idempotency-key"
    ];
    const second = (
      fetch.mock.calls[1]?.[1]?.headers as Record<string, string>
    )["idempotency-key"];
    expect(second).toBe(first);
    await user.clear(organization);
    await user.type(organization, "019a2f36-0eb9-7000-8000-000000000003");
    await user.click(submit);
    const third = (fetch.mock.calls[2]?.[1]?.headers as Record<string, string>)[
      "idempotency-key"
    ];
    expect(third).not.toBe(first);
  });
  it("lets a partner block and revoke active planner access", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: { blocked: true } }))
      .mockResolvedValueOnce(
        Response.json({
          data: {
            id: "019a2f36-0eb9-7000-8000-000000000002",
            organizationId: "019a2f36-0eb9-7000-8000-000000000003",
            organizationName: "Planung GmbH",
            assignments: [
              {
                id: "019a2f36-0eb9-7000-8000-000000000004",
                organizationMembershipId:
                  "019a2f36-0eb9-7000-8000-000000000005",
                name: "Ada Planerin",
                role: "manager",
                isLead: true,
                active: false,
                blocked: true,
              },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerOrganizationPanel
        weddingId="019a2f36-0eb9-7000-8000-000000000001"
        locale="de"
        initialInvitations={[]}
        initialAccess={{
          id: "019a2f36-0eb9-7000-8000-000000000002",
          organizationId: "019a2f36-0eb9-7000-8000-000000000003",
          organizationName: "Planung GmbH",
          assignments: [
            {
              id: "019a2f36-0eb9-7000-8000-000000000004",
              organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000005",
              name: "Ada Planerin",
              role: "manager",
              isLead: true,
              active: true,
              blocked: false,
            },
          ],
        }}
      />,
    );
    expect(screen.queryByLabelText("Organisations-ID")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zugriff sperren" }));
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/restrictions"),
      expect.objectContaining({ method: "PATCH" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Organisationszugriff widerrufen" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/planner-organizations/access/"),
      { method: "DELETE" },
    );
    expect(await screen.findByLabelText("Organisations-ID")).toBeVisible();
  });
  it("lists pending invitations and makes replacement explicit", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(
      Response.json({
        data: {
          id: "019a2f36-0eb9-7000-8000-000000000010",
          organizationId: "019a2f36-0eb9-7000-8000-000000000002",
          organizationName: "Planner Co",
          status: "pending",
          permissionCeiling: [{ area: "tasks", actions: ["view"] }],
          expiresAt: "2026-12-01T00:00:00.000Z",
          createdAt: "2026-11-17T00:00:00.000Z",
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerOrganizationPanel
        weddingId="019a2f36-0eb9-7000-8000-000000000001"
        locale="en"
        initialAccess={null}
        initialInvitations={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000009",
            organizationId: "019a2f36-0eb9-7000-8000-000000000002",
            organizationName: "Planner Co",
            status: "pending",
            permissionCeiling: [{ area: "tasks", actions: ["view"] }],
            expiresAt: "2026-12-01T00:00:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByText("Planner Co")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Prepare replacement" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Reissue invitation" }),
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toMatchObject({
      organizationId: "019a2f36-0eb9-7000-8000-000000000002",
      reissueInvitationId: "019a2f36-0eb9-7000-8000-000000000009",
      permissionCeiling: [{ area: "tasks", actions: ["view"] }],
    });
  });
});
