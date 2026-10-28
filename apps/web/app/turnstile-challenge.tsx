"use client";

import Script from "next/script";

export function TurnstileChallenge() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    return (
      <p role="alert">
        Additional verification is temporarily unavailable. Try again later.
      </p>
    );
  }
  return (
    <div aria-label="Additional verification">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action="vowora-auth"
      />
    </div>
  );
}
