import Link from "next/link";
import { PasswordRecoveryForm } from "../password-recovery-form";

export default function ForgotPasswordPage() {
  return (
    <main id="main-content">
      <p>Vowora</p>
      <h1>Reset your password</h1>
      <p>We will send a single-use link if the account exists.</p>
      <PasswordRecoveryForm />
      <p>
        <Link href="/sign-in">Return to sign in</Link>
      </p>
    </main>
  );
}
