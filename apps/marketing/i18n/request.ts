import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";
import en from "../messages/en.json";
import nl from "../messages/nl.json";
import fr from "../messages/fr.json";
import de from "../messages/de.json";
// The shared shape makes missing translations a type error, rather than shipping
// a partly English page. Unknown request locales use the English default.
export const messages: Record<Locale, typeof en> = { en, nl, fr, de };
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return { locale, messages: messages[locale] };
});
