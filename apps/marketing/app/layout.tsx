import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Vowora — One wedding, one shared plan",
  description: "A shared wedding planning space in the making, for couples and professional planners. Discover the vision for Vowora.",
};
const themeScript = `try{var t=localStorage.getItem('vowora-marketing-theme');if(t==='light'||t==='dark'||t==='system')document.documentElement.dataset.theme=t}catch{}`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="system" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
