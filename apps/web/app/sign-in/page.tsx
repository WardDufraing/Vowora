import Link from "next/link";

import { AuthForm } from "../auth-form";

export default function SignInPage() {
  return (
    <main>
      <p>Vowora</p>
      <h1>Sign in</h1>
      <p>Your email address must be verified before access is granted.</p>
      <AuthForm mode="sign-in" />
      <p>
        Need an account? <Link href="/sign-up">Create one</Link>
      </p>
    </main>
  );
}
