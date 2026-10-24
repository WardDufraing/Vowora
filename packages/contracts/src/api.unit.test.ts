import { describe, expect, it } from "vitest";
import {
  apiRootResponseSchema,
  healthResponseSchema,
  problemDetailsSchema,
} from "./index.js";

const correlationId = "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2";

describe("API contracts", () => {
  it("accepts the stable v1 root and health envelopes", () => {
    expect(
      apiRootResponseSchema.parse({
        data: {
          name: "Vowora API",
          version: "v1",
          status: "ok",
          links: { health: "/api/v1/health" },
        },
        meta: { correlationId },
      }),
    ).toBeTruthy();
    expect(
      healthResponseSchema.parse({
        data: { service: "vowora-api", version: "v1", status: "ok" },
        meta: { correlationId },
      }),
    ).toBeTruthy();
  });

  it("rejects extra response fields and unsafe problem shapes", () => {
    expect(() =>
      healthResponseSchema.parse({
        data: {
          service: "vowora-api",
          version: "v1",
          status: "ok",
          databaseUrl: "secret",
        },
        meta: { correlationId },
      }),
    ).toThrow();
    expect(() =>
      problemDetailsSchema.parse({
        type: "not a URL",
        title: "Missing",
        status: 404,
        detail: "Missing",
        instance: "/api/v1/missing",
        code: "not-stable",
        correlationId,
      }),
    ).toThrow();
  });
});
