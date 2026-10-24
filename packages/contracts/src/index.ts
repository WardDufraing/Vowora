import { z } from "zod";

export const correlationIdSchema = z.uuid().describe("Request correlation ID");

export const responseMetadataSchema = z
  .object({ correlationId: correlationIdSchema })
  .strict();

export const apiRootResponseSchema = z
  .object({
    data: z
      .object({
        name: z.literal("Vowora API"),
        version: z.literal("v1"),
        status: z.literal("ok"),
        links: z
          .object({
            health: z.literal("/api/v1/health"),
            openapi: z.literal("/api/v1/openapi.json"),
          })
          .strict(),
      })
      .strict(),
    meta: responseMetadataSchema,
  })
  .strict()
  .describe("API v1 root response");

export const healthResponseSchema = z
  .object({
    data: z
      .object({
        service: z.literal("vowora-api"),
        version: z.literal("v1"),
        status: z.literal("ok"),
      })
      .strict(),
    meta: responseMetadataSchema,
  })
  .strict()
  .describe("API v1 liveness response");

export const problemDetailsSchema = z
  .object({
    type: z.url(),
    title: z.string().min(1),
    status: z.int().min(400).max(599),
    detail: z.string().min(1),
    instance: z.string().startsWith("/"),
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    correlationId: correlationIdSchema,
  })
  .strict()
  .describe("RFC 9457 Problem Details response");

export type ApiRootResponse = z.infer<typeof apiRootResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Vowora API",
    version: "1.0.0",
    description: "Versioned public contract for the Vowora application API.",
  },
  paths: {
    "/api/v1": {
      get: {
        operationId: "getApiRoot",
        responses: {
          "200": {
            description: "API discovery response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiRootResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/health": {
      get: {
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Application liveness response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ApiRootResponse: z.toJSONSchema(apiRootResponseSchema, {
        target: "draft-2020-12",
      }),
      HealthResponse: z.toJSONSchema(healthResponseSchema, {
        target: "draft-2020-12",
      }),
      ProblemDetails: z.toJSONSchema(problemDetailsSchema, {
        target: "draft-2020-12",
      }),
    },
  },
} as const;
