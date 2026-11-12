import { z } from "zod";
import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../../../lib/api";
import { getAuth } from "../../../../../../lib/auth";
import { loadPlannerWeddingInvitations } from "../../../../../../lib/organization-service";
export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const correlationId = correlationIdFor(request);
  const id = z.uuidv7().safeParse((await context.params).organizationId);
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
        detail: "Sign in to manage wedding invitations.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!id.success)
    return problemResponse(
      request,
      {
        status: 404,
        title: "Invitations unavailable",
        detail: "Invitations are unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  try {
    return jsonResponse(
      {
        data: await loadPlannerWeddingInvitations({
          actorId: session.user.id,
          correlationId,
          organizationId: id.data,
        }),
        meta: { correlationId },
      },
      correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Invitations unavailable",
        detail: "Invitations are unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
