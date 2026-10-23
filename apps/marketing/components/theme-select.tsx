"use client";
import { useEffect, useRef } from "react";
export function ThemeSelect() {
  const select = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (select.current) select.current.value = document.documentElement.dataset.theme ?? "system";
  }, []);
  return <label className="theme-control">Theme
    <select ref={select} defaultValue="system" onChange={(event) => {
      const preference = event.target.value;
      document.documentElement.dataset.theme = preference;
      try { localStorage.setItem("vowora-marketing-theme", preference); } catch { /* Theme works without storage. */ }
    }}>
      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
    </select>
  </label>;
}
