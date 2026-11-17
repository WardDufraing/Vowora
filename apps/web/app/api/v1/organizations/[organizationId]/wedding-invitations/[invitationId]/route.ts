import { respondWeddingOrganizationInvitationRequestSchema } from "@vowora/contracts";
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
import { respondToPlannerWeddingInvitation } from "../../../../../../../lib/organization-service";
export async function PATCH(
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
        title: "Response failed",
        detail: "The response could not be saved.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const p = await context.params,
    o = z.uuidv7().safeParse(p.organizationId),
    i = z.uuidv7().safeParse(p.invitationId),
    body = respondWeddingOrganizationInvitationRequestSchema.safeParse(
      await request.json().catch(() => undefined),
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
        detail: "Sign in to respond.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!o.success || !i.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Response failed",
        detail: "The response is invalid.",
        code: "RESPONSE_INVALID",
      },
      correlationId,
    );
  try {
    return jsonResponse(
      {
        data: await respondToPlannerWeddingInvitation({
          actorId: session.user.id,
          correlationId,
          organizationId: o.data,
          invitationId: i.data,
          decision: body.data.decision,
        }),
        meta: { correlationId },
      },
      correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 409,
        title: "Invitation unavailable",
        detail: "The invitation is unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
