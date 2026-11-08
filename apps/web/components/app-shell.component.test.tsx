import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type {
  WeddingNavigationDestinationId,
  WeddingShellNavigation,
} from "../lib/workspace-navigation";
import { AppShell } from "./app-shell";
import { WeddingForm } from "../app/weddings/wedding-form";
import { weddingMessages } from "../lib/wedding-messages";
import { workspaceMessages } from "../lib/workspace-messages";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const weddingId = "019a1f5e-70a0-7000-8000-000000000002";

function model(
  activeDestination: WeddingNavigationDestinationId = "timeline",
): WeddingShellNavigation {
  const destinations = [
    { id: "dashboard", label: "Dashboard", mobile: "primary" },
    { id: "timeline", label: "Timeline", mobile: "primary" },
    {
      id: "decisions",
      label: "Decisions",
      mobile: "more",
      mobileGroup: "planning",
    },
    {
      id: "contacts",
      label: "Contacts",
      mobile: "more",
      mobileGroup: "people",
    },
    {
      id: "reports",
      label: "Reports & exports",
      mobile: "more",
      mobileGroup: "reports",
    },
    { id: "settings", label: "Workspace settings", mobile: "more" },
  ] as const;
  return {
    activeDestination,
    weddingId,
    weddingName: "Jordan & Alex",
    weddingDateLabel: "2027-06-12",
    roleLabel: "Partner",
    labels: workspaceMessages("en"),
    destinations: destinations.map((destination) => ({
      ...destination,
      href: `/weddings/${weddingId}/${destination.id}`,
    })),
    workspaceOptions: [
      {
        weddingId,
        name: "Jordan & Alex",
        dateLabel: "2027-06-12",
        roleLabel: "Partner",
        href: `/weddings/${weddingId}/dashboard`,
        current: true,
      },
      {
        weddingId: "019a1f5e-70a0-7000-8000-000000000003",
        name: "Morgan & Riley",
        dateLabel: "Date not set",
        roleLabel: "Planner",
        href: "/weddings/019a1f5e-70a0-7000-8000-000000000003/dashboard",
        current: false,
      },
    ],
  };
}

describe("responsive application shell", () => {
  it("marks the active destination and renders only server-provided destinations", () => {
    render(<AppShell model={model()}>Content</AppShell>);
    const sidebar = screen.getByRole("complementary", {
      name: "Wedding workspace sidebar",
    });
    expect(
      within(sidebar).getByRole("link", { name: "Timeline" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).queryByRole("link", { name: "Guests" })).toBeNull();
    expect(screen.getByRole("main")).toHaveTextContent("Content");
  });

  it("searches accessible workspaces and closes without navigating for the current wedding", async () => {
    const user = userEvent.setup();
    render(<AppShell model={model()}>Content</AppShell>);
    const switcher = screen.getAllByRole("group")[0]!;
    const summary = switcher.querySelector("summary");
    expect(summary).not.toBeNull();
    await user.click(summary!);
    const search = within(switcher).getByRole("searchbox", {
      name: "Search weddings",
    });
    await user.type(search, "missing");
    expect(within(switcher).getByRole("status")).toHaveTextContent(
      "No weddings found",
    );
    await user.click(
      within(switcher).getByRole("button", { name: "Clear search" }),
    );
    const workspaceNavigation = within(switcher).getByRole("navigation", {
      name: "Wedding workspaces",
    });
    expect(
      within(workspaceNavigation).getByRole("link", { name: /Morgan & Riley/ }),
    ).toHaveAttribute(
      "href",
      "/weddings/019a1f5e-70a0-7000-8000-000000000003/dashboard",
    );
    await user.click(
      within(workspaceNavigation).getByRole("button", {
        name: /Jordan & Alex/,
      }),
    );
    expect(switcher).not.toHaveAttribute("open");
    expect(summary).toHaveFocus();
  });

  it("collapses accessibly without removing labels from the accessibility tree", async () => {
    const user = userEvent.setup();
    render(<AppShell model={model()}>Content</AppShell>);
    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    await user.click(collapse);
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getAllByRole("link", { name: "Timeline" }).length,
    ).toBeGreaterThan(0);
    expect(
      within(
        screen.getByRole("complementary", {
          name: "Wedding workspace sidebar",
        }),
      ).getByTitle("Current workspace: Jordan & Alex"),
    ).toHaveClass("workspace-context__compact");
  });

  it("keeps compact workspace identity for a single-workspace collapsed rail", async () => {
    const user = userEvent.setup();
    const singleWorkspace = model();
    render(
      <AppShell
        model={{
          ...singleWorkspace,
          workspaceOptions: [singleWorkspace.workspaceOptions[0]!],
        }}
      >
        Content
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(
      within(
        screen.getByRole("complementary", {
          name: "Wedding workspace sidebar",
        }),
      ).getByTitle("Current workspace: Jordan & Alex"),
    ).toHaveClass("workspace-context__compact");
  });

  it("groups More destinations, hides empty groups and restores focus on Escape", async () => {
    const user = userEvent.setup();
    render(<AppShell model={model()}>Content</AppShell>);
    const trigger = screen.getByRole("button", {
      name: /More.*workspace navigation/,
    });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "More" });
    expect(
      within(dialog).getByRole("heading", { name: "Planning" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("heading", { name: "People" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("heading", { name: "Reports" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Workspace settings" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("marks More current and exposes the synchronized mobile appearance control", async () => {
    const user = userEvent.setup();
    render(<AppShell model={model("decisions")}>Content</AppShell>);
    const trigger = screen.getByRole("button", {
      name: /More.*workspace navigation/,
    });
    expect(trigger).toHaveAttribute("aria-current", "page");
    expect(trigger).toHaveTextContent("Current");
    await user.click(trigger);
    expect(
      within(screen.getByRole("dialog", { name: "More" })).getByRole("link", {
        name: "Decisions",
      }),
    ).toHaveAttribute("aria-current", "page");
    const appearance = screen.getByRole("combobox", { name: "Appearance" });
    await user.selectOptions(appearance, "dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("protects dirty settings with Stay, failed Save, successful Save and refresh handling", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        Response.json({ data: { id: weddingId, settingsVersion: 2 } }),
      );
    vi.stubGlobal("fetch", fetch);
    push.mockClear();
    const user = userEvent.setup();
    render(
      <AppShell model={model("settings")}>
        <WeddingForm
          endpoint={`/api/v1/weddings/${weddingId}`}
          initial={{
            name: "Jordan & Alex",
            weddingDate: "2027-06-12",
            timeZone: "Europe/Brussels",
            settingsVersion: 1,
          }}
          messages={weddingMessages("en")}
          mode="settings"
        />
      </AppShell>,
    );
    const name = screen.getByLabelText("Wedding name");
    await user.clear(name);
    await user.type(name, "Changed wedding");
    const refresh = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(refresh);
    expect(refresh.defaultPrevented).toBe(true);

    const switcher = screen.getAllByRole("group")[0]!;
    await user.click(switcher.querySelector("summary")!);
    await user.click(
      within(switcher).getByRole("button", { name: /Jordan & Alex/ }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Unsaved changes" }),
    ).toBeNull();
    expect(name).toHaveValue("Changed wedding");
    await user.click(switcher.querySelector("summary")!);
    const otherWedding = within(switcher).getByRole("link", {
      name: /Morgan & Riley/,
    });
    await user.click(otherWedding);
    let dialog = screen.getByRole("dialog", { name: "Unsaved changes" });
    expect(within(dialog).getByRole("button", { name: "Save" })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Stay" }));
    expect(
      screen.queryByRole("dialog", { name: "Unsaved changes" }),
    ).toBeNull();
    expect(name).toHaveValue("Changed wedding");

    await user.click(otherWedding);
    dialog = screen.getByRole("dialog", { name: "Unsaved changes" });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    const failedDialog = await screen.findByRole("dialog", {
      name: "Unsaved changes",
    });
    expect(within(failedDialog).getByRole("alert")).toHaveTextContent(
      "could not be saved",
    );
    expect(push).not.toHaveBeenCalled();
    await user.click(
      within(screen.getByRole("dialog", { name: "Unsaved changes" })).getByRole(
        "button",
        { name: "Save" },
      ),
    );
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(push).toHaveBeenCalledWith(
      "/weddings/019a1f5e-70a0-7000-8000-000000000003/dashboard",
    );
    vi.unstubAllGlobals();
  });

  it("discards dirty edits for link and browser-back navigation", async () => {
    push.mockClear();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const forward = vi
      .spyOn(window.history, "forward")
      .mockImplementation(() => {});
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    const user = userEvent.setup();
    const { unmount } = render(
      <AppShell model={model("settings")}>
        <WeddingForm
          endpoint={`/api/v1/weddings/${weddingId}`}
          initial={{
            name: "Jordan & Alex",
            weddingDate: null,
            timeZone: "Europe/Brussels",
            settingsVersion: 1,
          }}
          messages={weddingMessages("en")}
          mode="settings"
        />
      </AppShell>,
    );
    await user.type(screen.getByLabelText("Wedding name"), " changed");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(forward).toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", {
      name: "Unsaved changes",
    });
    await user.click(within(dialog).getByRole("button", { name: "Discard" }));
    expect(go).toHaveBeenCalledWith(-2);
    unmount();
    back.mockRestore();
    forward.mockRestore();
    go.mockRestore();
  });

  it("preserves an exact cross-workspace record deep link after resolving dirty edits", async () => {
    push.mockClear();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const user = userEvent.setup();
    const exactRecord =
      "/weddings/019a1f5e-70a0-7000-8000-000000000003/timeline/019a1f5e-70a0-7000-8000-000000000004?locale=fr";
    render(
      <AppShell model={model("settings")}>
        <WeddingForm
          endpoint={`/api/v1/weddings/${weddingId}`}
          initial={{
            name: "Jordan & Alex",
            weddingDate: null,
            timeZone: "Europe/Brussels",
            settingsVersion: 1,
          }}
          messages={weddingMessages("en")}
          mode="settings"
        />
        <a href={exactRecord}>Open linked task</a>
      </AppShell>,
    );
    await user.type(screen.getByLabelText("Wedding name"), " changed");
    await user.click(screen.getByRole("link", { name: "Open linked task" }));
    const dialog = screen.getByRole("dialog", { name: "Unsaved changes" });
    await user.click(within(dialog).getByRole("button", { name: "Stay" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Wedding name")).toHaveValue(
      "Jordan & Alex changed",
    );
    await user.click(screen.getByRole("link", { name: "Open linked task" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Unsaved changes" })).getByRole(
        "button",
        { name: "Discard" },
      ),
    );
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(push).toHaveBeenCalledWith(exactRecord);
    back.mockRestore();
  });
});
