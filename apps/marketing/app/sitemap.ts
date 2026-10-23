import type { MetadataRoute } from "next";
import { verifiedSiteUrl } from "../lib/site";
import { routing, localePath } from "../i18n/routing";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = verifiedSiteUrl();
  if (!site) return [];
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      new URL(localePath(locale), site).href,
    ]),
  );
  return routing.locales.map((locale) => ({
    url: new URL(localePath(locale), site).href,
    alternates: { languages },
  }));
}
