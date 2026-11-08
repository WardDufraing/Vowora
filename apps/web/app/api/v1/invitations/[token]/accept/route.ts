import { acceptPartnerInvitationRequestSchema } from "@vowora/contracts";

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
import {
  claimPartnerInvitation,
  isWeddingInvitationConflict,
  weddingInvitationUnavailableReason,
} from "../../../../../../lib/wedding-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Invitation acceptance failed",
      detail: "The invitation could not be accepted.",
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
      title: "Invitation unavailable",
      detail: "The invitation could not be accepted.",
      code: "INVITATION_UNAVAILABLE",
    });
  }
  if (!session) {
    return problemResponse(request, {
      status: 401,
      title: "Authentication required",
      detail: "Sign in with the invited and verified email address.",
      code: "AUTHENTICATION_REQUIRED",
    });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  if (!acceptPartnerInvitationRequestSchema.safeParse(body).success) {
    return problemResponse(request, {
      status: 400,
      title: "Explicit acceptance required",
      detail: "Confirm that you want to join this wedding.",
      code: "INVITATION_ACCEPTANCE_REQUIRED",
    });
  }
  const token = (await context.params).token;
  const correlationId = correlationIdFor(request);
  try {
    const result = await claimPartnerInvitation({
      actorId: session.user.id,
      correlationId,
      token,
    });
    return jsonResponse(
      {
        data: { weddingId: result.weddingId },
        meta: { correlationId, replayed: result.replayed },
      },
      correlationId,
    );
  } catch (error) {
    if (isWeddingInvitationConflict(error)) {
      return problemResponse(
        request,
        {
          status: 409,
          title: "Invitation unavailable",
          detail: "This wedding already has both partners.",
          code: "PARTNER_INVITATION_CONFLICT",
        },
        correlationId,
      );
    }
    const reason = weddingInvitationUnavailableReason(error);
    if (reason === "expired") {
      return problemResponse(
        request,
        {
          status: 410,
          title: "Invitation expired",
          detail: "Ask an existing partner for a replacement invitation.",
          code: "INVITATION_EXPIRED",
        },
        correlationId,
      );
    }
    if (reason === "email_unverified") {
      return problemResponse(
        request,
        {
          status: 403,
          title: "Email verification required",
          detail: "Verify the invited email address before accepting.",
          code: "EMAIL_VERIFICATION_REQUIRED",
        },
        correlationId,
      );
    }
    return problemResponse(
      request,
      {
        status: 404,
        title: "Invitation unavailable",
        detail: "This invitation cannot be used with the signed-in account.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
