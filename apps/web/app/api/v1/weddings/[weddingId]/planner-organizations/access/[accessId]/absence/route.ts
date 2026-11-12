import { updateLeadPlannerAbsenceRequestSchema } from "@vowora/contracts";
import { z } from "zod";
import {
  jsonResponse,
  problemResponse,
} from "../../../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../../../lib/env";
import {
  authorizeLeadAbsenceApiOperation,
  changeLeadPlannerAbsence,
} from "../../../../../../../../../lib/wedding-service";
export async function PATCH(
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
      title: "Absence failed",
      detail: "Absence could not be changed.",
      code: "CSRF_VALIDATION_FAILED",
    });
  const p = await context.params,
    w = z.uuidv7().safeParse(p.weddingId),
    a = z.uuidv7().safeParse(p.accessId),
    body = updateLeadPlannerAbsenceRequestSchema.safeParse(
      await request.json().catch(() => undefined),
    );
  if (!w.success || !a.success || !body.success)
    return problemResponse(request, {
      status: 400,
      title: "Absence failed",
      detail: "Enter a valid absence window.",
      code: "ABSENCE_INVALID",
    });
  const op = await authorizeLeadAbsenceApiOperation(getAuth(), request, w.data);
  if (!op.authorized) return op.response;
  try {
    await changeLeadPlannerAbsence(op.operation, {
      accessId: a.data,
      startsAt: body.data.startsAt ? new Date(body.data.startsAt) : null,
      endsAt: body.data.endsAt ? new Date(body.data.endsAt) : null,
    });
    return jsonResponse(
      {
        data: { updated: true },
        meta: { correlationId: op.operation.authorization.correlationId },
      },
      op.operation.authorization.correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Absence unavailable",
        detail: "Only the active lead may change this absence.",
        code: "ABSENCE_UNAVAILABLE",
      },
      op.operation.authorization.correlationId,
    );
  }
}
