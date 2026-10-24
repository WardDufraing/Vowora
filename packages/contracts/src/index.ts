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
        links: z.object({ health: z.literal("/api/v1/health") }).strict(),
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
