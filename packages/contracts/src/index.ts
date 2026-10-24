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

const problemResponse = (description: string) => ({
  description,
  content: {
    "application/problem+json": {
      schema: { $ref: "#/components/schemas/ProblemDetails" },
    },
  },
});

const methodNotAllowedOperation = (operationId: string) => ({
  operationId,
  responses: {
    "405": { $ref: "#/components/responses/MethodNotAllowed" },
  },
});

const notFoundOperation = (operationId: string) => ({
  operationId,
  responses: {
    "404": { $ref: "#/components/responses/ResourceNotFound" },
  },
});

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
      post: methodNotAllowedOperation("rejectApiRootPost"),
      put: methodNotAllowedOperation("rejectApiRootPut"),
      patch: methodNotAllowedOperation("rejectApiRootPatch"),
      delete: methodNotAllowedOperation("rejectApiRootDelete"),
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
      post: methodNotAllowedOperation("rejectHealthPost"),
      put: methodNotAllowedOperation("rejectHealthPut"),
      patch: methodNotAllowedOperation("rejectHealthPatch"),
      delete: methodNotAllowedOperation("rejectHealthDelete"),
    },
    "/api/v1/{path}": {
      parameters: [
        {
          name: "path",
          in: "path",
          required: true,
          description: "Unknown path below the versioned API root.",
          schema: { type: "string" },
        },
      ],
      get: notFoundOperation("getUnknownApiResource"),
      head: notFoundOperation("headUnknownApiResource"),
      post: notFoundOperation("postUnknownApiResource"),
      put: notFoundOperation("putUnknownApiResource"),
      patch: notFoundOperation("patchUnknownApiResource"),
      delete: notFoundOperation("deleteUnknownApiResource"),
      options: notFoundOperation("optionsUnknownApiResource"),
    },
  },
  components: {
    responses: {
      ResourceNotFound: problemResponse(
        "The requested versioned API resource does not exist.",
      ),
      MethodNotAllowed: {
        ...problemResponse("The resource does not support this HTTP method."),
        headers: {
          Allow: {
            description: "Methods supported by the resource.",
            schema: { type: "string", example: "GET, HEAD, OPTIONS" },
          },
        },
      },
    },
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
