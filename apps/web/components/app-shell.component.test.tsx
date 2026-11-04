import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type {
  WeddingNavigationDestinationId,
  WeddingShellNavigation,
} from "../lib/workspace-navigation";
import { AppShell } from "./app-shell";

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
});
