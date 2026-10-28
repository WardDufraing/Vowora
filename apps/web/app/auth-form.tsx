"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileChallenge } from "./turnstile-challenge";

const genericFailure =
  "We could not complete that request. Check your details and try again.";

export function AuthForm({ mode }: { readonly mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [challengeRequired, setChallengeRequired] = useState(false);
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
    const challengeToken = String(data.get("cf-turnstile-response") ?? "");
    setChallengeRequired(false);
    try {
      const response = await fetch(
        `/api/v1/auth/${isSignUp ? "sign-up" : "sign-in"}/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(challengeToken
              ? { "x-vowora-challenge-token": challengeToken }
              : {}),
          },
          body: JSON.stringify(body),
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
            setStatus("idle");
            return;
          }
        }
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
      {challengeRequired ? <TurnstileChallenge /> : null}
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
