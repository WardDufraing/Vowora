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
    view: "View",
    edit: "Edit",
    download: "Download / export",
  },
  nl: {
    title: "Plannersorganisatie",
    org: "Organisatie-ID",
    invite: "Organisatie uitnodigen",
    busy: "Verzenden…",
    ok: "Uitnodiging verzonden",
    error: "Uitnodiging kon niet worden verzonden",
    permissions: "Toegangslimiet",
    view: "Bekijken",
    edit: "Bewerken",
    download: "Downloaden / exporteren",
  },
  fr: {
    title: "Organisation de planification",
    org: "Identifiant de l’organisation",
    invite: "Inviter l’organisation",
    busy: "Envoi…",
    ok: "Invitation envoyée",
    error: "Impossible d’envoyer l’invitation",
    permissions: "Plafond d’accès",
    view: "Voir",
    edit: "Modifier",
    download: "Télécharger / exporter",
  },
  de: {
    title: "Planungsorganisation",
    org: "Organisations-ID",
    invite: "Organisation einladen",
    busy: "Wird gesendet…",
    ok: "Einladung gesendet",
    error: "Einladung konnte nicht gesendet werden",
    permissions: "Zugriffsgrenze",
    view: "Ansehen",
    edit: "Bearbeiten",
    download: "Herunterladen / exportieren",
  },
} as const;
const areas = [
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
}: {
  weddingId: string;
  locale: keyof typeof copy;
}) {
  const t = copy[locale];
  const [org, setOrg] = useState("");
  const [selected, setSelected] = useState<
    Record<string, Set<"view" | "edit" | "download_export">>
  >({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
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
    try {
      const r = await fetch(
        `/api/v1/weddings/${weddingId}/planner-organizations/invitations`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": key.current,
          },
          body: JSON.stringify({
            organizationId: org,
            permissionCeiling: ceiling,
          }),
        },
      );
      if (!r.ok) throw new Error();
      key.current = crypto.randomUUID();
      setStatus(t.ok);
    } catch {
      setStatus(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="planner-org-title">
      <h2 id="planner-org-title">{t.title}</h2>
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
              <legend>{area}</legend>
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
                    aria-label={`${area}: ${label}`}
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
          {busy ? t.busy : t.invite}
        </button>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </form>
    </section>
  );
}
