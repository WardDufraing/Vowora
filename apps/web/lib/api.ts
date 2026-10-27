import { problemDetailsSchema, type ProblemDetails } from "@vowora/contracts";
import { randomUUID } from "node:crypto";

const acceptedCorrelationId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function correlationIdFor(request: Request): string {
  const candidate = request.headers.get("x-correlation-id");
  return candidate && acceptedCorrelationId.test(candidate)
    ? candidate.toLowerCase()
    : randomUUID();
}

export function jsonResponse<T>(body: T, correlationId: string, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-correlation-id": correlationId,
    },
  });
}

export function emptyResponse(correlationId: string, status = 204) {
  return new Response(null, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-correlation-id": correlationId,
    },
  });
}

export function problemResponse(
  request: Request,
  input: Pick<ProblemDetails, "status" | "title" | "detail" | "code">,
) {
  const correlationId = correlationIdFor(request);
  const body = problemDetailsSchema.parse({
    type: `https://vowora.app/problems/${input.code.toLowerCase().replaceAll("_", "-")}`,
    ...input,
    instance: new URL(request.url).pathname,
    correlationId,
  });
  return new Response(JSON.stringify(body), {
    status: body.status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/problem+json",
      "x-correlation-id": correlationId,
    },
  });
}

export function methodNotAllowed(request: Request) {
  const response = problemResponse(request, {
    status: 405,
    title: "Method not allowed",
    detail: "This resource does not support the requested method.",
    code: "METHOD_NOT_ALLOWED",
  });
  response.headers.set("allow", "GET, HEAD, OPTIONS");
  return response;
}

export function optionsResponse(request: Request) {
  const correlationId = correlationIdFor(request);
  return new Response(null, {
    status: 204,
    headers: {
      allow: "GET, HEAD, OPTIONS",
      "cache-control": "no-store",
      "x-correlation-id": correlationId,
    },
  });
}

export function resourceNotFound(request: Request) {
  return problemResponse(request, {
    status: 404,
    title: "Resource not found",
    detail: "The requested API resource does not exist.",
    code: "RESOURCE_NOT_FOUND",
  });
}
