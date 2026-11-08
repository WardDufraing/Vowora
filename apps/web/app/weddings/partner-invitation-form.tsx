"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, TextField } from "../../components/ui/foundation";
import type { WeddingFormMessages } from "../../lib/wedding-messages";

export function PartnerInvitationForm({
  endpoint,
  locale,
  messages,
}: {
  readonly endpoint: string;
  readonly locale: "en" | "nl" | "fr" | "de";
  readonly messages: WeddingFormMessages;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [acceptanceUrl, setAcceptanceUrl] = useState<string>();
  const [invitationId, setInvitationId] = useState<string>();
  const [invitedEmail, setInvitedEmail] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [revoked, setRevoked] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) throw new Error("request failed");
        return (await response.json()) as {
          data: { id: string; invitedEmail: string; expiresAt: string }[];
        };
      })
      .then(({ data }) => {
        const invitation = data[0];
        if (!active || !invitation) return;
        setInvitationId(invitation.id);
        setInvitedEmail(invitation.invitedEmail);
        setExpiresAt(invitation.expiresAt);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (!response.ok) throw new Error("request failed");
      const payload = (await response.json()) as {
        data: {
          acceptancePath: string;
          id: string;
          invitedEmail: string;
          expiresAt: string;
        };
      };
      setAcceptanceUrl(
        new URL(payload.data.acceptancePath, location.origin).href,
      );
      setInvitationId(payload.data.id);
      setInvitedEmail(payload.data.invitedEmail);
      setExpiresAt(payload.data.expiresAt);
      setRevoked(false);
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
      setInvitedEmail(undefined);
      setExpiresAt(undefined);
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
      {invitationId ? (
        <div className="notice" role="status">
          <p>
            {acceptanceUrl
              ? messages.invitationSent
              : messages.invitationPending}
          </p>
          {invitedEmail ? <p>{invitedEmail}</p> : null}
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
          {acceptanceUrl ? (
            <Button
              onClick={() => void navigator.clipboard.writeText(acceptanceUrl)}
              type="button"
            >
              {messages.invitationCopy}
            </Button>
          ) : null}
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
