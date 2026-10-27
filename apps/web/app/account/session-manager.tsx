"use client";

import { useCallback, useEffect, useState } from "react";

interface SafeSession {
  id: string;
  current: boolean;
  device: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<SafeSession[]>([]);
  const [message, setMessage] = useState("Loading active sessions…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/v1/account/sessions", {
      cache: "no-store",
    });
    if (!response.ok) {
      setMessage(
        response.status === 403
          ? "Sign in again before managing sessions."
          : "Sessions could not be loaded.",
      );
      return;
    }
    const body = (await response.json()) as { data: SafeSession[] };
    setSessions(body.data);
    setMessage(body.data.length === 0 ? "No active sessions." : "");
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function revoke(path: string) {
    setBusy(true);
    const response = await fetch(path, { method: "DELETE" });
    if (!response.ok) {
      setMessage("The session could not be revoked.");
      setBusy(false);
      return;
    }
    await load();
    setMessage("Session access revoked.");
    setBusy(false);
  }

  return (
    <section aria-labelledby="sessions-heading">
      <h2 id="sessions-heading">Active sessions</h2>
      <p>Review browsers that currently have access to your account.</p>
      {sessions.length > 1 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => revoke("/api/v1/account/sessions")}
        >
          Revoke all other sessions
        </button>
      ) : null}
      <ul className="session-list">
        {sessions.map((entry) => (
          <li key={entry.id}>
            <strong>
              {entry.device}
              {entry.current ? " — current session" : ""}
            </strong>
            <span>
              Last active {new Date(entry.lastActiveAt).toLocaleString()}
            </span>
            <span>Expires {new Date(entry.expiresAt).toLocaleString()}</span>
            {!entry.current ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => revoke(`/api/v1/account/sessions/${entry.id}`)}
              >
                Revoke session
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
