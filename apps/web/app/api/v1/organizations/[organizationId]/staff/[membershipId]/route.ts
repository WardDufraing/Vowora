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
import { deactivatePlannerOrganizationMember } from "../../../../../../../lib/organization-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ organizationId: string; membershipId: string }>;
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
        title: "Staff change failed",
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
        detail: "Sign in to manage staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  try {
    const params = await context.params;
    const data = await deactivatePlannerOrganizationMember({
      actorId: session.user.id,
      correlationId,
      organizationId: params.organizationId,
      membershipId: params.membershipId,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Staff change failed",
        detail: "The requested staff change is not permitted.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
