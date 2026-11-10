import { createOrganizationInvitationRequestSchema } from "@vowora/contracts";
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
  createOrganizationStaffInvitation,
  isOrganizationConflict,
  loadOrganizationInvitations,
} from "../../../../../../lib/organization-service";

export const dynamic = "force-dynamic";

async function sessionFor(request: Request) {
  return getAuth()
    .api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })
    .catch(() => null);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const correlationId = correlationIdFor(request);
  const session = await sessionFor(request);
  const organizationId = z
    .uuidv7()
    .safeParse((await context.params).organizationId);
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to manage invitations.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success)
    return problemResponse(
      request,
      {
        status: 404,
        title: "Invitations unavailable",
        detail: "The invitations are unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  try {
    const data = await loadOrganizationInvitations({
      actorId: session.user.id,
      correlationId,
      organizationId: organizationId.data,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Invitations unavailable",
        detail: "The invitations are unavailable.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
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
        title: "Invitation failed",
        detail: "The invitation request could not be completed.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const session = await sessionFor(request);
  const organizationId = z
    .uuidv7()
    .safeParse((await context.params).organizationId);
  const parsed = createOrganizationInvitationRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to invite staff.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success || !parsed.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Invitation failed",
        detail: "Enter a valid email address and role.",
        code: "INVITATION_INVALID",
      },
      correlationId,
    );
  try {
    const { invitation, token } = await createOrganizationStaffInvitation({
      actorId: session.user.id,
      correlationId,
      organizationId: organizationId.data,
      request: parsed.data,
    });
    return jsonResponse(
      {
        data: {
          ...invitation,
          acceptancePath: `/organization-invitations/${token}?locale=${parsed.data.locale}`,
        },
        meta: { correlationId },
      },
      correlationId,
      201,
    );
  } catch (error) {
    return problemResponse(
      request,
      {
        status: isOrganizationConflict(error) ? 409 : 403,
        title: "Invitation unavailable",
        detail: "The invitation could not be created.",
        code: "INVITATION_UNAVAILABLE",
      },
      correlationId,
    );
  }
}
