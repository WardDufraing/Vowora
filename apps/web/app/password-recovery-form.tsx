"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordRecoveryForm({ token }: { token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const reset = typeof token === "string" && token.length > 0;
    try {
      const response = await fetch(
        `/api/v1/auth/${reset ? "reset-password" : "request-password-reset"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            reset
              ? { token, newPassword: String(data.get("password") ?? "") }
              : {
                  email: String(data.get("email") ?? ""),
                  redirectTo: `${window.location.origin}/reset-password`,
                },
          ),
        },
      );
      if (!response.ok) {
        setMessage(
          reset
            ? "This reset link is invalid or expired. Request a new one."
            : "The request could not be completed. Please try again.",
        );
        return;
      }
      if (reset) {
        setMessage("Password updated. Sign in again on every device.");
        setTimeout(() => router.push("/sign-in"), 800);
      } else {
        setMessage(
          "If an account exists for that email, a reset link will arrive shortly.",
        );
      }
    } catch {
      setMessage(
        reset
          ? "This reset link is invalid or expired. Request a new one."
          : "The request could not be completed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-describedby="recovery-status">
      {token ? (
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
      ) : (
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
      )}
      <button type="submit" disabled={busy}>
        {busy ? "Please wait…" : token ? "Set new password" : "Send reset link"}
      </button>
      <p id="recovery-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
