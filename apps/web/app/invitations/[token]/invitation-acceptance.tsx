"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/ui/foundation";
import type { WeddingFormMessages } from "../../../lib/wedding-messages";

export function InvitationAcceptance({
  messages,
  token,
}: {
  readonly messages: WeddingFormMessages;
  readonly token: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function accept() {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/v1/invitations/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accept: true }),
        },
      );
      if (!response.ok) throw new Error("request failed");
      const payload = (await response.json()) as {
        data: { weddingId: string };
      };
      router.replace(`/weddings/${payload.data.weddingId}/settings`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="invitation-title">
        <h1 id="invitation-title">{messages.invitationAcceptTitle}</h1>
        <p>{messages.invitationAcceptIntro}</p>
        {error ? (
          <p className="field__error" role="alert">
            {messages.invitationAcceptError}
          </p>
        ) : null}
        <Button disabled={busy} onClick={() => void accept()} type="button">
          {busy ? messages.invitationAccepting : messages.invitationAccept}
        </Button>
      </section>
    </main>
  );
}
