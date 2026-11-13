import { z } from "zod";
import { problemResponse } from "../../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../../lib/env";
import {
  authorizeWeddingSettingsApiOperation,
  revokePlannerOrganizationInvitation,
} from "../../../../../../../../lib/wedding-service";
export async function DELETE(
  request: Request,
  context: { params: Promise<{ weddingId: string; invitationId: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  )
    return problemResponse(request, {
      status: 403,
      title: "Revocation failed",
      detail: "The invitation could not be revoked.",
      code: "CSRF_VALIDATION_FAILED",
    });
  const p = await context.params;
  const w = z.uuidv7().safeParse(p.weddingId),
    i = z.uuidv7().safeParse(p.invitationId);
  if (!w.success || !i.success)
    return problemResponse(request, {
      status: 404,
      title: "Invitation unavailable",
      detail: "The invitation is unavailable.",
      code: "INVITATION_UNAVAILABLE",
    });
  const a = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    w.data,
  );
  if (!a.authorized) return a.response;
  return (await revokePlannerOrganizationInvitation(a.operation, i.data))
    ? new Response(null, { status: 204 })
    : problemResponse(
        request,
        {
          status: 404,
          title: "Invitation unavailable",
          detail: "The invitation is unavailable.",
          code: "INVITATION_UNAVAILABLE",
        },
        a.operation.authorization.correlationId,
      );
}
