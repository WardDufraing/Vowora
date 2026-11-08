import Link from "next/link";

import { AuthForm } from "../auth-form";
import {
  authContinuationQuery,
  safeAuthContinuation,
} from "../../lib/auth-continuation";

export default async function SignUpPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly next?: string }>;
}) {
  const continuation = safeAuthContinuation((await searchParams).next);
  const query = authContinuationQuery(continuation);
  return (
    <main id="main-content">
      <p>Vowora</p>
      <h1>Create your account</h1>
      <p>Verify your email address before you can sign in.</p>
      <AuthForm continuation={continuation} mode="sign-up" />
      <p>
        Already have an account? <Link href={`/sign-in${query}`}>Sign in</Link>
      </p>
    </main>
  );
}
