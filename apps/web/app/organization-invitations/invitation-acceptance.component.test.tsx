import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { organizationMessages } from "../../lib/organization-messages";
import { OrganizationInvitationAcceptance } from "./invitation-acceptance";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("organization invitation acceptance", () => {
  it("requires explicit acceptance and opens organization staff after success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: { organizationId: "019a2f36-0eb9-7000-8000-000000000002" },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <OrganizationInvitationAcceptance
        endpoint="/api/accept"
        expired={false}
        messages={organizationMessages("de")}
        organizationName="North Star"
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Einladung annehmen" }),
    );
    expect(push).toHaveBeenCalledWith(
      "/organizations/019a2f36-0eb9-7000-8000-000000000002/staff",
    );
  });

  it("shows the localized replacement instruction without an accept action when expired", () => {
    render(
      <OrganizationInvitationAcceptance
        endpoint="/api/accept"
        expired
        messages={organizationMessages("fr")}
        organizationName="North Star"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cette invitation a expiré",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
