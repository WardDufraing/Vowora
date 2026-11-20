import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganizationPrivateNotes } from "./private-notes";

describe("organization private notes", () => {
  it("shows private separation and archives only through the scoped API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "note-1",
          weddingId: null,
          title: "Internal",
          body: "Only staff",
          status: "archived",
          archivedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editable: true,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <OrganizationPrivateNotes
        initialNotes={[
          {
            id: "note-1",
            weddingId: null,
            title: "Internal",
            body: "Only staff",
            status: "active",
            archivedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            editable: true,
          },
        ]}
        locale="en"
        organizationId="org-1"
      />,
    );
    expect(screen.getByText(/never shared with the couple/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/organizations/org-1/private-notes/note-1",
        expect.objectContaining({ body: JSON.stringify({ archive: true }) }),
      ),
    );
    expect(await screen.findByText("Archived")).toBeTruthy();
  });
});
