import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VerifyEmailForm } from "./verify-email-form";

afterEach(() => vi.unstubAllGlobals());

describe("verification resend form", () => {
  it("presents an enumeration-safe acknowledgement", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 200 })),
    );
    const user = userEvent.setup();
    render(<VerifyEmailForm />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.click(
      screen.getByRole("button", { name: "Send verification email" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an unverified account exists, a verification email is on its way.",
    );
  });

  it("reveals an accessible risk challenge from a safe problem code", async () => {
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
    render(<VerifyEmailForm />);
    await user.type(screen.getByLabelText("Email"), "partner@example.test");
    await user.click(
      screen.getByRole("button", { name: "Send verification email" }),
    );
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
