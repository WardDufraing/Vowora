"use client";

import { type FormEvent, useState } from "react";

export function VerifyEmailForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          callbackURL: `${window.location.origin}/account`,
        }),
      });
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
      <button disabled={submitting} type="submit">
        {submitting ? "Please wait…" : "Send verification email"}
      </button>
      <p id="verification-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
