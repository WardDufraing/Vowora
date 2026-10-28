"use client";

import { type FormEvent, useState } from "react";
import { TurnstileChallenge } from "../turnstile-challenge";

export function VerifyEmailForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [challengeRequired, setChallengeRequired] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const challengeToken = String(data.get("cf-turnstile-response") ?? "");
    setChallengeRequired(false);
    try {
      const response = await fetch("/api/v1/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(challengeToken
            ? { "x-vowora-challenge-token": challengeToken }
            : {}),
        },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          callbackURL: `${window.location.origin}/account`,
        }),
      });
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
        response.ok
          ? "If an unverified account exists, a verification email is on its way."
          : "We could not send a verification email. Please try again.",
      );
    } catch {
      setMessage("We could not send a verification email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} aria-describedby="verification-status">
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {challengeRequired ? <TurnstileChallenge /> : null}
      <button disabled={submitting} type="submit">
        {submitting ? "Please wait…" : "Send verification email"}
      </button>
      <p id="verification-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
