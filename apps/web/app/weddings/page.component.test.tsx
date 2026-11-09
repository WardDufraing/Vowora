import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WeddingWorkspaceEntryPage from "./page";

const { getSession, loadEntry, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  loadEntry: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));
vi.mock("../../lib/wedding-service", () => ({
  loadWeddingWorkspaceEntryForActor: loadEntry,
}));

const accessible = {
  weddingId: "019a1f5e-70a0-7000-8000-000000000002",
  name: "Jordan & Alex",
  weddingDate: null,
  lastOpenedAt: "2026-11-08T12:00:00.000Z",
  membership: {
    actorId: "019a1f5e-70a0-7000-8000-000000000001",
    weddingId: "019a1f5e-70a0-7000-8000-000000000002",
    role: "partner",
    status: "active",
    accessExpiresAt: null,
    permissionOverrides: [],
  },
};

beforeEach(() => {
  getSession.mockReset();
  loadEntry.mockReset();
  redirect.mockClear();
});

describe("wedding workspace entry", () => {
  it("preserves the localized entry as a safe sign-in continuation", async () => {
    getSession.mockResolvedValue(null);
    await expect(
      WeddingWorkspaceEntryPage({
        searchParams: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("redirect:/sign-in?next=%2Fweddings%3Flocale%3Dfr");
  });

  it("opens the accessible last-opened wedding on a normal entry", async () => {
    getSession.mockResolvedValue({
      user: { id: accessible.membership.actorId },
    });
    loadEntry.mockResolvedValue({
      accessibleWorkspaces: [accessible],
      lastOpenedAccessibleWeddingId: accessible.weddingId,
    });
    await expect(
      WeddingWorkspaceEntryPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(`redirect:/weddings/${accessible.weddingId}/dashboard`);
  });

  it("shows only accessible weddings when the last-opened membership is unavailable", async () => {
    getSession.mockResolvedValue({
      user: { id: accessible.membership.actorId },
    });
    loadEntry.mockResolvedValue({
      accessibleWorkspaces: [accessible],
      lastOpenedAccessibleWeddingId: null,
    });
    render(
      await WeddingWorkspaceEntryPage({
        searchParams: Promise.resolve({ locale: "nl" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Kies een bruiloft" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Jordan & Alex/ })).toHaveAttribute(
      "href",
      `/weddings/${accessible.weddingId}/dashboard?locale=nl`,
    );
    expect(screen.queryByText(/revoked|expired/i)).toBeNull();
  });

  it("honors the explicit chooser link without replacing personal recency", async () => {
    getSession.mockResolvedValue({
      user: { id: accessible.membership.actorId },
    });
    loadEntry.mockResolvedValue({
      accessibleWorkspaces: [accessible],
      lastOpenedAccessibleWeddingId: accessible.weddingId,
    });
    render(
      await WeddingWorkspaceEntryPage({
        searchParams: Promise.resolve({ choose: "true" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Choose a wedding" }),
    ).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
