"use client";

import { useRef, useState, type FormEvent } from "react";

import type { OrganizationInvitation } from "@vowora/contracts";
import type {
  OrganizationLocale,
  organizationMessages,
} from "../../../../lib/organization-messages";

type InvitationWithLink = OrganizationInvitation & {
  readonly acceptancePath?: string;
};

export function StaffInvitationForm({
  endpoint,
  initial,
  locale,
  messages,
}: {
  readonly endpoint: string;
  readonly initial: readonly OrganizationInvitation[];
  readonly locale: OrganizationLocale;
  readonly messages: ReturnType<typeof organizationMessages>;
}) {
  const [invitations, setInvitations] =
    useState<readonly InvitationWithLink[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef<{ fingerprint: string; key: string } | undefined>(
    undefined,
  );
  async function issue(
    email: string,
    role: "manager" | "employee",
    reissueInvitationId?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const fingerprint = JSON.stringify({
      email: normalizedEmail,
      role,
      reissueInvitationId: reissueInvitationId ?? null,
    });
    if (retry.current?.fingerprint !== fingerprint) {
      retry.current = { fingerprint, key: crypto.randomUUID() };
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": retry.current.key,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        role,
        locale,
        ...(reissueInvitationId ? { reissueInvitationId } : {}),
      }),
    });
    if (!response.ok) throw new Error();
    const body = (await response.json()) as { data: InvitationWithLink };
    retry.current = undefined;
    setInvitations((current) => [
      ...current.filter((item) => item.invitedEmail !== body.data.invitedEmail),
      body.data,
    ]);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await issue(
        String(data.get("email") ?? ""),
        data.get("role") === "manager" ? "manager" : "employee",
      );
      form.reset();
    } catch {
      setError(messages.error);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(invitation: InvitationWithLink) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}/${invitation.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );
    } catch {
      setError(messages.error);
    } finally {
      setBusy(false);
    }
  }
  async function reissue(invitation: InvitationWithLink) {
    setBusy(true);
    setError("");
    try {
      await issue(invitation.invitedEmail, invitation.role, invitation.id);
    } catch {
      setError(messages.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="staff-invitation-title">
      <h2 id="staff-invitation-title">{messages.inviteTitle}</h2>
      {error ? <p role="alert">{error}</p> : null}
      <form className="shared-form" onSubmit={submit}>
        <label htmlFor="staff-email">{messages.inviteEmail}</label>
        <input
          id="staff-email"
          name="email"
          required
          type="email"
          maxLength={320}
        />
        <label htmlFor="staff-role">{messages.inviteRole}</label>
        <select id="staff-role" name="role">
          <option value="employee">{messages.employee}</option>
          <option value="manager">{messages.manager}</option>
        </select>
        <button disabled={busy} type="submit">
          {busy ? messages.inviting : messages.invite}
        </button>
      </form>
      <ul className="shared-list">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <p>
              {messages.invitationPending}: {invitation.invitedEmail} ·{" "}
              {messages[invitation.role]}
            </p>
            <p>
              {messages.expires}{" "}
              <time dateTime={invitation.expiresAt}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(new Date(invitation.expiresAt))}
              </time>
            </p>
            {invitation.acceptancePath ? (
              <a href={invitation.acceptancePath}>
                {invitation.acceptancePath}
              </a>
            ) : null}
            <button
              disabled={busy}
              type="button"
              onClick={() => void revoke(invitation)}
            >
              {messages.revoke}
            </button>
            <button
              disabled={busy}
              type="button"
              onClick={() => void reissue(invitation)}
            >
              {messages.reissue}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
