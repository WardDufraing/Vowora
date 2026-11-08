"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/ui/foundation";
import type { WeddingFormMessages } from "../../../lib/wedding-messages";

export function InvitationAcceptance({
  endpoint,
  expiresAt,
  initiallyExpired = false,
  locale,
  messages,
}: {
  readonly endpoint: string;
  readonly expiresAt?: string;
  readonly initiallyExpired?: boolean;
  readonly locale: "en" | "nl" | "fr" | "de";
  readonly messages: WeddingFormMessages;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"generic" | "expired" | undefined>(
    initiallyExpired ? "expired" : undefined,
  );

  async function accept() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accept: true }),
      });
      if (!response.ok) {
        const problem = (await response
          .clone()
          .json()
          .catch(() => null)) as { code?: string } | null;
        if (response.status === 410 && problem?.code === "INVITATION_EXPIRED") {
          setError("expired");
          return;
        }
        throw new Error("request failed");
      }
      const payload = (await response.json()) as {
        data: { weddingId: string };
      };
      router.replace(`/weddings/${payload.data.weddingId}/settings`);
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="invitation-title">
        <h1 id="invitation-title">{messages.invitationAcceptTitle}</h1>
        <p>{messages.invitationAcceptIntro}</p>
        {expiresAt ? (
          <p>
            {messages.invitationExpires}{" "}
            <time dateTime={expiresAt}>
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(expiresAt))}
            </time>
          </p>
        ) : null}
        {error ? (
          <p className="field__error" role="alert">
            {error === "expired"
              ? messages.invitationExpired
              : messages.invitationAcceptError}
          </p>
        ) : null}
        {error === "expired" ? null : (
          <Button disabled={busy} onClick={() => void accept()} type="button">
            {busy ? messages.invitationAccepting : messages.invitationAccept}
          </Button>
        )}
      </section>
    </main>
  );
}
