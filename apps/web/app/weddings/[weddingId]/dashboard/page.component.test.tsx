import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WeddingDashboardPage from "./page";

const { getSession, loadShell, redirect, resolveNavigation } = vi.hoisted(
  () => ({
    getSession: vi.fn(),
    loadShell: vi.fn(),
    redirect: vi.fn((destination: string) => {
      throw new Error(`redirect:${destination}`);
    }),
    resolveNavigation: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect }));
vi.mock("../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));
vi.mock("../../../../lib/wedding-service", () => ({
  loadWeddingShellForActor: loadShell,
}));
vi.mock("../../../../lib/workspace-navigation", () => ({
  resolveWeddingShellNavigation: resolveNavigation,
}));
vi.mock("../../../../components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
}));

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";

beforeEach(() => {
  getSession.mockReset();
  loadShell.mockReset();
  redirect.mockClear();
  resolveNavigation.mockReset();
});

describe("wedding dashboard deep link", () => {
  it("redirects anonymous visitors back to the exact localized dashboard", async () => {
    getSession.mockResolvedValue(null);
    await expect(
      WeddingDashboardPage({
        params: Promise.resolve({ weddingId }),
        searchParams: Promise.resolve({ locale: "de" }),
      }),
    ).rejects.toThrow(
      `redirect:/sign-in?next=%2Fweddings%2F${weddingId}%2Fdashboard%3Flocale%3Dde`,
    );
  });

  it("shows the same private wedding-unavailable state for inaccessible membership", async () => {
    getSession.mockResolvedValue({ user: { id: actorId } });
    loadShell.mockResolvedValue(undefined);
    render(
      await WeddingDashboardPage({
        params: Promise.resolve({ weddingId }),
        searchParams: Promise.resolve({ locale: "fr" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Ce mariage est indisponible" }),
    ).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/weddings?choose=true&locale=fr",
    );
  });

  it("records the opened wedding and renders its authorized shell", async () => {
    getSession.mockResolvedValue({ user: { id: actorId } });
    loadShell.mockResolvedValue({
      current: { membership: {} },
      workspaces: [],
    });
    resolveNavigation.mockReturnValue({
      labels: { dashboardTitle: "Dashboard", dashboardDescription: "Ready" },
    });
    render(
      await WeddingDashboardPage({
        params: Promise.resolve({ weddingId }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(loadShell).toHaveBeenCalledWith({ actorId, weddingId });
    expect(resolveNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        weddingId,
        requestedPath: `/weddings/${weddingId}/dashboard`,
      }),
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
