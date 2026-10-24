import { openApiDocument } from "@vowora/contracts";
import {
  correlationIdFor,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
} from "../../../../lib/api";

export function GET(request: Request) {
  const correlationId = correlationIdFor(request);
  return jsonResponse(openApiDocument, correlationId);
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = optionsResponse;
