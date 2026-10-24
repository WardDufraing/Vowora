import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  apiRootResponseSchema,
  healthResponseSchema,
  openApiDocument,
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
          links: {
            health: "/api/v1/health",
            openapi: "/api/v1/openapi.json",
          },
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

  it("generates the OpenAPI 3.1 schemas from the runtime contracts", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(Object.keys(openApiDocument.paths)).toEqual([
      "/api/v1",
      "/api/v1/health",
    ]);
    expect(openApiDocument.components.schemas.HealthResponse).toEqual(
      z.toJSONSchema(healthResponseSchema, { target: "draft-2020-12" }),
    );
    expect(JSON.parse(JSON.stringify(openApiDocument))).toEqual(
      openApiDocument,
    );
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
