import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { workspaceMessages } from "../lib/workspace-messages";
import { WorkspaceChooser } from "./workspace-chooser";

const workspaces = [
  {
    weddingId: "019a1f5e-70a0-7000-8000-000000000002",
    name: "Jordan & Alex",
    dateLabel: "2027-06-12",
    roleLabel: "Partner",
    href: "/weddings/019a1f5e-70a0-7000-8000-000000000002/dashboard",
  },
  {
    weddingId: "019a1f5e-70a0-7000-8000-000000000003",
    name: "Morgan & Riley",
    dateLabel: "Date not set",
    roleLabel: "Planner",
    href: "/weddings/019a1f5e-70a0-7000-8000-000000000003/dashboard",
  },
] as const;

describe("accessible wedding chooser", () => {
  it("keeps recency order, searches names and clears the no-match state", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceChooser
        labels={workspaceMessages("en")}
        workspaces={workspaces}
      />,
    );
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      [
        "Jordan & Alex2027-06-12 · Partner",
        "Morgan & RileyDate not set · Planner",
      ],
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search weddings" }),
      "missing",
    );
    expect(screen.getByRole("status")).toHaveTextContent("No weddings found");
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("presents localized entry details and preserves locale in links", () => {
    render(
      <WorkspaceChooser
        labels={workspaceMessages("de")}
        workspaces={[
          {
            ...workspaces[1],
            dateLabel: "Datum nicht festgelegt",
            roleLabel: "Planer",
            href: `${workspaces[1].href}?locale=de`,
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Hochzeit auswählen" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Morgan & Riley/ }),
    ).toHaveAttribute("href", `${workspaces[1].href}?locale=de`);
  });
});
