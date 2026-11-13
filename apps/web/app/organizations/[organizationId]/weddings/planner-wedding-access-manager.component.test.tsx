import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlannerWeddingAccessManager } from "./planner-wedding-access-manager";

afterEach(() => vi.unstubAllGlobals());
describe("planner wedding access management", () => {
  it("offers localized ceiling-limited assignment and removal", async () => {
    const access = {
      id: "019a2f36-0eb9-7000-8000-000000000001",
      weddingId: "019a2f36-0eb9-7000-8000-000000000006",
      weddingName: "Feier",
      permissionCeiling: [{ area: "tasks", actions: ["view", "edit"] }],
      assignments: [
        {
          id: "019a2f36-0eb9-7000-8000-000000000004",
          organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000003",
          isLead: true,
          absenceStartsAt: null,
          absenceEndsAt: null,
        },
      ],
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            id: "019a2f36-0eb9-7000-8000-000000000004",
            accessId: "019a2f36-0eb9-7000-8000-000000000001",
            organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000003",
            status: "active",
            isLead: true,
            permissions: [],
          },
        }),
      )
      .mockResolvedValueOnce(Response.json({ data: access }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json({ data: { ...access, assignments: [] } }),
      );
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerWeddingAccessManager
        organizationId="019a2f36-0eb9-7000-8000-000000000002"
        locale="de"
        staff={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000003",
            name: "Alex",
            email: "alex@example.test",
            status: "active",
          },
        ]}
        initialAccesses={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000001",
            weddingId: "019a2f36-0eb9-7000-8000-000000000006",
            weddingName: "Feier",
            permissionCeiling: [{ area: "tasks", actions: ["view", "edit"] }],
            assignments: [],
          },
        ]}
        currentMembershipId="019a2f36-0eb9-7000-8000-000000000003"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Hochzeitsteam" }),
    ).toBeVisible();
    await user.click(screen.getByLabelText("Aufgaben: Bearbeiten"));
    await user.click(screen.getByLabelText("Leitende Planung"));
    await user.click(
      screen.getByRole("button", { name: "Zuweisung speichern" }),
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000003",
      permissions: [{ area: "tasks", actions: ["view", "edit"] }],
      isLead: true,
    });
    await user.click(await screen.findByRole("button", { name: "Entfernen" }));
    expect(fetch.mock.calls[2]?.[1]).toMatchObject({ method: "DELETE" });
  });
  it("lets the current lead set an absence and reloads authoritative state", async () => {
    const access = {
      id: "019a2f36-0eb9-7000-8000-000000000001",
      weddingId: "019a2f36-0eb9-7000-8000-000000000006",
      weddingName: "Wedding",
      permissionCeiling: [{ area: "tasks", actions: ["view", "edit"] }],
      assignments: [
        {
          id: "019a2f36-0eb9-7000-8000-000000000004",
          organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000003",
          isLead: true,
          absenceStartsAt: null,
          absenceEndsAt: null,
        },
      ],
    };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: { updated: true } }))
      .mockResolvedValueOnce(Response.json({ data: access }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <PlannerWeddingAccessManager
        organizationId="019a2f36-0eb9-7000-8000-000000000002"
        locale="en"
        currentMembershipId="019a2f36-0eb9-7000-8000-000000000003"
        staff={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000003",
            name: "Alex",
            email: "alex@example.test",
            status: "active",
          },
        ]}
        initialAccesses={[access]}
      />,
    );
    await user.type(screen.getByLabelText("Starts"), "2026-12-01T09:00");
    await user.type(screen.getByLabelText("Ends"), "2026-12-02T09:00");
    await user.click(screen.getByRole("button", { name: "Save absence" }));
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/absence"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/wedding-access/"),
    );
  });
});
