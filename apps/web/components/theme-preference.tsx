"use client";

import { useSyncExternalStore } from "react";

import {
  applyThemePreference,
  readThemePreference,
  type ThemePreference,
} from "../lib/theme-preference";

export function ThemePreferenceControl({ id = "app-theme" }: { id?: string }) {
  const preference = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener("vowora-theme-change", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("vowora-theme-change", notify);
      };
    },
    () => readThemePreference(window.localStorage),
    () => "system" as ThemePreference,
  );

  return (
    <div className="theme-preference">
      <label htmlFor={id}>Appearance</label>
      <select
        id={id}
        value={preference}
        onChange={(event) => {
          const next = event.target.value as ThemePreference;
          applyThemePreference(
            next,
            document.documentElement,
            window.localStorage,
          );
          window.dispatchEvent(new Event("vowora-theme-change"));
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
