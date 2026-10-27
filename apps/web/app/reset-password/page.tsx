import Link from "next/link";
import { PasswordRecoveryForm } from "../password-recovery-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return (
    <main>
      <p>Vowora</p>
      <h1>Choose a new password</h1>
      {token && !error ? (
        <PasswordRecoveryForm token={token} />
      ) : (
        <p role="alert">This reset link is invalid or expired.</p>
      )}
      <p>
        <Link href="/forgot-password">Request another link</Link>
      </p>
    </main>
  );
}
