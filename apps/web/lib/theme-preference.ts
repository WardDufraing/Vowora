export const themeStorageKey = "vowora-app-theme";

export const themePreferences = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    themePreferences.includes(value as ThemePreference)
  );
}

export function readThemePreference(storage: Pick<Storage, "getItem">) {
  try {
    const value = storage.getItem(themeStorageKey);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function applyThemePreference(
  preference: ThemePreference,
  root: Pick<HTMLElement, "dataset">,
  storage?: Pick<Storage, "setItem">,
) {
  root.dataset.theme = preference;
  if (storage) {
    try {
      storage.setItem(themeStorageKey, preference);
    } catch {
      // Theme switching remains available when storage is unavailable.
    }
  }
}

export const initialThemeScript = `try{var t=localStorage.getItem('${themeStorageKey}');if(t==='light'||t==='dark'||t==='system')document.documentElement.dataset.theme=t}catch{}`;
