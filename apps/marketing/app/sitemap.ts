import type { MetadataRoute } from "next";
import { verifiedSiteUrl } from "../lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = verifiedSiteUrl();
  return site ? [{ url: site.href }] : [];
}
