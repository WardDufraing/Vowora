import { describe, expect, it } from "vitest";

import { authSessionIdentity, isSafeStateChangingRequest } from "./auth";

const baseURL = "https://app.vowora.test";

function request(method: string, headers?: HeadersInit) {
  return new Request(`${baseURL}/api/v1/auth/sign-in/email`, {
    method,
    headers,
  });
}

describe("authentication CSRF boundary", () => {
  it("allows safe reads and exact same-origin state changes", () => {
    expect(isSafeStateChangingRequest(request("GET"), baseURL)).toBe(true);
    expect(
      isSafeStateChangingRequest(
        request("POST", { origin: baseURL, "sec-fetch-site": "same-origin" }),
        baseURL,
      ),
    ).toBe(true);
  });

  it("rejects absent, malformed, cross-origin, and cross-site origins", () => {
    expect(isSafeStateChangingRequest(request("POST"), baseURL)).toBe(false);
    expect(
      isSafeStateChangingRequest(
        request("POST", { origin: "not a URL" }),
        baseURL,
      ),
    ).toBe(false);
    expect(
      isSafeStateChangingRequest(
        request("DELETE", { origin: "https://attacker.example" }),
        baseURL,
      ),
    ).toBe(false);
    expect(
      isSafeStateChangingRequest(
        request("POST", { origin: baseURL, "sec-fetch-site": "cross-site" }),
        baseURL,
      ),
    ).toBe(false);
  });
});

describe("session abuse identity", () => {
  it("uses only the bounded Better Auth session token", () => {
    expect(
      authSessionIdentity(
        request("DELETE", {
          cookie:
            "theme=dark; __Secure-vowora.session_token=opaque.token=value; locale=en",
        }),
      ),
    ).toBe("session:opaque.token=value");
    expect(
      authSessionIdentity(request("DELETE", { cookie: "theme=dark" })),
    ).toBe("session:anonymous");
  });
});
