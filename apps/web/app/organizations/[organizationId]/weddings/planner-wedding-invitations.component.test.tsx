import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerWeddingInvitations } from "./planner-wedding-invitations";
afterEach(() => vi.unstubAllGlobals());
describe("planner wedding invitations", () => {
  it("allows a manager to accept a localized pending wedding invitation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { accepted: true } }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    const id = "019a2f36-0eb9-7000-8000-000000000003";
    render(
      <PlannerWeddingInvitations
        organizationId="019a2f36-0eb9-7000-8000-000000000002"
        locale="de"
        initial={[
          {
            invitation: { id, expiresAt: "2026-11-26T00:00:00.000Z" },
            weddingName: "Hochzeit",
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Annehmen" }));
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/organizations/019a2f36-0eb9-7000-8000-000000000002/wedding-invitations/${id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ decision: "accept" }),
      }),
    );
    expect(await screen.findByText("Keine offenen Einladungen")).toBeVisible();
  });
});
