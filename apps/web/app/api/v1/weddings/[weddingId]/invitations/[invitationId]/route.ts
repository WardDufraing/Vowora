import { z } from "zod";

import { emptyResponse, problemResponse } from "../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../lib/env";
import {
  authorizeWeddingSettingsApiOperation,
  revokeWeddingPartnerInvitation,
} from "../../../../../../../lib/wedding-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ weddingId: string; invitationId: string }>;
  },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Invitation revocation failed",
      detail: "The invitation could not be revoked.",
      code: "CSRF_VALIDATION_FAILED",
    });
  }
  const params = await context.params;
  const weddingId = z.uuidv7().safeParse(params.weddingId);
  const invitationId = z.uuidv7().safeParse(params.invitationId);
  if (!weddingId.success || !invitationId.success) {
    return problemResponse(request, {
      status: 404,
      title: "Invitation unavailable",
      detail: "The invitation is unavailable.",
      code: "INVITATION_UNAVAILABLE",
    });
  }
  const authorized = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    weddingId.data,
  );
  if (!authorized.authorized) return authorized.response;
  const correlationId = authorized.operation.authorization.correlationId;
  try {
    const revoked = await revokeWeddingPartnerInvitation(
      authorized.operation,
      invitationId.data,
    );
    if (!revoked) {
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
    return emptyResponse(correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 503,
        title: "Invitation revocation unavailable",
        detail: "The invitation was not revoked.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
