import { restrictWeddingOrganizationStaffRequestSchema } from "@vowora/contracts";
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
  authorizeWeddingSettingsApiOperation,
  changePlannerStaffRestriction,
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
      title: "Restriction failed",
      detail: "The restriction could not be changed.",
      code: "CSRF_VALIDATION_FAILED",
    });
  const p = await context.params,
    w = z.uuidv7().safeParse(p.weddingId),
    a = z.uuidv7().safeParse(p.accessId),
    body = restrictWeddingOrganizationStaffRequestSchema.safeParse(
      await request.json().catch(() => undefined),
    );
  if (!w.success || !a.success || !body.success)
    return problemResponse(request, {
      status: 400,
      title: "Restriction failed",
      detail: "The restriction is invalid.",
      code: "RESTRICTION_INVALID",
    });
  const op = await authorizeWeddingSettingsApiOperation(
    getAuth(),
    request,
    w.data,
  );
  if (!op.authorized) return op.response;
  try {
    await changePlannerStaffRestriction(op.operation, {
      accessId: a.data,
      ...body.data,
    });
    return jsonResponse(
      {
        data: { blocked: body.data.blocked },
        meta: { correlationId: op.operation.authorization.correlationId },
      },
      op.operation.authorization.correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 404,
        title: "Restriction unavailable",
        detail: "The restriction is unavailable.",
        code: "RESTRICTION_UNAVAILABLE",
      },
      op.operation.authorization.correlationId,
    );
  }
}
