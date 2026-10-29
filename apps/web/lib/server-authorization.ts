import {
  authorizeIndependentPlannerServerOperation,
  authorizeOrganizationServerOperation,
  authorizeWeddingServerOperation,
  ServerAuthorizationError,
  type AuthorizedServerOperation,
  type IndependentPlannerServerOperation,
  type OrganizationServerOperation,
  type ServerAuthorizationState,
  type WeddingServerOperation,
} from "@vowora/domain";

import { correlationIdFor, problemResponse } from "./api";

interface SessionReader {
  readonly api: {
    getSession(input: {
      readonly headers: Headers;
      readonly query: {
        readonly disableCookieCache: true;
        readonly disableRefresh: true;
      };
    }): Promise<{ readonly user: { readonly id: string } } | null>;
  };
}

type WithoutCorrelation<T> = T extends unknown
  ? Omit<T, "correlationId">
  : never;
type WeddingApiOperation = WithoutCorrelation<WeddingServerOperation>;
type OrganizationApiOperation = WithoutCorrelation<OrganizationServerOperation>;
type IndependentPlannerApiOperation =
  WithoutCorrelation<IndependentPlannerServerOperation>;

export type ApiAuthorizationRequest =
  | {
      readonly tenant: "wedding";
      readonly operation: WeddingApiOperation;
    }
  | {
      readonly tenant: "organization";
      readonly operation: OrganizationApiOperation;
    }
  | {
      readonly tenant: "private_owner";
      readonly operation: IndependentPlannerApiOperation;
    };

export type ApiAuthorizationResult =
  | {
      readonly authorized: true;
      readonly operation: AuthorizedServerOperation;
    }
  | { readonly authorized: false; readonly response: Response };

function authenticationRequired(request: Request): Response {
  return problemResponse(request, {
    status: 401,
    title: "Authentication required",
    detail: "A valid session is required.",
    code: "AUTHENTICATION_REQUIRED",
  });
}

function accessDenied(request: Request): Response {
  return problemResponse(request, {
    status: 403,
    title: "Access denied",
    detail: "The requested operation is not permitted.",
    code: "ACCESS_DENIED",
  });
}

function authorizationUnavailable(request: Request): Response {
  return problemResponse(request, {
    status: 503,
    title: "Authorization service unavailable",
    detail: "The authorization check could not be completed.",
    code: "AUTHORIZATION_UNAVAILABLE",
  });
}

/**
 * Resolves a request through the authenticated server session and the central
 * permission engine. Route handlers supply only route-owned tenant/resource
 * identifiers and a static action; actor, grants, relationship and visibility
 * are loaded by trusted server dependencies.
 */
export async function authorizeApiOperation(
  auth: SessionReader,
  request: Request,
  input: ApiAuthorizationRequest,
  state: ServerAuthorizationState,
): Promise<ApiAuthorizationResult> {
  let session: Awaited<ReturnType<SessionReader["api"]["getSession"]>>;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true, disableRefresh: true },
    });
  } catch {
    return { authorized: false, response: authorizationUnavailable(request) };
  }
  if (!session) {
    return { authorized: false, response: authenticationRequired(request) };
  }

  try {
    const correlationId = correlationIdFor(request);
    let operation: AuthorizedServerOperation;
    if (input.tenant === "wedding") {
      operation = await authorizeWeddingServerOperation(
        { actorId: session.user.id },
        { ...input.operation, correlationId },
        state,
      );
    } else if (input.tenant === "organization") {
      operation = await authorizeOrganizationServerOperation(
        { actorId: session.user.id },
        { ...input.operation, correlationId },
        state,
      );
    } else {
      operation = await authorizeIndependentPlannerServerOperation(
        { actorId: session.user.id },
        { ...input.operation, correlationId },
        state,
      );
    }
    return { authorized: true, operation };
  } catch (error) {
    if (error instanceof ServerAuthorizationError) {
      if (error.failure === "authentication_required") {
        return {
          authorized: false,
          response: authenticationRequired(request),
        };
      }
      if (error.failure === "access_denied") {
        return { authorized: false, response: accessDenied(request) };
      }
    }
    return { authorized: false, response: authorizationUnavailable(request) };
  }
}
