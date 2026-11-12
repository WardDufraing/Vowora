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
      />,
    );
    await user.type(
      screen.getByLabelText("Organisatie-ID"),
      "019a2f36-0eb9-7000-8000-000000000002",
    );
    await user.click(screen.getByLabelText("tasks: Bewerken"));
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
});
