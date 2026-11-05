import { createWeddingRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import { correlationIdFor, problemResponse } from "../../../../lib/api";
import { getAuth, isSafeStateChangingRequest } from "../../../../lib/auth";
import { readAuthEnvironment } from "../../../../lib/env";
import {
  createWeddingWorkspace,
  isWeddingCreationAuthorizationFailure,
  isWeddingCreationConflict,
} from "../../../../lib/wedding-service";

export const dynamic = "force-dynamic";

function invalid(request: Request) {
  return problemResponse(request, {
    status: 400,
    title: "Wedding creation failed",
    detail: "Check the wedding name, date, time zone, and idempotency key.",
    code: "WEDDING_CREATION_INVALID",
  });
}

export async function POST(request: Request) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Wedding creation failed",
      detail: "The creation request could not be completed.",
      code: "CSRF_VALIDATION_FAILED",
    });
  }

  let session;
  try {
    session = await getAuth().api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    });
  } catch {
    return problemResponse(request, {
      status: 503,
      title: "Wedding creation unavailable",
      detail: "The authenticated creation request could not be completed.",
      code: "WEDDING_CREATION_UNAVAILABLE",
    });
  }
  if (!session) {
    return problemResponse(request, {
      status: 401,
      title: "Authentication required",
      detail: "A valid session is required.",
      code: "AUTHENTICATION_REQUIRED",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid(request);
  }
  const parsed = createWeddingRequestSchema.safeParse(body);
  const requestId = z.uuid().safeParse(request.headers.get("idempotency-key"));
  if (!parsed.success || !requestId.success) return invalid(request);

  try {
    const correlationId = correlationIdFor(request);
    const result = await createWeddingWorkspace({
      actorId: session.user.id,
      correlationId,
      creationRequestId: requestId.data,
      request: parsed.data,
    });
    return Response.json(
      {
        data: result.wedding,
        meta: { correlationId, replayed: result.replayed },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isWeddingCreationConflict(error)) {
      return problemResponse(request, {
        status: 409,
        title: "Idempotency key conflict",
        detail: "Use a new idempotency key for a different creation request.",
        code: "IDEMPOTENCY_KEY_CONFLICT",
      });
    }
    if (isWeddingCreationAuthorizationFailure(error)) {
      return invalid(request);
    }
    return problemResponse(request, {
      status: 503,
      title: "Wedding creation unavailable",
      detail:
        "The wedding workspace was not created. Try again safely with the same key.",
      code: "WEDDING_CREATION_UNAVAILABLE",
    });
  }
}
