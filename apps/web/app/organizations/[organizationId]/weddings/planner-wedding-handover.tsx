"use client";

import { useState } from "react";

const messages = {
  en: {
    title: "End organization access",
    guided: "Guided handover",
    immediate: "Leave immediately",
    review: "Review current handover",
    assignments: "Active staff assignments",
    lead: "Lead assigned",
    invitations: "Pending invitations",
    responsibilities: "Unresolved responsibilities",
    retained: "The couple keeps all shared wedding data and history.",
    private:
      "Private organization notes remain with the organization and are never shared with the couple.",
    consequence:
      "All organization and staff access ends immediately. This cannot be undone here.",
    confirm: "I reviewed these consequences",
    finish: "End access",
    done: "Organization access ended.",
    error: "The handover could not be completed.",
    yes: "Yes",
    no: "No",
  },
  nl: {
    title: "Organisatietoegang beëindigen",
    guided: "Begeleide overdracht",
    immediate: "Onmiddellijk vertrekken",
    review: "Huidige overdracht bekijken",
    assignments: "Actieve medewerkerstoewijzingen",
    lead: "Hoofdplanner toegewezen",
    invitations: "Openstaande uitnodigingen",
    responsibilities: "Onopgeloste verantwoordelijkheden",
    retained:
      "Het koppel behoudt alle gedeelde bruiloftgegevens en geschiedenis.",
    private:
      "Privénotities blijven bij de organisatie en worden nooit met het koppel gedeeld.",
    consequence:
      "Alle toegangen van organisatie en medewerkers eindigen onmiddellijk. Dit kan hier niet ongedaan worden gemaakt.",
    confirm: "Ik heb deze gevolgen bekeken",
    finish: "Toegang beëindigen",
    done: "Organisatietoegang beëindigd.",
    error: "De overdracht kon niet worden voltooid.",
    yes: "Ja",
    no: "Nee",
  },
  fr: {
    title: "Mettre fin à l’accès de l’organisation",
    guided: "Transfert guidé",
    immediate: "Quitter immédiatement",
    review: "Examiner le transfert actuel",
    assignments: "Affectations actives",
    lead: "Responsable désigné",
    invitations: "Invitations en attente",
    responsibilities: "Responsabilités non résolues",
    retained: "Le couple conserve toutes les données et l’historique partagés.",
    private:
      "Les notes privées restent dans l’organisation et ne sont jamais partagées avec le couple.",
    consequence:
      "Tous les accès de l’organisation et du personnel prennent fin immédiatement. Cette action n’est pas annulable ici.",
    confirm: "J’ai examiné ces conséquences",
    finish: "Mettre fin à l’accès",
    done: "Accès de l’organisation terminé.",
    error: "Le transfert n’a pas pu être effectué.",
    yes: "Oui",
    no: "Non",
  },
  de: {
    title: "Organisationszugriff beenden",
    guided: "Geführte Übergabe",
    immediate: "Sofort verlassen",
    review: "Aktuelle Übergabe prüfen",
    assignments: "Aktive Mitarbeiterzuweisungen",
    lead: "Leitung zugewiesen",
    invitations: "Ausstehende Einladungen",
    responsibilities: "Offene Verantwortlichkeiten",
    retained:
      "Das Paar behält alle gemeinsamen Hochzeitsdaten und den Verlauf.",
    private:
      "Private Organisationsnotizen bleiben bei der Organisation und werden nie mit dem Paar geteilt.",
    consequence:
      "Jeglicher Zugriff der Organisation und Mitarbeitenden endet sofort. Dies kann hier nicht rückgängig gemacht werden.",
    confirm: "Ich habe diese Folgen geprüft",
    finish: "Zugriff beenden",
    done: "Organisationszugriff beendet.",
    error: "Die Übergabe konnte nicht abgeschlossen werden.",
    yes: "Ja",
    no: "Nein",
  },
} as const;
type Snapshot = {
  activeAssignmentCount: number;
  leadAssigned: boolean;
  pendingInvitationCount: number;
  unresolvedResponsibilityCount: number;
};

export function PlannerWeddingHandover({
  organizationId,
  accessId,
  locale,
  onComplete,
  headingLevel = 4,
}: {
  organizationId: string;
  accessId: string;
  locale: keyof typeof messages;
  onComplete: () => void;
  headingLevel?: 2 | 4;
}) {
  const t = messages[locale];
  const Heading = headingLevel === 2 ? "h2" : "h4";
  const [mode, setMode] = useState<"guided" | "immediate">("guided");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [requestId, setRequestId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState("");
  async function review() {
    setStatus("");
    setConfirmed(false);
    const id = crypto.randomUUID();
    setRequestId(id);
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-access/${accessId}/handover?mode=${mode}`,
    );
    if (!response.ok) return setStatus(t.error);
    setSnapshot((await response.json()).data);
  }
  async function finish() {
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/wedding-access/${accessId}/handover`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, requestId }),
      },
    );
    if (!response.ok) return setStatus(t.error);
    setStatus(t.done);
    onComplete();
  }
  return (
    <section aria-label={t.title}>
      <Heading>{t.title}</Heading>
      <fieldset>
        <legend className="screen-reader-only">{t.title}</legend>
        <label>
          <input
            checked={mode === "guided"}
            name={`exit-${accessId}`}
            onChange={() => {
              setMode("guided");
              setSnapshot(null);
            }}
            type="radio"
          />
          {t.guided}
        </label>
        <label>
          <input
            checked={mode === "immediate"}
            name={`exit-${accessId}`}
            onChange={() => {
              setMode("immediate");
              setSnapshot(null);
            }}
            type="radio"
          />
          {t.immediate}
        </label>
      </fieldset>
      <button className="button--secondary" type="button" onClick={review}>
        {t.review}
      </button>
      {snapshot ? (
        <div role="group" aria-label={t.review}>
          {mode === "guided" ? (
            <dl>
              <div>
                <dt>{t.assignments}</dt>
                <dd>{snapshot.activeAssignmentCount}</dd>
              </div>
              <div>
                <dt>{t.lead}</dt>
                <dd>{snapshot.leadAssigned ? t.yes : t.no}</dd>
              </div>
              <div>
                <dt>{t.invitations}</dt>
                <dd>{snapshot.pendingInvitationCount}</dd>
              </div>
              <div>
                <dt>{t.responsibilities}</dt>
                <dd>{snapshot.unresolvedResponsibilityCount}</dd>
              </div>
            </dl>
          ) : null}
          <p>{t.retained}</p>
          <p>{t.private}</p>
          <p>
            <strong>{t.consequence}</strong>
          </p>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            {t.confirm}
          </label>
          <button
            className="button--destructive"
            disabled={!confirmed || !requestId}
            type="button"
            onClick={finish}
          >
            {t.finish}
          </button>
        </div>
      ) : null}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
