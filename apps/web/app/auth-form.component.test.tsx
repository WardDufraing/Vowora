import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  push.mockReset();
  vi.unstubAllGlobals();
});

describe("account forms", () => {
  it("submits sign-up and announces verification without exposing server details", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("private-response", { status: 200 }));
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<AuthForm mode="sign-up" />);

    await user.type(screen.getByLabelText("Name"), "Synthetic Partner");
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.type(
      screen.getByLabelText("Password"),
      "synthetic-passphrase-123",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0]?.[0]).toBe("/api/v1/auth/sign-up/email");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your inbox for a verification link before signing in.",
    );
    expect(screen.queryByText("private-response")).not.toBeInTheDocument();
  });

  it("uses the same safe error presentation for rejected sign-in responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response('{"message":"private-auth-detail"}', { status: 403 }),
        ),
    );
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.type(screen.getByLabelText("Password"), "wrong-password-value");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "We could not complete that request. Check your details and try again.",
    );
    expect(screen.queryByText(/private-auth-detail/)).not.toBeInTheDocument();
  });
});
