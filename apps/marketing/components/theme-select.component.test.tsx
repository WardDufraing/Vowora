import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeSelect } from "./theme-select";

const labels = {
  theme: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
};

describe("ThemeSelect", () => {
  it("shows the already applied theme after mount", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeSelect labels={labels} />);
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveValue("dark");
  });

  it.each(["light", "dark", "system"])(
    "applies and persists %s",
    async (theme) => {
      const user = userEvent.setup();
      render(<ThemeSelect labels={labels} />);
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Theme" }),
        theme,
      );
      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(localStorage.getItem("vowora-marketing-theme")).toBe(theme);
    },
  );

  it("still changes the visible theme when storage is denied", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });
    const user = userEvent.setup();
    render(<ThemeSelect labels={labels} />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Theme" }),
      "dark",
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("combobox", { name: "Theme" })).toHaveValue("dark");
  });

  it("exposes translated labels to keyboard and assistive technology", async () => {
    const user = userEvent.setup();
    render(
      <ThemeSelect
        labels={{
          theme: "Thema",
          system: "Systeem",
          light: "Licht",
          dark: "Donker",
        }}
      />,
    );
    await user.tab();
    expect(screen.getByRole("combobox", { name: "Thema" })).toHaveFocus();
    expect(screen.getByRole("option", { name: "Systeem" })).toHaveValue(
      "system",
    );
    expect(screen.getByRole("option", { name: "Licht" })).toHaveValue("light");
    expect(screen.getByRole("option", { name: "Donker" })).toHaveValue("dark");
  });
});
