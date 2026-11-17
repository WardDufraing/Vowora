import { createWeddingOrganizationInvitationRequestSchema } from "@vowora/contracts";
import { z } from "zod";
import { jsonResponse, problemResponse } from "../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../lib/env";
import {
  authorizeWeddingSettingsApiOperation,
  createPlannerOrganizationInvitation,
  loadPlannerOrganizationInvitations,
} from "../../../../../../../lib/wedding-service";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ weddingId: string }> },
) {
  const id = z.uuidv7().safeParse((await context.params).weddingId);
  if (!id.success)
    return problemResponse(request, {
      status: 404,
      title: "Planner access unavailable",
      detail: "Planner access is unavailable.",
      code: "PLANNER_ACCESS_UNAVAILABLE",
    });
  const authorized = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    id.data,
  );
  if (!authorized.authorized) return authorized.response;
  const correlationId = authorized.operation.authorization.correlationId;
  try {
    return jsonResponse(
      {
        data: (
          await loadPlannerOrganizationInvitations(authorized.operation)
        ).map(({ invitation, organizationName }) => ({
          ...invitation,
          organizationName,
        })),
        meta: { correlationId },
      },
      correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 503,
        title: "Planner access unavailable",
        detail: "Planner access could not be loaded.",
        code: "PLANNER_ACCESS_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
export async function POST(
  request: Request,
  context: { params: Promise<{ weddingId: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  )
    return problemResponse(request, {
      status: 403,
      title: "Invitation failed",
      detail: "The invitation could not be created.",
      code: "CSRF_VALIDATION_FAILED",
    });
  const id = z.uuidv7().safeParse((await context.params).weddingId);
  const key = z.uuid().safeParse(request.headers.get("idempotency-key"));
  const body = createWeddingOrganizationInvitationRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!id.success || !key.success || !body.success)
    return problemResponse(request, {
      status: 400,
      title: "Invitation failed",
      detail: "Select an organization and valid permission ceiling.",
      code: "INVITATION_INVALID",
    });
  try {
    const result = await createPlannerOrganizationInvitation({
      auth: getAuth(),
      request,
      weddingId: id.data,
      issuanceRequestId: key.data,
      body: body.data,
    });
    if (!result.authorized) return result.response;
    return jsonResponse(
      {
        data: {
          ...result.result.invitation,
          organizationName: result.result.organizationName,
        },
        meta: {
          correlationId: result.correlationId,
          replayed: result.result.replayed,
        },
      },
      result.correlationId,
      result.result.replayed ? 200 : 201,
    );
  } catch {
    return problemResponse(request, {
      status: 409,
      title: "Invitation unavailable",
      detail: "The organization invitation conflicts with current access.",
      code: "ORGANIZATION_INVITATION_CONFLICT",
    });
  }
}
