import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { weddingMessages } from "../../lib/wedding-messages";
import { WeddingForm } from "./wedding-form";

afterEach(() => vi.unstubAllGlobals());

describe("localized wedding settings form", () => {
  it("renders German labels and exposes accessible validation", async () => {
    const user = userEvent.setup();
    render(
      <WeddingForm
        endpoint="/api/v1/weddings"
        initial={{ name: "", weddingDate: null, timeZone: "bad-zone" }}
        messages={weddingMessages("de")}
        mode="create"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Bereich erstellen" }));
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Gebt einen Namen für die Hochzeit ein.",
    );
    expect(screen.getByLabelText("Name der Hochzeit")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Zeitzone der Hochzeit")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("reuses the idempotency key for an exact retry and never sends a role", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <WeddingForm
        endpoint="/api/v1/weddings"
        initial={{
          name: "Jordan & Alex",
          weddingDate: "2027-06-12",
          timeZone: "Europe/Brussels",
        }}
        messages={weddingMessages("en")}
        mode="create"
      />,
    );
    const submit = screen.getByRole("button", { name: "Create workspace" });
    await user.click(submit);
    await user.click(submit);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const first = fetch.mock.calls[0]?.[1] as RequestInit;
    const second = fetch.mock.calls[1]?.[1] as RequestInit;
    expect((first.headers as Record<string, string>)["idempotency-key"]).toBe(
      (second.headers as Record<string, string>)["idempotency-key"],
    );
    expect(JSON.parse(String(first.body))).toEqual({
      name: "Jordan & Alex",
      weddingDate: "2027-06-12",
      timeZone: "Europe/Brussels",
    });
  });

  it("uses the returned optimistic version for the next settings save", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ data: { id: "unused", settingsVersion: 4 } }),
      )
      .mockResolvedValueOnce(
        Response.json({ data: { id: "unused", settingsVersion: 5 } }),
      );
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(
      <WeddingForm
        endpoint="/api/v1/weddings/019a1f5e-70a0-7000-8000-000000000002"
        initial={{
          name: "Jordan & Alex",
          weddingDate: null,
          timeZone: "Europe/Brussels",
          settingsVersion: 3,
        }}
        messages={weddingMessages("fr")}
        mode="settings"
      />,
    );
    const submit = screen.getByRole("button", { name: "Enregistrer" });
    await user.click(submit);
    await screen.findByText("Les paramètres du mariage sont enregistrés.");
    await user.click(submit);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toMatchObject({
      expectedVersion: 3,
    });
    expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body))).toMatchObject({
      expectedVersion: 4,
    });
  });
});
