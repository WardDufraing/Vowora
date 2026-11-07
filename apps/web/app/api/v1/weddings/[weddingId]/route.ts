import { updateWeddingSettingsRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import { jsonResponse, problemResponse } from "../../../../../lib/api";
import { getAuth, isSafeStateChangingRequest } from "../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../lib/env";
import {
  authorizeWeddingSettingsApiOperation,
  isWeddingSettingsConflict,
  updateWeddingWorkspace,
} from "../../../../../lib/wedding-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { readonly params: Promise<{ readonly weddingId: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return problemResponse(request, {
      status: 403,
      title: "Settings update failed",
      detail: "The settings request could not be completed.",
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
  const patch = updateWeddingSettingsRequestSchema.safeParse(body);
  if (!weddingId.success || !patch.success) {
    return problemResponse(request, {
      status: 400,
      title: "Settings update failed",
      detail: "Check the wedding name, date, time zone, and version.",
      code: "WEDDING_SETTINGS_INVALID",
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
    const updated = await updateWeddingWorkspace(
      authorized.operation,
      patch.data,
    );
    return jsonResponse(
      { data: updated, meta: { correlationId } },
      correlationId,
    );
  } catch (error) {
    if (isWeddingSettingsConflict(error)) {
      return problemResponse(
        request,
        {
          status: 409,
          title: "Settings changed",
          detail: "Reload the latest settings before saving again.",
          code: "WEDDING_SETTINGS_CONFLICT",
        },
        correlationId,
      );
    }
    return problemResponse(
      request,
      {
        status: 503,
        title: "Settings update unavailable",
        detail: "The settings were not changed.",
        code: "WEDDING_SETTINGS_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
