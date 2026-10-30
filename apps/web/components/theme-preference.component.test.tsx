import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemePreferenceControl } from "./theme-preference";

describe("ThemePreferenceControl", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "system";
  });

  it("uses System by default and persists an explicit override", async () => {
    const user = userEvent.setup();
    render(<ThemePreferenceControl />);
    expect(screen.getByLabelText("Appearance")).toHaveValue("system");

    await user.selectOptions(screen.getByLabelText("Appearance"), "dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("vowora-app-theme")).toBe("dark");
  });

  it("restores a stored preference after hydration", async () => {
    localStorage.setItem("vowora-app-theme", "light");
    render(<ThemePreferenceControl />);
    await waitFor(() =>
      expect(screen.getByLabelText("Appearance")).toHaveValue("light"),
    );
  });
});
