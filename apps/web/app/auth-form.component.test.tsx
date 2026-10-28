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

  it("reveals and submits a risk challenge without exposing provider details", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "synthetic-site-key";
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          { code: "AUTHENTICATION_CHALLENGE_REQUIRED" },
          { status: 403 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    const { container } = render(<AuthForm mode="sign-in" />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.type(
      screen.getByLabelText("Password"),
      "synthetic-passphrase-123",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByLabelText("Additional verification"),
    ).toBeInTheDocument();
    const token = document.createElement("input");
    token.name = "cf-turnstile-response";
    token.value = "synthetic-challenge-token";
    container.querySelector("form")?.append(token);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(request.mock.calls[1]?.[1]?.headers).toMatchObject({
      "x-vowora-challenge-token": "synthetic-challenge-token",
    });
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });
});
