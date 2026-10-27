import { getAuth } from "../../../../../lib/auth";
import {
  listAccountSessions,
  revokeOtherAccountSessions,
} from "../../../../../lib/session-management";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return listAccountSessions(getAuth(), request);
}

export async function DELETE(request: Request) {
  return revokeOtherAccountSessions(getAuth(), request);
}
