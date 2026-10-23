import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/500.css";
import "../globals.css";
import { verifiedSiteUrl } from "../../lib/site";
import { routing, localePath, type Locale } from "../../i18n/routing";
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale });
  const siteUrl = verifiedSiteUrl();
  const ogLocales: Record<Locale, string> = {
    en: "en_US",
    nl: "nl_NL",
    fr: "fr_FR",
    de: "de_DE",
  };
  return {
    title: t("title"),
    description: t("metaDescription"),
    ...(siteUrl
      ? {
          metadataBase: siteUrl,
          alternates: {
            canonical: localePath(locale),
            languages: {
              ...Object.fromEntries(
                routing.locales.map((language) => [
                  language,
                  localePath(language),
                ]),
              ),
              "x-default": "/",
            },
          },
        }
      : {}),
    robots: { index: Boolean(siteUrl), follow: Boolean(siteUrl) },
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      type: "website",
      locale: ogLocales[locale],
      alternateLocale: routing.locales
        .filter((language) => language !== locale)
        .map((language) => ogLocales[language]),
      siteName: "Vowora",
      ...(siteUrl ? { url: localePath(locale) } : {}),
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("twitterDescription"),
    },
  };
}
const themeScript = `try{var t=localStorage.getItem('vowora-marketing-theme');if(t==='light'||t==='dark'||t==='system')document.documentElement.dataset.theme=t}catch{}`;
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
