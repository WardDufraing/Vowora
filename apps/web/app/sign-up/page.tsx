import Link from "next/link";

import { AuthForm } from "../auth-form";

export default function SignUpPage() {
  return (
    <main id="main-content">
      <p>Vowora</p>
      <h1>Create your account</h1>
      <p>Verify your email address before you can sign in.</p>
      <AuthForm mode="sign-up" />
      <p>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
