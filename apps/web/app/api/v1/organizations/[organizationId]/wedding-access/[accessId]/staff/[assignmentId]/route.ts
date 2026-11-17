import { z } from "zod";

import {
  correlationIdFor,
  problemResponse,
} from "../../../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../../../lib/env";
import { removePlannerWeddingStaff } from "../../../../../../../../../lib/organization-service";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      organizationId: string;
      accessId: string;
      assignmentId: string;
    }>;
  },
) {
  const correlationId = correlationIdFor(request);
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  )
    return problemResponse(
      request,
      {
        status: 403,
        title: "Removal failed",
        detail: "The assignment could not be removed.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const params = await context.params;
  const organizationId = z.uuidv7().safeParse(params.organizationId);
  const accessId = z.uuidv7().safeParse(params.accessId);
  const assignmentId = z.uuidv7().safeParse(params.assignmentId);
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
        detail: "Sign in to remove staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success || !accessId.success || !assignmentId.success)
    return problemResponse(
      request,
      {
        status: 404,
        title: "Assignment unavailable",
        detail: "The assignment is unavailable.",
        code: "ASSIGNMENT_UNAVAILABLE",
      },
      correlationId,
    );
  try {
    await removePlannerWeddingStaff({
      actorId: session.user.id,
      correlationId,
      organizationId: organizationId.data,
      accessId: accessId.data,
      assignmentId: assignmentId.data,
    });
    return new Response(null, {
      status: 204,
      headers: { "x-correlation-id": correlationId },
    });
  } catch {
    return problemResponse(
      request,
      {
        status: 404,
        title: "Assignment unavailable",
        detail: "The assignment is unavailable.",
        code: "ASSIGNMENT_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
