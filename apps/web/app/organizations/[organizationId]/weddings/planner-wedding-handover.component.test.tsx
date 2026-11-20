import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerWeddingHandover } from "./planner-wedding-handover";

describe("planner wedding handover", () => {
  it("requires consequence confirmation before completing immediate exit", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "request-1" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            activeAssignmentCount: 2,
            leadAssigned: true,
            pendingInvitationCount: 1,
            unresolvedResponsibilityCount: null,
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const complete = vi.fn();
    render(
      <PlannerWeddingHandover
        accessId="access-1"
        locale="en"
        onComplete={complete}
        organizationId="org-1"
      />,
    );
    fireEvent.click(screen.getByLabelText("Leave immediately"));
    fireEvent.click(
      screen.getByRole("button", { name: "Review current handover" }),
    );
    const finish = await screen.findByRole("button", { name: "End access" });
    expect(finish).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I reviewed these consequences"));
    fireEvent.click(finish);
    await waitFor(() => expect(complete).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/organizations/org-1/wedding-access/access-1/handover",
      expect.objectContaining({
        body: JSON.stringify({ mode: "immediate", requestId: "request-1" }),
      }),
    );
  });
});
