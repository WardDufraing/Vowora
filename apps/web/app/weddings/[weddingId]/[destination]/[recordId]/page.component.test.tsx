import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WeddingRecordDeepLinkPage from "./page";

const { getSession, loadShell, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  loadShell: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect }));
vi.mock("../../../../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));
vi.mock("../../../../../lib/wedding-service", () => ({
  loadWeddingShellForActor: loadShell,
}));

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const recordId = "019a1f5e-70a0-7000-8000-000000000003";

beforeEach(() => {
  getSession.mockResolvedValue({ user: { id: actorId } });
  loadShell.mockReset();
  redirect.mockClear();
});

describe("cross-workspace record deep-link privacy", () => {
  it("distinguishes only wedding access, never deleted from permission-denied records", async () => {
    loadShell.mockResolvedValue({ current: {}, workspaces: [] });
    render(
      await WeddingRecordDeepLinkPage({
        params: Promise.resolve({
          weddingId,
          destination: "timeline",
          recordId,
        }),
        searchParams: Promise.resolve({ locale: "nl" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Dit item is niet beschikbaar" }),
    ).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/weddings/${weddingId}/dashboard?locale=nl`,
    );
    expect(document.body.textContent).not.toMatch(/record|permission|deleted/i);
  });

  it("does not expose an item-level state when the wedding is inaccessible", async () => {
    loadShell.mockResolvedValue(undefined);
    render(
      await WeddingRecordDeepLinkPage({
        params: Promise.resolve({
          weddingId,
          destination: "timeline",
          recordId,
        }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "This wedding is unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText("This item is unavailable")).toBeNull();
  });
});
