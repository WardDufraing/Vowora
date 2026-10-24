import { apiRootResponseSchema } from "@vowora/contracts";
import {
  correlationIdFor,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
} from "../../../lib/api";

export function GET(request: Request) {
  const correlationId = correlationIdFor(request);
  const body = apiRootResponseSchema.parse({
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
  });
  return jsonResponse(body, correlationId);
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = optionsResponse;
