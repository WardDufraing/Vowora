import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/500.css";
import "./globals.css";
import { verifiedSiteUrl } from "../lib/site";
const siteUrl = verifiedSiteUrl();
export const metadata: Metadata = {
  title: "Vowora — One wedding, one shared plan",
  description:
    "A shared wedding planning space in the making, for couples and professional planners. Discover the vision for Vowora.",
  ...(siteUrl ? { metadataBase: siteUrl, alternates: { canonical: "/" } } : {}),
  robots: { index: Boolean(siteUrl), follow: Boolean(siteUrl) },
  openGraph: {
    title: "Vowora — One wedding, one shared plan",
    description:
      "A calmer shared wedding planning space, in development for couples and professional planners.",
    type: "website",
    locale: "en_US",
    siteName: "Vowora",
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: "summary",
    title: "Vowora — One wedding, one shared plan",
    description: "A shared wedding planning space in the making.",
  },
};
const themeScript = `try{var t=localStorage.getItem('vowora-marketing-theme');if(t==='light'||t==='dark'||t==='system')document.documentElement.dataset.theme=t}catch{}`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
