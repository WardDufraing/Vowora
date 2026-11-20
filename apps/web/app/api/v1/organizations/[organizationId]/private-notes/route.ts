import { createOrganizationPrivateNoteRequestSchema } from "@vowora/contracts";
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
  addOrganizationPrivateNote,
  loadOrganizationPrivateNotes,
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
        detail: "Sign in to view private notes.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success)
    return problemResponse(
      request,
      {
        status: 403,
        title: "Notes unavailable",
        detail: "The private notes are unavailable.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  try {
    const data = await loadOrganizationPrivateNotes({
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
        title: "Notes unavailable",
        detail: "The private notes are unavailable.",
        code: "ACCESS_DENIED",
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
        title: "Note failed",
        detail: "The private note could not be saved.",
        code: "CSRF_VALIDATION_FAILED",
      },
      correlationId,
    );
  const session = await sessionFor(request);
  const organizationId = z
    .uuidv7()
    .safeParse((await context.params).organizationId);
  const body = createOrganizationPrivateNoteRequestSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!session)
    return problemResponse(
      request,
      {
        status: 401,
        title: "Authentication required",
        detail: "Sign in to create private notes.",
        code: "AUTHENTICATION_REQUIRED",
      },
      correlationId,
    );
  if (!organizationId.success || !body.success)
    return problemResponse(
      request,
      {
        status: 400,
        title: "Note failed",
        detail: "The private note is invalid.",
        code: "NOTE_INVALID",
      },
      correlationId,
    );
  try {
    const data = await addOrganizationPrivateNote({
      actorId: session.user.id,
      correlationId,
      organizationId: organizationId.data,
      request: body.data,
    });
    return jsonResponse({ data, meta: { correlationId } }, correlationId, 201);
  } catch {
    return problemResponse(
      request,
      {
        status: 403,
        title: "Note unavailable",
        detail: "The private note could not be saved.",
        code: "ACCESS_DENIED",
      },
      correlationId,
    );
  }
}
