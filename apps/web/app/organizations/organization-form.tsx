"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { organizationMessages } from "../../lib/organization-messages";

export function OrganizationForm({
  messages,
}: {
  readonly messages: ReturnType<typeof organizationMessages>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({ name: form.get("name") }),
      });
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { data: { id: string } };
      router.push(`/organizations/${body.data.id}/staff`);
    } catch {
      setError(messages.error);
      setBusy(false);
    }
  }
  return (
    <form className="shared-form" onSubmit={submit}>
      <label htmlFor="organization-name">{messages.name}</label>
      <input
        id="organization-name"
        name="name"
        required
        maxLength={120}
        autoComplete="organization"
      />
      {error ? <p role="alert">{error}</p> : null}
      <button disabled={busy} type="submit">
        {busy ? messages.creating : messages.create}
      </button>
    </form>
  );
}
