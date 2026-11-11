import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../../../lib/api";
import { getAuth } from "../../../../../../lib/auth";
import { loadOrganizationStaff } from "../../../../../../lib/organization-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const correlationId = correlationIdFor(request);
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
        detail: "Sign in to view staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  try {
    const data = await loadOrganizationStaff({
      actorId: session.user.id,
      correlationId,
      organizationId: (await context.params).organizationId,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Access denied",
        detail: "The requested organization is unavailable.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
