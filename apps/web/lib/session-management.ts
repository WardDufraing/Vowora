import { z } from "zod";
import { accountSessionsResponseSchema } from "@vowora/contracts";
import { APIError } from "better-auth";

import {
  correlationIdFor,
  emptyResponse,
  jsonResponse,
  problemResponse,
} from "./api";
import type { createVoworaAuth } from "./auth";

type VoworaAuth = ReturnType<typeof createVoworaAuth>;

const sessionIdSchema = z.uuidv7();
const sensitiveFreshAgeMs = 15 * 60 * 1000;

function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "Mobile browser";
  return "Desktop browser";
}

function unauthorized(request: Request) {
  return problemResponse(request, {
    status: 401,
    title: "Authentication required",
    detail: "A valid session is required.",
    code: "AUTHENTICATION_REQUIRED",
  });
}

function forbidden(request: Request) {
  return problemResponse(request, {
    status: 403,
    title: "Recent authentication required",
    detail: "Sign in again before managing account security.",
    code: "RECENT_AUTHENTICATION_REQUIRED",
  });
}

function sessionFailure(request: Request, error: unknown) {
  if (error instanceof APIError) {
    if (error.statusCode === 401) return unauthorized(request);
    if (error.statusCode === 403) return forbidden(request);
  }
  return problemResponse(request, {
    status: 500,
    title: "Session service unavailable",
    detail: "The session request could not be completed.",
    code: "SESSION_SERVICE_FAILURE",
  });
}

export async function requireSensitiveSession(
  auth: VoworaAuth,
  headers: Headers,
  now = new Date(),
) {
  const current = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!current) return null;
  if (
    now.getTime() - new Date(current.session.createdAt).getTime() >=
    sensitiveFreshAgeMs
  ) {
    return { stale: true as const, current };
  }
  return { stale: false as const, current };
}

export async function listAccountSessions(
  auth: VoworaAuth,
  request: Request,
): Promise<Response> {
  try {
    const sensitive = await requireSensitiveSession(auth, request.headers);
    if (!sensitive) return unauthorized(request);
    if (sensitive.stale) return forbidden(request);
    const sessions = await auth.api.listSessions({ headers: request.headers });
    const correlationId = correlationIdFor(request);
    return jsonResponse(
      accountSessionsResponseSchema.parse({
        data: sessions.map((entry) => ({
          id: entry.id,
          current: entry.id === sensitive.current.session.id,
          device: deviceLabel(entry.userAgent),
          createdAt: new Date(entry.createdAt).toISOString(),
          lastActiveAt: new Date(entry.updatedAt).toISOString(),
          expiresAt: new Date(entry.expiresAt).toISOString(),
        })),
        meta: { correlationId },
      }),
      correlationId,
    );
  } catch (error) {
    return sessionFailure(request, error);
  }
}

export async function revokeAccountSession(
  auth: VoworaAuth,
  request: Request,
  sessionId: string,
): Promise<Response> {
  if (!sessionIdSchema.safeParse(sessionId).success) {
    return problemResponse(request, {
      status: 404,
      title: "Session not found",
      detail: "The requested session is not available.",
      code: "SESSION_NOT_FOUND",
    });
  }
  try {
    const sensitive = await requireSensitiveSession(auth, request.headers);
    if (!sensitive) return unauthorized(request);
    if (sensitive.stale) return forbidden(request);
    const sessions = await auth.api.listSessions({ headers: request.headers });
    const selected = sessions.find((entry) => entry.id === sessionId);
    if (!selected || selected.id === sensitive.current.session.id) {
      return problemResponse(request, {
        status: 404,
        title: "Session not found",
        detail: "The requested session is not available.",
        code: "SESSION_NOT_FOUND",
      });
    }
    await auth.api.revokeSession({
      headers: request.headers,
      body: { token: selected.token },
    });
    return emptyResponse(correlationIdFor(request));
  } catch (error) {
    return sessionFailure(request, error);
  }
}

export async function revokeOtherAccountSessions(
  auth: VoworaAuth,
  request: Request,
): Promise<Response> {
  try {
    const sensitive = await requireSensitiveSession(auth, request.headers);
    if (!sensitive) return unauthorized(request);
    if (sensitive.stale) return forbidden(request);
    await auth.api.revokeOtherSessions({ headers: request.headers });
    return emptyResponse(correlationIdFor(request));
  } catch (error) {
    return sessionFailure(request, error);
  }
}
