import { afterEach, describe, expect, it, vi } from "vitest";
import { verifiedSiteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

describe("verifiedSiteUrl", () => {
  it("keeps an unconfigured build unverified", () => {
    vi.stubEnv("MARKETING_SITE_URL", "");
    expect(verifiedSiteUrl()).toBeUndefined();
  });
  it.each(["https://vowora.app", "https://vowora.app/"])(
    "accepts approved origin %s",
    (value) => {
      vi.stubEnv("MARKETING_SITE_URL", value);
      expect(verifiedSiteUrl()?.href).toBe("https://vowora.app/");
    },
  );
  it.each([
    "http://vowora.app",
    "https://vowora.app.evil.test",
    "https://vowora.app/path",
    "https://preview.vercel.app",
    "not a URL",
  ])("rejects unverified origin %s", (value) => {
    vi.stubEnv("MARKETING_SITE_URL", value);
    expect(verifiedSiteUrl).toThrow(
      "MARKETING_SITE_URL must be https://vowora.app",
    );
  });
});
