import { randomUUID } from "node:crypto";

import { organizationWeddingExitRequestSchema } from "@vowora/contracts";
import { z } from "zod";

import {
  correlationIdFor,
  jsonResponse,
  problemResponse,
} from "../../../../../../../../lib/api";
import {
  getAuth,
  isSafeStateChangingRequest,
} from "../../../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../../../lib/env";
import {
  finishOrganizationWeddingExit,
  isPlannerPrivateUnavailable,
  loadOrganizationWeddingExitPreview,
} from "../../../../../../../../lib/organization-service";

async function contextFor(
  request: Request,
  context: { params: Promise<{ organizationId: string; accessId: string }> },
) {
  const params = await context.params;
  return {
    session: await getAuth()
      .api.getSession({
        headers: request.headers,
        query: { disableCookieCache: true, disableRefresh: true },
      })
      .catch(() => null),
    organizationId: z.uuidv7().safeParse(params.organizationId),
    accessId: z.uuidv7().safeParse(params.accessId),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string; accessId: string }> },
) {
  const correlationId = correlationIdFor(request);
  const resolved = await contextFor(request, context);
  const mode = z
    .enum(["guided", "immediate"])
    .safeParse(new URL(request.url).searchParams.get("mode"));
  if (!resolved.session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to review handover.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (
    !resolved.organizationId.success ||
    !resolved.accessId.success ||
    !mode.success
  )
    return problemResponse(
      request,
      {
        status: 400,
        title: "Handover unavailable",
        detail: "The handover request is invalid.",
        code: "HANDOVER_INVALID",
      },
      correlationId,
    );
  try {
    const data = await loadOrganizationWeddingExitPreview({
      actorId: resolved.session.user.id,
      correlationId,
      organizationId: resolved.organizationId.data,
      accessId: resolved.accessId.data,
      request: { mode: mode.data, requestId: randomUUID() },
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Handover unavailable",
        detail: "The handover is unavailable.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string; accessId: string }> },
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
        title: "Handover failed",
        detail: "The exit could not be completed.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const resolved = await contextFor(request, context);
  const body = organizationWeddingExitRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!resolved.session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to complete handover.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (
    !resolved.organizationId.success ||
    !resolved.accessId.success ||
    !body.success
  )
    return problemResponse(
      request,
      {
        status: 400,
        title: "Handover failed",
        detail: "The exit request is invalid.",
        code: "HANDOVER_INVALID",
      },
      correlationId,
    );
  try {
    const result = await finishOrganizationWeddingExit({
      actorId: resolved.session.user.id,
      correlationId,
      organizationId: resolved.organizationId.data,
      accessId: resolved.accessId.data,
      request: body.data,
    });
    return jsonResponse(
      {
        data: { id: result.id, snapshot: result.snapshot },
        meta: { correlationId, replayed: result.replayed },
      },
      correlationId,
    );
  } catch (error) {
    const conflict =
      isPlannerPrivateUnavailable(error) &&
      (error.reason === "conflict" || error.reason === "stale");
    return problemResponse(
      request,
      {
        status: conflict ? 409 : 403,
        title: "Handover unavailable",
        detail: "The exit could not be completed.",
        code: conflict ? "HANDOVER_CONFLICT" : "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
