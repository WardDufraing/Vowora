import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlannerWeddingAccessManager } from "./planner-wedding-access-manager";

afterEach(() => vi.unstubAllGlobals());
describe("planner wedding access management", () => {
  it("offers localized ceiling-limited assignment and removal", async () => {
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
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
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
            status: "active",
          },
        ]}
        initialAccesses={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000001",
            weddingName: "Feier",
            permissionCeiling: [{ area: "tasks", actions: ["view", "edit"] }],
            assignments: [],
          },
        ]}
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
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ method: "DELETE" });
  });
});
