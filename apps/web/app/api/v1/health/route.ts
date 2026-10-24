import { healthResponseSchema } from "@vowora/contracts";
import {
  correlationIdFor,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
} from "../../../../lib/api";

export function GET(request: Request) {
  const correlationId = correlationIdFor(request);
  const body = healthResponseSchema.parse({
    data: { service: "vowora-api", version: "v1", status: "ok" },
    meta: { correlationId },
  });
  return jsonResponse(body, correlationId);
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = optionsResponse;
