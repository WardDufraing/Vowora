import { createPlanningRecordRequestSchema } from "@vowora/contracts";
import { z } from "zod";

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
  addPlanningRecord,
  authorizePlanningCreate,
  loadPlanningWorkspace,
  planningFailure,
} from "../../../../../../lib/planning-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ weddingId: string }> },
) {
  const correlationId = correlationIdFor(request);
  const weddingId = z.uuidv7().safeParse((await context.params).weddingId);
  const session = await getAuth()
    .api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })
    .catch(() => null);
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to view wedding planning.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!weddingId.success)
    return problemResponse(
      request,
      {
        status: 403,
        title: "Planning unavailable",
        detail: "The planning workspace is unavailable.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  try {
    const data = await loadPlanningWorkspace({
      actorId: session.user.id,
      weddingId: weddingId.data,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Planning unavailable",
        detail: "The planning workspace is unavailable.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ weddingId: string }> },
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
        detail: "The planning record could not be created.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const weddingId = z.uuidv7().safeParse((await context.params).weddingId);
  const body = createPlanningRecordRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!weddingId.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Invalid planning record",
        detail: "Check the planning record and try again.",
        code: "PLANNING_INVALID",
      },
      correlationId,
    );
  const authorized = await authorizePlanningCreate(
    getAuth(),
    request,
    weddingId.data,
  );
  if (!authorized.authorized) return authorized.response;
  try {
    const data = await addPlanningRecord(authorized.operation, body.data);
    return jsonResponse({ data, meta: { correlationId } }, correlationId, 201);
  } catch (error) {
    const reason = planningFailure(error);
    return problemResponse(
      request,
      {
        status: reason === "conflict" ? 409 : reason === "invalid" ? 400 : 403,
        title: "Planning change failed",
        detail:
          reason === "conflict"
            ? "A record with this value already exists."
            : "The planning record could not be created.",
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
