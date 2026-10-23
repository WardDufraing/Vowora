// Set only after the owner verifies the existing Vercel project's domain/HTTPS.
export function verifiedSiteUrl(): URL | undefined {
  const value = process.env.MARKETING_SITE_URL;
  if (!value) return undefined;
  if (value !== "https://vowora.app" && value !== "https://vowora.app/") {
    throw new Error(
      "MARKETING_SITE_URL must be https://vowora.app after domain verification",
    );
  }
  return new URL(value);
}
