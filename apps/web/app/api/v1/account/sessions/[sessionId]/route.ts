import { getAuth } from "../../../../../../lib/auth";
import { revokeAccountSession } from "../../../../../../lib/session-management";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  return revokeAccountSession(
    getAuth(),
    request,
    (await context.params).sessionId,
  );
}
