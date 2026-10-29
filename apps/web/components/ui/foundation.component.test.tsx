import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FoundationDialog, StatusBadge, TextField } from "./foundation";

describe("foundation primitives", () => {
  it("connects descriptions and errors to their input", () => {
    render(
      <TextField
        id="name"
        label="Name"
        description="Use a recognizable name."
        error="Name is required."
      />,
    );
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Use a recognizable name. Name is required.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
  });

  it("keeps an explicit label in every status badge", () => {
    render(<StatusBadge tone="warning">Needs attention</StatusBadge>);
    expect(screen.getByText("Needs attention")).toBeVisible();
  });

  it("closes the Radix dialog with Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<FoundationDialog />);
    const trigger = screen.getByRole("button", { name: "Open dialog example" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
