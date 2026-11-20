import { updateOrganizationPrivateNoteRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../lib/env";
import {
  changeOrganizationPrivateNote,
  isPlannerPrivateUnavailable,
} from "../../../../../../../lib/organization-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organizationId: string; noteId: string }> },
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
        title: "Note failed",
        detail: "The private note could not be changed.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const session = await getAuth()
    .api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })
    .catch(() => null);
  const params = await context.params;
  const organizationId = z.uuidv7().safeParse(params.organizationId);
  const noteId = z.uuidv7().safeParse(params.noteId);
  const body = updateOrganizationPrivateNoteRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to change private notes.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success || !noteId.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Note failed",
        detail: "The private note change is invalid.",
        code: "NOTE_INVALID",
      },
      correlationId,
    );
  try {
    const data = await changeOrganizationPrivateNote({
      actorId: session.user.id,
      correlationId,
      organizationId: organizationId.data,
      noteId: noteId.data,
      request: body.data,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch (error) {
    const conflict =
      isPlannerPrivateUnavailable(error) && error.reason === "stale";
    return problemResponse(
      request,
      {
        status: conflict ? 409 : 403,
        title: "Note unavailable",
        detail: "The private note could not be changed.",
        code: conflict ? "NOTE_ARCHIVED" : "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
