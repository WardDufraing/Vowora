import { updatePlanningRecordRequestSchema } from "@vowora/contracts";
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
import {
  authorizePlanningUpdate,
  changePlanningRecord,
  planningFailure,
} from "../../../../../../../lib/planning-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ weddingId: string; recordId: string }> },
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
        title: "Planning change failed",
        detail: "The planning record could not be updated.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const params = await context.params;
  const weddingId = z.uuidv7().safeParse(params.weddingId);
  const recordId = z.uuidv7().safeParse(params.recordId);
  const body = updatePlanningRecordRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!weddingId.success || !recordId.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Invalid planning change",
        detail: "Check the planning record and try again.",
        code: "PLANNING_INVALID",
      },
      correlationId,
    );
  const authorized = await authorizePlanningUpdate(
    getAuth(),
    request,
    weddingId.data,
    recordId.data,
  );
  if (!authorized.authorized) return authorized.response;
  try {
    const data = await changePlanningRecord(
      authorized.operation,
      recordId.data,
      body.data,
    );
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch (error) {
    const reason = planningFailure(error);
    return problemResponse(
      request,
      {
        status: reason === "conflict" ? 409 : reason === "invalid" ? 400 : 403,
        title:
          reason === "conflict"
            ? "Planning record changed"
            : "Planning change failed",
        detail:
          reason === "conflict"
            ? "Reload the latest record before saving again."
            : "The planning record could not be updated.",
        code:
          reason === "conflict"
            ? "PLANNING_CONFLICT"
            : reason === "invalid"
              ? "PLANNING_INVALID"
              : "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
