"use client";

import { useState } from "react";

const messages = {
  en: {
    title: "Wedding team",
    assign: "Save assignment",
    remove: "Remove",
    lead: "Lead planner",
    staff: "Staff member",
    permissions: "Permissions",
    empty: "No active wedding access",
    saved: "Assignment saved",
    error: "The change could not be saved",
    absence: "Temporary absence",
    absenceStart: "Starts",
    absenceEnd: "Ends",
    saveAbsence: "Save absence",
    endAbsence: "End absence",
  },
  nl: {
    title: "Huwelijksteam",
    assign: "Toewijzing opslaan",
    remove: "Verwijderen",
    lead: "Hoofdplanner",
    staff: "Medewerker",
    permissions: "Machtigingen",
    empty: "Geen actieve huwelijkstoegang",
    saved: "Toewijzing opgeslagen",
    error: "De wijziging kon niet worden opgeslagen",
    absence: "Tijdelijke afwezigheid",
    absenceStart: "Begint",
    absenceEnd: "Eindigt",
    saveAbsence: "Afwezigheid opslaan",
    endAbsence: "Afwezigheid beëindigen",
  },
  fr: {
    title: "Équipe du mariage",
    assign: "Enregistrer l’affectation",
    remove: "Retirer",
    lead: "Planificateur principal",
    staff: "Membre du personnel",
    permissions: "Autorisations",
    empty: "Aucun accès actif au mariage",
    saved: "Affectation enregistrée",
    error: "Impossible d’enregistrer la modification",
    absence: "Absence temporaire",
    absenceStart: "Début",
    absenceEnd: "Fin",
    saveAbsence: "Enregistrer l’absence",
    endAbsence: "Terminer l’absence",
  },
  de: {
    title: "Hochzeitsteam",
    assign: "Zuweisung speichern",
    remove: "Entfernen",
    lead: "Leitende Planung",
    staff: "Mitarbeitende",
    permissions: "Berechtigungen",
    empty: "Kein aktiver Hochzeitszugriff",
    saved: "Zuweisung gespeichert",
    error: "Änderung konnte nicht gespeichert werden",
    absence: "Vorübergehende Abwesenheit",
    absenceStart: "Beginn",
    absenceEnd: "Ende",
    saveAbsence: "Abwesenheit speichern",
    endAbsence: "Abwesenheit beenden",
  },
} as const;
const permissionLabels = {
  en: {
    view: "View",
    edit: "Edit",
    download_export: "Download / export",
    tasks: "Tasks",
    schedule: "Schedule",
    guests: "Guests",
    contacts: "Contacts",
    vendors: "Vendors",
    budget: "Budget",
    documents: "Documents",
    notes: "Notes",
    decisions: "Decisions",
    inspiration: "Inspiration",
    settings: "Settings",
  },
  nl: {
    view: "Bekijken",
    edit: "Bewerken",
    download_export: "Downloaden / exporteren",
    tasks: "Taken",
    schedule: "Planning",
    guests: "Gasten",
    contacts: "Contacten",
    vendors: "Leveranciers",
    budget: "Budget",
    documents: "Documenten",
    notes: "Notities",
    decisions: "Beslissingen",
    inspiration: "Inspiratie",
    settings: "Instellingen",
  },
  fr: {
    view: "Voir",
    edit: "Modifier",
    download_export: "Télécharger / exporter",
    tasks: "Tâches",
    schedule: "Planning",
    guests: "Invités",
    contacts: "Contacts",
    vendors: "Prestataires",
    budget: "Budget",
    documents: "Documents",
    notes: "Notes",
    decisions: "Décisions",
    inspiration: "Inspiration",
    settings: "Paramètres",
  },
  de: {
    view: "Ansehen",
    edit: "Bearbeiten",
    download_export: "Herunterladen / exportieren",
    tasks: "Aufgaben",
    schedule: "Zeitplan",
    guests: "Gäste",
    contacts: "Kontakte",
    vendors: "Dienstleister",
    budget: "Budget",
    documents: "Dokumente",
    notes: "Notizen",
    decisions: "Entscheidungen",
    inspiration: "Inspiration",
    settings: "Einstellungen",
  },
} as const;

type Ceiling = { area: string; actions: string[] };
type Access = {
  id: string;
  weddingId: string;
  weddingName: string;
  permissionCeiling: Ceiling[];
  assignments: Array<{
    id: string;
    organizationMembershipId: string;
    isLead: boolean;
    absenceStartsAt: string | null;
    absenceEndsAt: string | null;
  }>;
};
type Staff = {
  id: string;
  name: string;
  email: string;
  status: "active" | "revoked";
};

export function PlannerWeddingAccessManager({
  organizationId,
  initialAccesses,
  staff,
  currentMembershipId,
  locale,
}: {
  organizationId: string;
  initialAccesses: Access[];
  staff: readonly Staff[];
  currentMembershipId?: string;
  locale: keyof typeof messages;
}) {
  const t = messages[locale];
  const labels = permissionLabels[locale];
  const [accesses, setAccesses] = useState(initialAccesses);
  const [status, setStatus] = useState("");
  async function refresh(accessId: string) {
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-access/${accessId}/staff`,
    );
    if (!response.ok) return false;
    const payload = await response.json();
    setAccesses((current) =>
      current.map((access) => (access.id === accessId ? payload.data : access)),
    );
    return true;
  }
  async function save(accessId: string, form: FormData) {
    setStatus("");
    const organizationMembershipId = String(form.get("staff"));
    const isLead = form.get("lead") === "on";
    const selected = form.getAll("permission").map(String);
    const permissions = Object.entries(
      Object.groupBy(selected, (value) => value.split(":")[0]!),
    ).map(([area, values]) => ({
      area,
      actions: Array.from(
        new Set([
          ...(values!.some((value) => value.split(":")[1] !== "view")
            ? ["view"]
            : []),
          ...values!.map((value) => value.split(":")[1]),
        ]),
      ),
    }));
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-access/${accessId}/staff`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationMembershipId, permissions, isLead }),
      },
    );
    if (!response.ok) return setStatus(t.error);
    await refresh(accessId);
    setStatus(t.saved);
  }
  async function remove(accessId: string, assignmentId: string) {
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-access/${accessId}/staff/${assignmentId}`,
      { method: "DELETE" },
    );
    if (!response.ok) return setStatus(t.error);
    await refresh(accessId);
  }
  async function saveAbsence(access: Access, form: FormData) {
    const starts = String(form.get("startsAt") ?? "");
    const ends = String(form.get("endsAt") ?? "");
    const response = await fetch(
      `/api/v1/weddings/${access.weddingId}/planner-organizations/access/${access.id}/absence`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startsAt: starts ? new Date(starts).toISOString() : null,
          endsAt: ends ? new Date(ends).toISOString() : null,
        }),
      },
    );
    if (!response.ok) return setStatus(t.error);
    await refresh(access.id);
    setStatus(t.saved);
  }
  async function endAbsence(access: Access) {
    const response = await fetch(
      `/api/v1/weddings/${access.weddingId}/planner-organizations/access/${access.id}/absence`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startsAt: null, endsAt: null }),
      },
    );
    if (!response.ok) return setStatus(t.error);
    await refresh(access.id);
    setStatus(t.saved);
  }
  return (
    <section aria-labelledby="wedding-team-title">
      <h2 id="wedding-team-title">{t.title}</h2>
      {accesses.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        accesses.map((access) => (
          <article key={access.id}>
            <h3>{access.weddingName}</h3>
            <form action={(form) => save(access.id, form)}>
              <label>
                {t.staff}
                <select name="staff" required>
                  {staff
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </label>
              <fieldset>
                <legend>{t.permissions}</legend>
                {access.permissionCeiling.flatMap((entry) =>
                  entry.actions.map((action) => (
                    <label key={`${entry.area}:${action}`}>
                      <input
                        type="checkbox"
                        name="permission"
                        value={`${entry.area}:${action}`}
                      />
                      {labels[entry.area as keyof typeof labels]}:{" "}
                      {labels[action as keyof typeof labels]}
                    </label>
                  )),
                )}
              </fieldset>
              <label>
                <input name="lead" type="checkbox" />
                {t.lead}
              </label>
              <button>{t.assign}</button>
            </form>
            <ul>
              {access.assignments.map((assignment) => (
                <li key={assignment.id}>
                  {staff.find(
                    (item) => item.id === assignment.organizationMembershipId,
                  )?.name ?? t.staff}
                  {assignment.isLead ? ` — ${t.lead}` : ""}
                  <button
                    type="button"
                    onClick={() => remove(access.id, assignment.id)}
                  >
                    {t.remove}
                  </button>
                  {assignment.isLead &&
                  assignment.organizationMembershipId ===
                    currentMembershipId ? (
                    <form action={(form) => saveAbsence(access, form)}>
                      <fieldset>
                        <legend>{t.absence}</legend>
                        <label>
                          {t.absenceStart}
                          <input
                            name="startsAt"
                            type="datetime-local"
                            required
                          />
                        </label>
                        <label>
                          {t.absenceEnd}
                          <input name="endsAt" type="datetime-local" required />
                        </label>
                        <button>{t.saveAbsence}</button>
                        {assignment.absenceStartsAt ? (
                          <button
                            type="button"
                            onClick={() => endAbsence(access)}
                          >
                            {t.endAbsence}
                          </button>
                        ) : null}
                      </fieldset>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
