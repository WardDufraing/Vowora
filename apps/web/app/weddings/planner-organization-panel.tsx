"use client";
import { useMemo, useRef, useState } from "react";
const copy = {
  en: {
    title: "Planner organization",
    org: "Organization ID",
    invite: "Invite organization",
    busy: "Sending…",
    ok: "Invitation sent",
    error: "Invitation could not be sent",
    permissions: "Access ceiling",
    active: "Active planner organization",
    team: "Assigned team",
    lead: "Lead planner",
    block: "Block access",
    unblock: "Lift block",
    revoke: "Revoke organization access",
    changed: "Access updated",
    pending: "Pending organization invitation",
    expires: "Expires",
    revokeInvitation: "Revoke invitation",
    reissue: "Prepare replacement",
    confirmReissue: "Reissue invitation",
    roles: { owner: "Owner", manager: "Manager", employee: "Employee" },
    view: "View",
    edit: "Edit",
    download: "Download / export",
    areas: {
      settings: "Settings",
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
    },
  },
  nl: {
    title: "Plannersorganisatie",
    org: "Organisatie-ID",
    invite: "Organisatie uitnodigen",
    busy: "Verzenden…",
    ok: "Uitnodiging verzonden",
    error: "Uitnodiging kon niet worden verzonden",
    permissions: "Toegangslimiet",
    active: "Actieve plannersorganisatie",
    team: "Toegewezen team",
    lead: "Hoofdplanner",
    block: "Toegang blokkeren",
    unblock: "Blokkering opheffen",
    revoke: "Organisatietoegang intrekken",
    changed: "Toegang bijgewerkt",
    pending: "Openstaande organisatie-uitnodiging",
    expires: "Verloopt",
    revokeInvitation: "Uitnodiging intrekken",
    reissue: "Vervanging voorbereiden",
    confirmReissue: "Uitnodiging opnieuw uitgeven",
    roles: { owner: "Eigenaar", manager: "Manager", employee: "Medewerker" },
    view: "Bekijken",
    edit: "Bewerken",
    download: "Downloaden / exporteren",
    areas: {
      settings: "Instellingen",
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
    },
  },
  fr: {
    title: "Organisation de planification",
    org: "Identifiant de l’organisation",
    invite: "Inviter l’organisation",
    busy: "Envoi…",
    ok: "Invitation envoyée",
    error: "Impossible d’envoyer l’invitation",
    permissions: "Plafond d’accès",
    active: "Organisation de planification active",
    team: "Équipe affectée",
    lead: "Planificateur principal",
    block: "Bloquer l’accès",
    unblock: "Lever le blocage",
    revoke: "Révoquer l’accès de l’organisation",
    changed: "Accès mis à jour",
    pending: "Invitation d’organisation en attente",
    expires: "Expire",
    revokeInvitation: "Révoquer l’invitation",
    reissue: "Préparer le remplacement",
    confirmReissue: "Réémettre l’invitation",
    roles: {
      owner: "Propriétaire",
      manager: "Responsable",
      employee: "Employé",
    },
    view: "Voir",
    edit: "Modifier",
    download: "Télécharger / exporter",
    areas: {
      settings: "Paramètres",
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
    },
  },
  de: {
    title: "Planungsorganisation",
    org: "Organisations-ID",
    invite: "Organisation einladen",
    busy: "Wird gesendet…",
    ok: "Einladung gesendet",
    error: "Einladung konnte nicht gesendet werden",
    permissions: "Zugriffsgrenze",
    active: "Aktive Planungsorganisation",
    team: "Zugewiesenes Team",
    lead: "Leitende Planung",
    block: "Zugriff sperren",
    unblock: "Sperre aufheben",
    revoke: "Organisationszugriff widerrufen",
    changed: "Zugriff aktualisiert",
    pending: "Ausstehende Organisationseinladung",
    expires: "Läuft ab",
    revokeInvitation: "Einladung widerrufen",
    reissue: "Ersatz vorbereiten",
    confirmReissue: "Einladung neu ausstellen",
    roles: {
      owner: "Inhaber/in",
      manager: "Manager/in",
      employee: "Mitarbeitende",
    },
    view: "Ansehen",
    edit: "Bearbeiten",
    download: "Herunterladen / exportieren",
    areas: {
      settings: "Einstellungen",
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
    },
  },
} as const;
const areas = [
  "settings",
  "tasks",
  "schedule",
  "guests",
  "contacts",
  "vendors",
  "budget",
  "documents",
  "notes",
  "decisions",
  "inspiration",
] as const;
export function PlannerOrganizationPanel({
  weddingId,
  locale,
  initialAccess,
  initialInvitations,
}: {
  weddingId: string;
  locale: keyof typeof copy;
  initialAccess: {
    id: string;
    organizationId: string;
    organizationName: string;
    assignments: Array<{
      id: string;
      organizationMembershipId: string;
      name: string;
      role: string;
      isLead: boolean;
      active: boolean;
      blocked: boolean;
    }>;
  } | null;
  initialInvitations: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    status: string;
    permissionCeiling: Array<{
      area: string;
      actions: Array<"view" | "edit" | "download_export">;
    }>;
    expiresAt: string;
  }>;
}) {
  const t = copy[locale];
  const [org, setOrg] = useState("");
  const [selected, setSelected] = useState<
    Record<string, Set<"view" | "edit" | "download_export">>
  >({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [access, setAccess] = useState(initialAccess);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [reissueInvitationId, setReissueInvitationId] = useState<
    string | undefined
  >();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const ceiling = useMemo(
    () =>
      areas.flatMap((area) => {
        const actions = selected[area];
        return actions?.size ? [{ area, actions: [...actions] }] : [];
      }),
    [selected],
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const fingerprint = JSON.stringify({
      organizationId: org.trim(),
      permissionCeiling: ceiling,
      reissueInvitationId: reissueInvitationId ?? null,
    });
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const r = await fetch(
        `/api/v1/weddings/${weddingId}/planner-organizations/invitations`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": retry.current.key,
          },
          body: JSON.stringify({
            organizationId: org,
            permissionCeiling: ceiling,
            ...(reissueInvitationId ? { reissueInvitationId } : {}),
          }),
        },
      );
      if (!r.ok) {
        if (r.status === 409) {
          retry.current = null;
          await refreshInvitations();
        }
        throw new Error();
      }
      const payload = await r.json();
      retry.current = null;
      setInvitations([payload.data]);
      setReissueInvitationId(undefined);
      setStatus(t.ok);
    } catch {
      setStatus(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function refreshInvitations() {
    const response = await fetch(
      `/api/v1/weddings/${weddingId}/planner-organizations/invitations`,
    );
    if (!response.ok) return;
    const payload = await response.json();
    setInvitations(payload.data);
  }
  async function revokeInvitation(invitationId: string) {
    setStatus("");
    const response = await fetch(
      `/api/v1/weddings/${weddingId}/planner-organizations/invitations/${invitationId}`,
      { method: "DELETE" },
    );
    if (!response.ok) return setStatus(t.error);
    setInvitations((current) =>
      current.filter((item) => item.id !== invitationId),
    );
    if (reissueInvitationId === invitationId) setReissueInvitationId(undefined);
    setStatus(t.changed);
  }
  function prepareReissue(invitation: (typeof invitations)[number]) {
    setOrg(invitation.organizationId);
    setSelected(
      Object.fromEntries(
        invitation.permissionCeiling.map((entry) => [
          entry.area,
          new Set(entry.actions),
        ]),
      ),
    );
    setReissueInvitationId(invitation.id);
    retry.current = null;
    setStatus("");
  }
  async function refreshAccess() {
    if (!access) return;
    const response = await fetch(
      `/api/v1/weddings/${weddingId}/planner-organizations/access/${access.id}`,
    );
    if (!response.ok) return;
    const payload = await response.json();
    setAccess(payload.data);
  }
  async function restrict(organizationMembershipId: string, blocked: boolean) {
    setStatus("");
    const response = await fetch(
      `/api/v1/weddings/${weddingId}/planner-organizations/access/${access!.id}/restrictions`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationMembershipId, blocked }),
      },
    );
    if (!response.ok) return setStatus(t.error);
    await refreshAccess();
    setStatus(t.changed);
  }
  async function revoke() {
    setStatus("");
    const response = await fetch(
      `/api/v1/weddings/${weddingId}/planner-organizations/access/${access!.id}`,
      { method: "DELETE" },
    );
    if (!response.ok) return setStatus(t.error);
    setAccess(null);
    setStatus(t.changed);
  }
  return (
    <section aria-labelledby="planner-org-title">
      <h2 id="planner-org-title">{t.title}</h2>
      {access ? (
        <div>
          <h3>{t.active}</h3>
          <p>{access.organizationName}</p>
          <h4>{t.team}</h4>
          <ul>
            {access.assignments.map((assignment) => (
              <li key={assignment.id}>
                {assignment.name} —{" "}
                {t.roles[assignment.role as keyof typeof t.roles]}
                {assignment.isLead ? ` — ${t.lead}` : ""}
                <button
                  type="button"
                  onClick={() =>
                    restrict(
                      assignment.organizationMembershipId,
                      !assignment.blocked,
                    )
                  }
                >
                  {assignment.blocked ? t.unblock : t.block}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={revoke}>
            {t.revoke}
          </button>
        </div>
      ) : (
        <>
          {invitations
            .filter((invitation) => invitation.status === "pending")
            .map((invitation) => (
              <article key={invitation.id}>
                <h3>{t.pending}</h3>
                <p>{invitation.organizationName}</p>
                <p>
                  {t.expires}:{" "}
                  {new Date(invitation.expiresAt).toLocaleString(locale)}
                </p>
                <button
                  type="button"
                  onClick={() => prepareReissue(invitation)}
                >
                  {t.reissue}
                </button>
                <button
                  type="button"
                  onClick={() => revokeInvitation(invitation.id)}
                >
                  {t.revokeInvitation}
                </button>
              </article>
            ))}
          <form onSubmit={submit}>
            <label>
              {t.org}
              <input
                required
                value={org}
                onChange={(e) => setOrg(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>{t.permissions}</legend>
              {areas.map((area) => (
                <fieldset key={area}>
                  <legend>{t.areas[area]}</legend>
                  {(
                    [
                      ["view", t.view],
                      ["edit", t.edit],
                      ["download_export", t.download],
                    ] as const
                  ).map(([action, label]) => (
                    <label key={action}>
                      <input
                        type="checkbox"
                        aria-label={`${t.areas[area]}: ${label}`}
                        checked={selected[area]?.has(action) ?? false}
                        onChange={() =>
                          setSelected((current) => {
                            const next = { ...current };
                            const actions = new Set(next[area] ?? []);
                            if (actions.has(action)) actions.delete(action);
                            else actions.add(action);
                            if (action !== "view" && actions.size > 0)
                              actions.add("view");
                            if (action === "view" && !actions.has("view")) {
                              actions.delete("edit");
                              actions.delete("download_export");
                            }
                            if (actions.size) next[area] = actions;
                            else delete next[area];
                            return next;
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
              ))}
            </fieldset>
            <button disabled={busy || !org || ceiling.length === 0}>
              {busy
                ? t.busy
                : reissueInvitationId
                  ? t.confirmReissue
                  : t.invite}
            </button>
          </form>
        </>
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
