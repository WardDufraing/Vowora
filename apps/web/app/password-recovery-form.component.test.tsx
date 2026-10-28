import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PasswordRecoveryForm } from "./password-recovery-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  push.mockReset();
  vi.unstubAllGlobals();
});

describe("password recovery form", () => {
  it("always presents an enumeration-safe recovery acknowledgement", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{"private":"detail"}', { status: 200 }));
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<PasswordRecoveryForm />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists for that email, a reset link will arrive shortly.",
    );
    expect(screen.queryByText(/private/)).not.toBeInTheDocument();
  });

  it("submits only the token and bounded replacement password", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<PasswordRecoveryForm token="single-use-token" />);
    await user.type(
      screen.getByLabelText("New password"),
      "replacement-passphrase-456",
    );
    await user.click(screen.getByRole("button", { name: "Set new password" }));
    expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body))).toEqual({
      token: "single-use-token",
      newPassword: "replacement-passphrase-456",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password updated. Sign in again on every device.",
    );
  });

  it("recovers from a rejected request without leaving the form disabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network failed")),
    );
    const user = userEvent.setup();
    render(<PasswordRecoveryForm />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The request could not be completed. Please try again.",
    );
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeEnabled();
  });

  it("reveals the accessible risk challenge for recovery without changing its acknowledgement", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            { code: "AUTHENTICATION_CHALLENGE_REQUIRED" },
            { status: 403 },
          ),
        ),
    );
    const user = userEvent.setup();
    render(<PasswordRecoveryForm />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByText(
        "Additional verification is temporarily unavailable. Try again later.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Complete the verification challenge and try again.",
    );
  });
});
