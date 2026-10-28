import {
  authSessionIdentity,
  csrfFailure,
  getAuth,
  isSafeStateChangingRequest,
  protectAuthAbuseRequest,
} from "../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../lib/env";
import {
  listAccountSessions,
  revokeOtherAccountSessions,
} from "../../../../../lib/session-management";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listAccountSessions(getAuth(), request);
}

export async function DELETE(request: Request) {
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
  return blocked ?? revokeOtherAccountSessions(auth, request);
}
