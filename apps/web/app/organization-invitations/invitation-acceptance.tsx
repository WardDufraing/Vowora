"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { organizationMessages } from "../../lib/organization-messages";

export function OrganizationInvitationAcceptance({
  endpoint,
  expired,
  messages,
  organizationName,
}: {
  readonly endpoint: string;
  readonly expired: boolean;
  readonly messages: ReturnType<typeof organizationMessages>;
  readonly organizationName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accept: true }),
      });
      if (!response.ok) throw new Error();
      const body = (await response.json()) as {
        data: { organizationId: string };
      };
      setAccepted(true);
      router.push(`/organizations/${body.data.organizationId}/staff`);
    } catch {
      setError(messages.error);
      setBusy(false);
    }
  }
  return (
    <section
      className="account-card"
      aria-labelledby="organization-invitation-title"
    >
      <h1 id="organization-invitation-title">{messages.acceptanceTitle}</h1>
      <p>{organizationName}</p>
      {expired ? (
        <p role="alert">{messages.expired}</p>
      ) : (
        <>
          <p>{messages.acceptanceIntro}</p>
          {error ? <p role="alert">{error}</p> : null}
          {accepted ? (
            <p role="status">{messages.accepted}</p>
          ) : (
            <button disabled={busy} type="button" onClick={() => void accept()}>
              {busy ? messages.accepting : messages.accept}
            </button>
          )}
        </>
      )}
    </section>
  );
}
