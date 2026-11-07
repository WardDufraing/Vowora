"use client";

import { useState, type FormEvent } from "react";

import { Button, TextField } from "../../components/ui/foundation";
import type { WeddingFormMessages } from "../../lib/wedding-messages";

export function PartnerInvitationForm({
  endpoint,
  messages,
}: {
  readonly endpoint: string;
  readonly messages: WeddingFormMessages;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [acceptanceUrl, setAcceptanceUrl] = useState<string>();
  const [invitationId, setInvitationId] = useState<string>();
  const [revoked, setRevoked] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("request failed");
      const payload = (await response.json()) as {
        data: { acceptancePath: string; id: string };
      };
      setAcceptanceUrl(
        new URL(payload.data.acceptancePath, location.origin).href,
      );
      setInvitationId(payload.data.id);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!invitationId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`${endpoint}/${invitationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("request failed");
      setAcceptanceUrl(undefined);
      setInvitationId(undefined);
      setRevoked(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="partner-invitation-title">
      <h2 id="partner-invitation-title">{messages.invitationTitle}</h2>
      <p>{messages.invitationIntro}</p>
      {revoked ? (
        <p className="notice" role="status">
          {messages.invitationRevoked}
        </p>
      ) : null}
      {acceptanceUrl ? (
        <div className="notice" role="status">
          <p>{messages.invitationSent}</p>
          <Button
            onClick={() => void navigator.clipboard.writeText(acceptanceUrl)}
            type="button"
          >
            {messages.invitationCopy}
          </Button>
          <Button disabled={busy} onClick={() => void revoke()} type="button">
            {busy ? messages.invitationRevoking : messages.invitationRevoke}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <TextField
            description={messages.invitationEmailDescription}
            id="partner-email"
            label={messages.invitationEmail}
            maxLength={320}
            name="email"
            required
            type="email"
          />
          {error ? (
            <p className="field__error" role="alert">
              {messages.invitationError}
            </p>
          ) : null}
          <Button disabled={busy} type="submit">
            {busy ? messages.invitationSending : messages.invitationSend}
          </Button>
        </form>
      )}
    </section>
  );
}
