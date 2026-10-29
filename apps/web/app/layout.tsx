import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "./globals.css";
import { ThemePreferenceControl } from "../components/theme-preference";
import { initialThemeScript } from "../lib/theme-preference";
export const metadata: Metadata = {
  title: "Vowora — Account access",
  description: "Sign in to the Vowora wedding planning application.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <aside className="app-preferences" aria-label="Display preferences">
          <ThemePreferenceControl />
        </aside>
        {children}
      </body>
    </html>
  );
}
