"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const genericFailure =
  "We could not complete that request. Check your details and try again.";

export function AuthForm({ mode }: { readonly mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const body = {
      ...(isSignUp ? { name: String(data.get("name") ?? "") } : {}),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      callbackURL: `${window.location.origin}/account`,
    };
    try {
      const response = await fetch(
        `/api/v1/auth/${isSignUp ? "sign-up" : "sign-in"}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        setMessage(genericFailure);
        setStatus("idle");
        return;
      }
      if (isSignUp) {
        setMessage(
          "Check your inbox for a verification link before signing in.",
        );
        setStatus("success");
      } else {
        router.push("/account");
      }
    } catch {
      setMessage(genericFailure);
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={submit} aria-describedby="auth-status">
      {isSignUp ? (
        <label>
          Name
          <input
            name="name"
            autoComplete="name"
            minLength={1}
            maxLength={100}
            required
          />
        </label>
      ) : null}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      <button disabled={status !== "idle"} type="submit">
        {status === "submitting"
          ? "Please wait…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </button>
      <p id="auth-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
