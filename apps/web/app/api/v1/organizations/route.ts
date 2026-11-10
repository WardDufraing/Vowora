import { createOrganizationRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../lib/api";
import { getAuth, isSafeStateChangingRequest } from "../../../../lib/auth";
import { readAuthEnvironment } from "../../../../lib/env";
import {
  createPlannerOrganization,
  isOrganizationAuthorizationFailure,
  isOrganizationConflict,
} from "../../../../lib/organization-service";

export const dynamic = "force-dynamic";
const idempotencyKeySchema = z.uuid();

export async function POST(request: Request) {
  const correlationId = correlationIdFor(request);
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Organization creation failed",
        detail: "The request could not be completed.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  }
  const session = await getAuth()
    .api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })
    .catch(() => null);
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to create an organization.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!session.user.emailVerified)
    return problemResponse(
      request,
      {
        status: 403,
        title: "Verified email required",
        detail: "Verify your email before creating an organization.",
        code: "VERIFIED_EMAIL_REQUIRED",
      },
      correlationId,
    );
  const key = idempotencyKeySchema.safeParse(
    request.headers.get("idempotency-key"),
  );
  const parsed = createOrganizationRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!key.success || !parsed.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Organization creation failed",
        detail: "Check the organization name and idempotency key.",
        code: "ORGANIZATION_CREATION_INVALID",
      },
      correlationId,
    );
  try {
    const result = await createPlannerOrganization({
      actorId: session.user.id,
      correlationId,
      creationRequestId: key.data,
      request: parsed.data,
    });
    return jsonResponse(
      {
        data: result.organization,
        meta: { correlationId, replayed: result.replayed },
      },
      correlationId,
      201,
    );
  } catch (error) {
    if (isOrganizationConflict(error))
      return problemResponse(
        request,
        {
          status: 409,
          title: "Idempotency key conflict",
          detail: "Use a new key for a different request.",
          code: "IDEMPOTENCY_KEY_CONFLICT",
        },
        correlationId,
      );
    if (isOrganizationAuthorizationFailure(error))
      return problemResponse(
        request,
        {
          status: 403,
          title: "Verified email required",
          detail: "Verify your email before creating an organization.",
          code: "VERIFIED_EMAIL_REQUIRED",
        },
        correlationId,
      );
    return problemResponse(
      request,
      {
        status: 503,
        title: "Organization creation unavailable",
        detail: "Try again safely with the same key.",
        code: "ORGANIZATION_CREATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
