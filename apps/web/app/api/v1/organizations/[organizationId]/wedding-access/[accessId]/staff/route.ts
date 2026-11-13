import { assignWeddingOrganizationStaffRequestSchema } from "@vowora/contracts";
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
  assignPlannerWeddingStaff,
  loadPlannerWeddingAccesses,
} from "../../../../../../../../lib/organization-service";
export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string; accessId: string }> },
) {
  const correlationId = correlationIdFor(request);
  const p = await context.params;
  const organizationId = z.uuidv7().safeParse(p.organizationId);
  const accessId = z.uuidv7().safeParse(p.accessId);
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
        detail: "Sign in to view staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success || !accessId.success)
    return problemResponse(
      request,
      {
        status: 404,
        title: "Access unavailable",
        detail: "Planner access is unavailable.",
        code: "PLANNER_ACCESS_UNAVAILABLE",
      },
      correlationId,
    );
  try {
    const access = (
      await loadPlannerWeddingAccesses({
        actorId: session.user.id,
        correlationId,
        organizationId: organizationId.data,
      })
    ).find((item) => item.id === accessId.data);
    if (!access) throw new Error();
    return jsonResponse(
      { data: access, meta: { correlationId } },
      correlationId,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 404,
        title: "Access unavailable",
        detail: "Planner access is unavailable.",
        code: "PLANNER_ACCESS_UNAVAILABLE",
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
        title: "Assignment failed",
        detail: "The assignment could not be saved.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const p = await context.params,
    o = z.uuidv7().safeParse(p.organizationId),
    a = z.uuidv7().safeParse(p.accessId),
    body = assignWeddingOrganizationStaffRequestSchema.safeParse(
      await request.json().catch(() => undefined),
    );
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
        detail: "Sign in to assign staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!o.success || !a.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Assignment failed",
        detail: "The assignment is invalid.",
        code: "ASSIGNMENT_INVALID",
      },
      correlationId,
    );
  try {
    return jsonResponse(
      {
        data: await assignPlannerWeddingStaff({
          actorId: session.user.id,
          correlationId,
          organizationId: o.data,
          accessId: a.data,
          request: body.data,
        }),
        meta: { correlationId },
      },
      correlationId,
      201,
    );
  } catch {
    return problemResponse(
      request,
      {
        status: 409,
        title: "Assignment unavailable",
        detail: "The staff member is not eligible.",
        code: "ASSIGNMENT_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
