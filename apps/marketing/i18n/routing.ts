import { defineRouting } from "next-intl/routing";
export const routing = defineRouting({
  locales: ["en", "nl", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  alternateLinks: false,
});
export type Locale = (typeof routing.locales)[number];
export const languageNames: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
};
export function localePath(locale: Locale) {
  return locale === "en" ? "/" : `/${locale}`;
}
