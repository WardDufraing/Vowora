"use client";
import { useState } from "react";
const copy = {
  en: {
    title: "Wedding invitations",
    accept: "Accept",
    reject: "Reject",
    empty: "No pending invitations",
    error: "The response could not be saved",
  },
  nl: {
    title: "Huwelijksuitnodigingen",
    accept: "Accepteren",
    reject: "Weigeren",
    empty: "Geen openstaande uitnodigingen",
    error: "Het antwoord kon niet worden opgeslagen",
  },
  fr: {
    title: "Invitations de mariage",
    accept: "Accepter",
    reject: "Refuser",
    empty: "Aucune invitation en attente",
    error: "Impossible d’enregistrer la réponse",
  },
  de: {
    title: "Hochzeitseinladungen",
    accept: "Annehmen",
    reject: "Ablehnen",
    empty: "Keine offenen Einladungen",
    error: "Antwort konnte nicht gespeichert werden",
  },
} as const;
type Item = {
  invitation: { id: string; expiresAt: string };
  weddingName: string;
};
export function PlannerWeddingInvitations({
  organizationId,
  initial,
  locale,
}: {
  organizationId: string;
  initial: Item[];
  locale: keyof typeof copy;
}) {
  const t = copy[locale];
  const [items, setItems] = useState(initial);
  const [error, setError] = useState("");
  async function respond(id: string, decision: "accept" | "reject") {
    setError("");
    const r = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-invitations/${id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    if (r.ok) setItems((v) => v.filter((i) => i.invitation.id !== id));
    else setError(t.error);
  }
  return (
    <main>
      <h1>{t.title}</h1>
      {items.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.invitation.id}>
              <strong>{item.weddingName}</strong>{" "}
              <time>
                {new Date(item.invitation.expiresAt).toLocaleDateString(locale)}
              </time>
              <button onClick={() => respond(item.invitation.id, "accept")}>
                {t.accept}
              </button>
              <button onClick={() => respond(item.invitation.id, "reject")}>
                {t.reject}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="alert">{error}</p>
    </main>
  );
}
