"use client";
import { useEffect, useRef } from "react";
export function ThemeSelect({
  labels,
}: {
  labels: { theme: string; system: string; light: string; dark: string };
}) {
  const select = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (select.current)
      select.current.value = document.documentElement.dataset.theme ?? "system";
  }, []);
  return (
    <div className="theme-control">
      <label htmlFor="theme-preference">{labels.theme}</label>
      <select
        id="theme-preference"
        ref={select}
        defaultValue="system"
        onChange={(event) => {
          const preference = event.target.value;
          document.documentElement.dataset.theme = preference;
          try {
            localStorage.setItem("vowora-marketing-theme", preference);
          } catch {
            /* Theme works without storage. */
          }
        }}
      >
        <option value="system">{labels.system}</option>
        <option value="light">{labels.light}</option>
        <option value="dark">{labels.dark}</option>
      </select>
    </div>
  );
}
