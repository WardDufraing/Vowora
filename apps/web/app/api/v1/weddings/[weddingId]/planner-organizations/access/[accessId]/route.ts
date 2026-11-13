import { z } from "zod";
import { jsonResponse, problemResponse } from "../../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../../lib/env";
import {
  authorizeWeddingSettingsApiOperation,
  loadPlannerOrganizationAccess,
  revokePlannerOrganizationRelationship,
} from "../../../../../../../../lib/wedding-service";
export async function GET(
  request: Request,
  context: { params: Promise<{ weddingId: string; accessId: string }> },
) {
  const p = await context.params,
    w = z.uuidv7().safeParse(p.weddingId),
    a = z.uuidv7().safeParse(p.accessId);
  if (!w.success || !a.success)
    return problemResponse(request, {
      status: 404,
      title: "Planner access unavailable",
      detail: "Planner access is unavailable.",
      code: "PLANNER_ACCESS_UNAVAILABLE",
    });
  const op = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    w.data,
  );
  if (!op.authorized) return op.response;
  try {
    const access = await loadPlannerOrganizationAccess(op.operation);
    if (!access || access.id !== a.data) throw new Error();
    return jsonResponse(
      {
        data: access,
        meta: { correlationId: op.operation.authorization.correlationId },
      },
      op.operation.authorization.correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 404,
        title: "Planner access unavailable",
        detail: "Planner access is unavailable.",
        code: "PLANNER_ACCESS_UNAVAILABLE",
      },
      op.operation.authorization.correlationId,
    );
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ weddingId: string; accessId: string }> },
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
      detail: "Planner access could not be revoked.",
      code: "CSRF_VALIDATION_FAILED",
    });
  const p = await context.params,
    w = z.uuidv7().safeParse(p.weddingId),
    a = z.uuidv7().safeParse(p.accessId);
  if (!w.success || !a.success)
    return problemResponse(request, {
      status: 404,
      title: "Planner access unavailable",
      detail: "Planner access is unavailable.",
      code: "PLANNER_ACCESS_UNAVAILABLE",
    });
  const op = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    w.data,
  );
  if (!op.authorized) return op.response;
  return (await revokePlannerOrganizationRelationship(op.operation, a.data))
    ? new Response(null, { status: 204 })
    : problemResponse(
        request,
        {
          status: 404,
          title: "Planner access unavailable",
          detail: "Planner access is unavailable.",
          code: "PLANNER_ACCESS_UNAVAILABLE",
        },
        op.operation.authorization.correlationId,
      );
}
