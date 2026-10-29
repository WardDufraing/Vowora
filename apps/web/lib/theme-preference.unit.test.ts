import { describe, expect, it, vi } from "vitest";

import {
  applyThemePreference,
  isThemePreference,
  readThemePreference,
  themeStorageKey,
} from "./theme-preference";

describe("theme preference", () => {
  it.each(["system", "light", "dark"])("accepts %s", (preference) => {
    expect(isThemePreference(preference)).toBe(true);
  });

  it("defaults invalid, missing and inaccessible storage to system", () => {
    expect(readThemePreference({ getItem: () => "sepia" })).toBe("system");
    expect(readThemePreference({ getItem: () => null })).toBe("system");
    expect(
      readThemePreference({
        getItem: () => {
          throw new DOMException("blocked");
        },
      }),
    ).toBe("system");
  });

  it("applies and persists only the validated preference", () => {
    const root = { dataset: {} as DOMStringMap };
    const setItem = vi.fn();
    applyThemePreference("dark", root, { setItem });
    expect(root.dataset.theme).toBe("dark");
    expect(setItem).toHaveBeenCalledWith(themeStorageKey, "dark");
  });

  it("still applies a preference when persistence is blocked", () => {
    const root = { dataset: {} as DOMStringMap };
    applyThemePreference("light", root, {
      setItem: () => {
        throw new DOMException("blocked");
      },
    });
    expect(root.dataset.theme).toBe("light");
  });
});
