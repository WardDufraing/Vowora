import Link from "next/link";

import { AuthForm } from "../auth-form";
import {
  authContinuationQuery,
  safeAuthContinuation,
} from "../../lib/auth-continuation";

export default async function SignInPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly next?: string }>;
}) {
  const continuation = safeAuthContinuation((await searchParams).next);
  const query = authContinuationQuery(continuation);
  return (
    <main id="main-content">
      <p>Vowora</p>
      <h1>Sign in</h1>
      <p>Your email address must be verified before access is granted.</p>
      <AuthForm continuation={continuation} mode="sign-in" />
      <p>
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        Need an account? <Link href={`/sign-up${query}`}>Create one</Link>
      </p>
    </main>
  );
}
