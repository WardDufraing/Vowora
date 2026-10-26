import { getAuth, handleAuthRequest } from "../../../../../lib/auth";
import { readAuthEnvironment } from "../../../../../lib/env";

async function handle(request: Request): Promise<Response> {
  return handleAuthRequest(
    getAuth(),
    request,
    readAuthEnvironment().NEXT_PUBLIC_APP_URL,
  );
}

export {
  handle as DELETE,
  handle as GET,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};
