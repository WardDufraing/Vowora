import { describe, expect, it } from "vitest";
import {
  EnvironmentConfigurationError,
  readAuthEnvironment,
  readApplicationEnvironment,
  readPublicEnvironment,
  readServerEnvironment,
} from "./env";

describe("environment validation", () => {
  it("uses safe local defaults and parses explicit environments", () => {
    expect(readServerEnvironment({})).toEqual({ VOWORA_ENV: "local" });
    expect(readServerEnvironment({ VOWORA_ENV: "preview" })).toEqual({
      VOWORA_ENV: "preview",
    });
    expect(
      readPublicEnvironment({ NEXT_PUBLIC_APP_URL: "https://app.vowora.app" }),
    ).toEqual({ NEXT_PUBLIC_APP_URL: "https://app.vowora.app" });
  });

  it("reports variable names without disclosing invalid values", () => {
    const secretLikeValue = "invalid-secret-like-value";
    expect(() =>
      readServerEnvironment({ VOWORA_ENV: secretLikeValue }),
    ).toThrow(EnvironmentConfigurationError);
    try {
      readServerEnvironment({ VOWORA_ENV: secretLikeValue });
    } catch (error) {
      expect(error).toMatchObject({ variables: ["VOWORA_ENV"] });
      expect(String(error)).not.toContain(secretLikeValue);
    }
  });

  it("keeps public and server allowlists separate", () => {
    const environment = {
      VOWORA_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
      DATABASE_URL: "must-not-leak",
    };
    expect(readPublicEnvironment(environment)).toEqual({
      NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
    });
    expect(readServerEnvironment(environment)).toEqual({
      VOWORA_ENV: "production",
    });
  });

  it("requires the non-secret public app URL in production", () => {
    expect(() =>
      readApplicationEnvironment({ VOWORA_ENV: "production" }),
    ).toThrow(expect.objectContaining({ variables: ["NEXT_PUBLIC_APP_URL"] }));
    expect(() =>
      readApplicationEnvironment({
        VOWORA_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://app.vowora.app",
      }),
    ).toThrow(expect.objectContaining({ variables: ["NEXT_PUBLIC_APP_URL"] }));
    expect(
      readApplicationEnvironment({
        VOWORA_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
      }),
    ).toEqual({
      publicEnvironment: {
        NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
      },
      serverEnvironment: { VOWORA_ENV: "production" },
    });
  });

  it("requires private auth configuration without reflecting values", () => {
    const privateValue = "too-short-private-value";
    expect(() =>
      readAuthEnvironment({
        AUTH_SECRET: privateValue,
        AUTH_EMAIL_FROM: "invalid-private-from",
        RESEND_API_KEY: privateValue,
        NEXT_PUBLIC_APP_URL: "http://app.vowora.app",
        VOWORA_ENV: "production",
      }),
    ).toThrow(EnvironmentConfigurationError);
    try {
      readAuthEnvironment({
        AUTH_SECRET: privateValue,
        AUTH_EMAIL_FROM: "invalid-private-from",
        RESEND_API_KEY: privateValue,
        NEXT_PUBLIC_APP_URL: "http://app.vowora.app",
        VOWORA_ENV: "production",
      });
    } catch (error) {
      expect(String(error)).not.toContain(privateValue);
      expect(error).toMatchObject({
        variables: expect.arrayContaining(["AUTH_SECRET", "AUTH_EMAIL_FROM"]),
      });
    }
  });

  it("accepts an HTTPS production auth configuration", () => {
    expect(
      readAuthEnvironment({
        AUTH_SECRET: "synthetic-auth-secret-with-more-than-32-characters",
        AUTH_EMAIL_FROM: "accounts@vowora.app",
        RESEND_API_KEY: "synthetic-resend-key",
        NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
        VOWORA_ENV: "production",
      }),
    ).toMatchObject({
      AUTH_EMAIL_FROM: "accounts@vowora.app",
      NEXT_PUBLIC_APP_URL: "https://app.vowora.app",
      VOWORA_ENV: "production",
    });
  });
});
