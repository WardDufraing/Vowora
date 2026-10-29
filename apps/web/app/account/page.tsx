import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../lib/auth";
import { SessionManager } from "./session-manager";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const current = await getAuth().api.getSession({ headers: await headers() });
  if (!current) redirect("/sign-in");
  if (!current.user.emailVerified) redirect("/verify-email");
  return (
    <main id="main-content">
      <p>Vowora</p>
      <h1>Account access confirmed</h1>
      <p>You are signed in with a verified email address.</p>
      <SessionManager />
    </main>
  );
}
