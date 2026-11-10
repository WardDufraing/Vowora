import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { organizationMessages } from "../../lib/organization-messages";
import { OrganizationForm } from "./organization-form";

afterEach(() => vi.unstubAllGlobals());

describe("organization creation form", () => {
  it("keeps one idempotency key for an ambiguous retry of the same name", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<OrganizationForm messages={organizationMessages("en")} />);

    await user.type(screen.getByLabelText("Organization name"), " North Star ");
    const submit = screen.getByRole("button", { name: "Create organization" });
    await user.click(submit);
    await user.click(submit);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    const first = fetch.mock.calls[0]?.[1] as RequestInit;
    const second = fetch.mock.calls[1]?.[1] as RequestInit;
    expect((first.headers as Record<string, string>)["idempotency-key"]).toBe(
      (second.headers as Record<string, string>)["idempotency-key"],
    );
    expect(JSON.parse(String(first.body))).toEqual({ name: "North Star" });
  });

  it("uses a new key after the normalized payload changes", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<OrganizationForm messages={organizationMessages("en")} />);

    const name = screen.getByLabelText("Organization name");
    const submit = screen.getByRole("button", { name: "Create organization" });
    await user.type(name, "North Star");
    await user.click(submit);
    await user.clear(name);
    await user.type(name, "South Star");
    await user.click(submit);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    const first = fetch.mock.calls[0]?.[1] as RequestInit;
    const second = fetch.mock.calls[1]?.[1] as RequestInit;
    expect(
      (first.headers as Record<string, string>)["idempotency-key"],
    ).not.toBe((second.headers as Record<string, string>)["idempotency-key"]);
  });
});
