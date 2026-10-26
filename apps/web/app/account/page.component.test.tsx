import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./page";

const { getSession, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../../lib/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));

beforeEach(() => {
  getSession.mockReset();
  redirect.mockClear();
});

describe("account access", () => {
  it("redirects anonymous visitors to sign in", async () => {
    getSession.mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow("redirect:/sign-in");
  });

  it("redirects unverified accounts to email verification", async () => {
    getSession.mockResolvedValue({ user: { emailVerified: false } });

    await expect(AccountPage()).rejects.toThrow("redirect:/verify-email");
  });

  it("renders the account page for a verified session", async () => {
    getSession.mockResolvedValue({ user: { emailVerified: true } });

    render(await AccountPage());

    expect(
      screen.getByRole("heading", { name: "Account access confirmed" }),
    ).toBeInTheDocument();
  });
});
