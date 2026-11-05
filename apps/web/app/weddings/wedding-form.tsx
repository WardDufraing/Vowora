"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button, TextField } from "../../components/ui/foundation";
import type { WeddingFormMessages } from "../../lib/wedding-messages";

interface FormValues {
  readonly name: string;
  readonly weddingDate: string | null;
  readonly timeZone: string;
  readonly settingsVersion?: number;
}

export function WeddingForm({
  endpoint,
  initial,
  messages,
  mode,
}: {
  readonly endpoint: string;
  readonly initial: FormValues;
  readonly messages: WeddingFormMessages;
  readonly mode: "create" | "settings";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(
    initial.settingsVersion,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const retry = useRef<{ fingerprint: string; key: string } | undefined>(
    undefined,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setRequestError(false);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const weddingDateValue = String(form.get("weddingDate") ?? "");
    const timeZone = String(form.get("timeZone") ?? "").trim();
    const nextErrors: Record<string, string> = {};
    if (!name || name.length > 120) nextErrors.name = messages.invalidName;
    if (weddingDateValue && !/^\d{4}-\d{2}-\d{2}$/.test(weddingDateValue)) {
      nextErrors.weddingDate = messages.invalidDate;
    }
    try {
      new Intl.DateTimeFormat("en", { timeZone }).format();
    } catch {
      nextErrors.timeZone = messages.invalidTimeZone;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = {
      name,
      weddingDate: weddingDateValue || null,
      timeZone,
      ...(mode === "settings" ? { expectedVersion: settingsVersion } : {}),
    };
    const fingerprint = JSON.stringify(body);
    if (!retry.current || retry.current.fingerprint !== fingerprint) {
      retry.current = { fingerprint, key: crypto.randomUUID() };
    }
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "content-type": "application/json",
          ...(mode === "create"
            ? { "idempotency-key": retry.current.key }
            : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("request failed");
      const payload = (await response.json()) as {
        data: { id: string; settingsVersion: number };
      };
      if (mode === "create") {
        router.push(`/weddings/${payload.data.id}/settings`);
      } else {
        setSettingsVersion(payload.data.settingsVersion);
        setSaved(true);
      }
    } catch {
      setRequestError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="wedding-settings-form" onSubmit={submit} noValidate>
      {Object.keys(errors).length > 0 ? (
        <div className="error-summary" role="alert" tabIndex={-1}>
          <h2>{messages.errorTitle}</h2>
          <ul>
            {Object.entries(errors).map(([id, message]) => (
              <li key={id}>
                <a href={`#${id}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <TextField
        defaultValue={initial.name}
        description={messages.nameDescription}
        error={errors.name}
        id="name"
        label={messages.name}
        maxLength={120}
        name="name"
        required
      />
      <TextField
        defaultValue={initial.weddingDate ?? ""}
        description={`${messages.dateDescription} (${messages.optional})`}
        error={errors.weddingDate}
        id="weddingDate"
        label={messages.date}
        name="weddingDate"
        type="date"
      />
      <TextField
        defaultValue={initial.timeZone}
        description={messages.timeZoneDescription}
        error={errors.timeZone}
        id="timeZone"
        label={messages.timeZone}
        maxLength={64}
        name="timeZone"
        required
      />
      {requestError ? (
        <p className="field__error" role="alert">
          {messages.requestError}
        </p>
      ) : null}
      {saved ? (
        <p className="notice" role="status">
          {messages.saved}
        </p>
      ) : null}
      <Button disabled={busy} type="submit">
        {busy
          ? messages.saving
          : mode === "create"
            ? messages.create
            : messages.save}
      </Button>
    </form>
  );
}
