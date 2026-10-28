"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileChallenge } from "./turnstile-challenge";

export function PasswordRecoveryForm({ token }: { token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [challengeRequired, setChallengeRequired] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const reset = typeof token === "string" && token.length > 0;
    const challengeToken = String(data.get("cf-turnstile-response") ?? "");
    setChallengeRequired(false);
    try {
      const response = await fetch(
        `/api/v1/auth/${reset ? "reset-password" : "request-password-reset"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(challengeToken
              ? { "x-vowora-challenge-token": challengeToken }
              : {}),
          },
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
        if (response.status === 403) {
          const problem: unknown = await response
            .clone()
            .json()
            .catch(() => null);
          if (
            typeof problem === "object" &&
            problem !== null &&
            "code" in problem &&
            problem.code === "AUTHENTICATION_CHALLENGE_REQUIRED"
          ) {
            setChallengeRequired(true);
            setMessage("Complete the verification challenge and try again.");
            return;
          }
        }
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
      {challengeRequired ? <TurnstileChallenge /> : null}
      <button type="submit" disabled={busy}>
        {busy ? "Please wait…" : token ? "Set new password" : "Send reset link"}
      </button>
      <p id="recovery-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
