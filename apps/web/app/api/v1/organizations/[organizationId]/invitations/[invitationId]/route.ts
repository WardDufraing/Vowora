import {
  correlationIdFor,
  problemResponse,
} from "../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../lib/env";
import { revokePlannerOrganizationInvitation } from "../../../../../../../lib/organization-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ organizationId: string; invitationId: string }>;
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
        title: "Invitation failed",
        detail: "The request could not be completed.",
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
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to manage invitations.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  try {
    const params = await context.params;
    const revoked = await revokePlannerOrganizationInvitation({
      actorId: session.user.id,
      correlationId,
      organizationId: params.organizationId,
      invitationId: params.invitationId,
    });
    if (!revoked) throw new Error("unavailable");
    return new Response(null, {
      status: 204,
      headers: {
        "cache-control": "no-store",
        "x-correlation-id": correlationId,
      },
    });
  } catch {
    return problemResponse(
      request,
      {
        status: 404,
        title: "Invitation unavailable",
        detail: "The invitation is unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
