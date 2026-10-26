import Link from "next/link";

import { VerifyEmailForm } from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <main>
      <p>Vowora</p>
      <h1>Verify your email</h1>
      <p>
        Use the verification link sent to your inbox. The link expires after one
        hour.
      </p>
      <VerifyEmailForm />
      <Link href="/sign-in">Return to sign in</Link>
    </main>
  );
}
