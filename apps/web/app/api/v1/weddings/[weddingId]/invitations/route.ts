import { createPartnerInvitationRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import { jsonResponse, problemResponse } from "../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../lib/env";
import {
  createPartnerInvitation,
  isWeddingInvitationConflict,
  partnerInvitationCorrelationId,
} from "../../../../../../lib/wedding-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ weddingId: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Invitation failed",
      detail: "The invitation request could not be completed.",
      code: "CSRF_VALIDATION_FAILED",
    });
  }
  const weddingId = z.uuidv7().safeParse((await context.params).weddingId);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  const parsed = createPartnerInvitationRequestSchema.safeParse(body);
  if (!weddingId.success || !parsed.success) {
    return problemResponse(request, {
      status: 400,
      title: "Invitation failed",
      detail: "Enter a valid partner email address.",
      code: "INVITATION_INVALID",
    });
  }
  try {
    const result = await createPartnerInvitation({
      auth: getAuth(),
      email: parsed.data.email,
      request,
      weddingId: weddingId.data,
    });
    if (!result.authorized) return result.response;
    const { invitation, token } = result.result;
    return jsonResponse(
      {
        data: { ...invitation, acceptancePath: `/invitations/${token}` },
        meta: { correlationId: result.correlationId },
      },
      result.correlationId,
      201,
    );
  } catch (error) {
    const correlationId = partnerInvitationCorrelationId(error);
    if (isWeddingInvitationConflict(error)) {
      return problemResponse(
        request,
        {
          status: 409,
          title: "Partner invitation unavailable",
          detail:
            "A second partner or pending partner invitation already exists.",
          code: "PARTNER_INVITATION_CONFLICT",
        },
        correlationId,
      );
    }
    return problemResponse(
      request,
      {
        status: 503,
        title: "Invitation unavailable",
        detail: "The partner invitation was not created.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
