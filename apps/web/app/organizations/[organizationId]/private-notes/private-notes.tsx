"use client";

import { useState } from "react";

const messages = {
  en: {
    title: "Private organization notes",
    intro:
      "Visible only to active staff in this organization and never shared with the couple. Wedding links remain private historical references after access ends.",
    newNote: "New private note",
    noteTitle: "Title",
    body: "Note",
    wedding: "Wedding ID (optional)",
    save: "Save note",
    saving: "Saving…",
    empty: "No private notes yet.",
    archive: "Archive",
    archived: "Archived",
    update: "Save changes",
    error: "The private note could not be saved.",
  },
  nl: {
    title: "Privénotities van de organisatie",
    intro:
      "Alleen zichtbaar voor actieve medewerkers van deze organisatie en nooit gedeeld met het koppel. Bruiloftlinks blijven privé-historische verwijzingen nadat de toegang eindigt.",
    newNote: "Nieuwe privénotitie",
    noteTitle: "Titel",
    body: "Notitie",
    wedding: "Bruiloft-ID (optioneel)",
    save: "Notitie opslaan",
    saving: "Opslaan…",
    empty: "Nog geen privénotities.",
    archive: "Archiveren",
    archived: "Gearchiveerd",
    update: "Wijzigingen opslaan",
    error: "De privénotitie kon niet worden opgeslagen.",
  },
  fr: {
    title: "Notes privées de l’organisation",
    intro:
      "Visibles uniquement par le personnel actif de cette organisation et jamais partagées avec le couple. Les liens de mariage restent des références historiques privées après la fin de l’accès.",
    newNote: "Nouvelle note privée",
    noteTitle: "Titre",
    body: "Note",
    wedding: "Identifiant du mariage (facultatif)",
    save: "Enregistrer la note",
    saving: "Enregistrement…",
    empty: "Aucune note privée.",
    archive: "Archiver",
    archived: "Archivée",
    update: "Enregistrer les modifications",
    error: "La note privée n’a pas pu être enregistrée.",
  },
  de: {
    title: "Private Organisationsnotizen",
    intro:
      "Nur für aktive Mitarbeitende dieser Organisation sichtbar und niemals mit dem Paar geteilt. Hochzeitsverknüpfungen bleiben nach Zugriffsende private historische Referenzen.",
    newNote: "Neue private Notiz",
    noteTitle: "Titel",
    body: "Notiz",
    wedding: "Hochzeits-ID (optional)",
    save: "Notiz speichern",
    saving: "Wird gespeichert…",
    empty: "Noch keine privaten Notizen.",
    archive: "Archivieren",
    archived: "Archiviert",
    update: "Änderungen speichern",
    error: "Die private Notiz konnte nicht gespeichert werden.",
  },
} as const;

type Note = {
  id: string;
  weddingId: string | null;
  title: string;
  body: string;
  status: "active" | "archived";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  editable: boolean;
};

export function OrganizationPrivateNotes({
  organizationId,
  initialNotes,
  locale,
}: {
  organizationId: string;
  initialNotes: Note[];
  locale: keyof typeof messages;
}) {
  const t = messages[locale];
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function create(form: FormData) {
    setPending(true);
    setStatus("");
    const weddingId = String(form.get("weddingId") ?? "").trim();
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/private-notes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title")),
          body: String(form.get("body")),
          ...(weddingId ? { weddingId } : {}),
        }),
      },
    );
    setPending(false);
    if (!response.ok) return setStatus(t.error);
    const payload = await response.json();
    setNotes((current) => [payload.data, ...current]);
  }
  async function change(
    noteId: string,
    input: { title?: string; body?: string; archive?: true },
  ) {
    setStatus("");
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/private-notes/${noteId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!response.ok) return setStatus(t.error);
    const payload = await response.json();
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? payload.data : note)),
    );
  }
  return (
    <>
      <header>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </header>
      <section aria-labelledby="new-private-note">
        <h2 id="new-private-note">{t.newNote}</h2>
        <form action={create}>
          <label>
            {t.noteTitle}
            <input name="title" maxLength={160} required />
          </label>
          <label>
            {t.body}
            <textarea name="body" maxLength={20000} required rows={5} />
          </label>
          <label>
            {t.wedding}
            <input name="weddingId" inputMode="text" />
          </label>
          <button disabled={pending}>{pending ? t.saving : t.save}</button>
        </form>
      </section>
      <section aria-label={t.title}>
        {notes.length === 0 ? (
          <p>{t.empty}</p>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="mobile-record">
              {note.editable && note.status === "active" ? (
                <form
                  action={(form) =>
                    change(note.id, {
                      title: String(form.get("title")),
                      body: String(form.get("body")),
                    })
                  }
                >
                  <label>
                    {t.noteTitle}
                    <input
                      name="title"
                      defaultValue={note.title}
                      maxLength={160}
                      required
                    />
                  </label>
                  <label>
                    {t.body}
                    <textarea
                      name="body"
                      defaultValue={note.body}
                      maxLength={20000}
                      required
                      rows={4}
                    />
                  </label>
                  <div className="button-row">
                    <button>{t.update}</button>
                    <button
                      className="button--destructive"
                      type="button"
                      onClick={() => change(note.id, { archive: true })}
                    >
                      {t.archive}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{note.title}</h2>
                  <p>{note.body}</p>
                  <p>{t.archived}</p>
                </>
              )}
            </article>
          ))
        )}
      </section>
      <p role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
