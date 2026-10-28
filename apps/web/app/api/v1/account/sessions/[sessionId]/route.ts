import {
  authSessionIdentity,
  csrfFailure,
  getAuth,
  isSafeStateChangingRequest,
  protectAuthAbuseRequest,
} from "../../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../../lib/env";
import { revokeAccountSession } from "../../../../../../lib/session-management";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  if (
    !isSafeStateChangingRequest(
      request,
      readAuthEnvironment().NEXT_PUBLIC_APP_URL,
    )
  ) {
    return csrfFailure(request);
  }
  const auth = getAuth();
  const blocked = await protectAuthAbuseRequest(
    auth,
    request,
    authSessionIdentity(request),
    { windowSeconds: 60, maximumAttempts: 10 },
    false,
  );
  return (
    blocked ??
    revokeAccountSession(auth, request, (await context.params).sessionId)
  );
}
