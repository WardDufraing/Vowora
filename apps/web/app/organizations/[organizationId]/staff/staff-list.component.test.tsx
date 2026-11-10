import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { organizationMessages } from "../../../../lib/organization-messages";
import { StaffList } from "./staff-list";

const organizationId = "019a2f36-0eb9-7000-8000-000000000001";
const owner = {
  id: "019a2f36-0eb9-7000-8000-000000000002",
  actorId: "019a2f36-0eb9-7000-8000-000000000003",
  name: "Owner Person",
  email: "owner@example.test",
  role: "owner" as const,
  status: "active" as const,
};
const employee = {
  id: "019a2f36-0eb9-7000-8000-000000000004",
  actorId: "019a2f36-0eb9-7000-8000-000000000005",
  name: "Employee Person",
  email: "employee@example.test",
  role: "employee" as const,
  status: "active" as const,
};

afterEach(() => vi.unstubAllGlobals());

describe("organization staff list", () => {
  it("identifies staff, protects the owner, and localizes deactivation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <StaffList
        initial={[owner, employee]}
        messages={organizationMessages("nl")}
        organizationId={organizationId}
      />,
    );

    expect(screen.getByText("Owner Person")).toBeVisible();
    expect(screen.getByText(/owner@example\.test/)).toBeVisible();
    expect(screen.getByText("Employee Person")).toBeVisible();
    expect(screen.getByText(/employee@example\.test/)).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Deactiveren" })).toHaveLength(
      1,
    );

    await user.click(screen.getByRole("button", { name: "Deactiveren" }));
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/organizations/${organizationId}/staff/${employee.id}`,
      { method: "DELETE" },
    );
    expect(await screen.findByText(/Gedeactiveerd/)).toBeVisible();
  });

  it("announces a failed deactivation and preserves the active member", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );
    const user = userEvent.setup();
    render(
      <StaffList
        initial={[employee]}
        messages={organizationMessages("de")}
        organizationId={organizationId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Deaktivieren" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Die Anfrage konnte nicht abgeschlossen werden.",
    );
    await waitFor(() => expect(screen.getByText(/Aktiv/)).toBeVisible());
  });
});
