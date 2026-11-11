import { acceptOrganizationInvitationRequestSchema } from "@vowora/contracts";

import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../lib/env";
import { claimOrganizationInvitation } from "../../../../../../lib/organization-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
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
        title: "Invitation unavailable",
        detail: "The invitation is unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  const session = await getAuth()
    .api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })
    .catch(() => null);
  const parsed = acceptOrganizationInvitationRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to accept the invitation.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!parsed.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Invitation unavailable",
        detail: "The invitation is unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  try {
    const result = await claimOrganizationInvitation({
      actorId: session.user.id,
      correlationId,
      token: (await context.params).token,
    });
    return jsonResponse(
      {
        data: { organizationId: result.organizationId },
        meta: { correlationId, replayed: result.replayed },
      },
      correlationId,
    );
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
