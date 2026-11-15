import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { organizationMessages } from "../../../lib/organization-messages";
import { OrganizationNavigation } from "./organization-navigation";

describe("organization management navigation", () => {
  it("preserves locale and exposes staff and wedding management", () => {
    render(
      <OrganizationNavigation
        active="staff"
        locale="nl"
        messages={organizationMessages("nl")}
        organizationId="019a2f36-0eb9-7000-8000-000000000002"
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Organisatiebeheer" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Medewerkers" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Bruiloften" })).toHaveAttribute(
      "href",
      "/organizations/019a2f36-0eb9-7000-8000-000000000002/weddings?locale=nl",
    );
  });
});
