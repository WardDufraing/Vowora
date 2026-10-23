import type { MetadataRoute } from "next";
import { verifiedSiteUrl } from "../lib/site";
export default function robots(): MetadataRoute.Robots {
  const site = verifiedSiteUrl();
  return {
    rules: site
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    ...(site ? { sitemap: new URL("/sitemap.xml", site).href } : {}),
  };
}
