import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { AppShell } from "../../../../components/app-shell";
import { WorkspaceUnavailable } from "../../../../components/workspace-unavailable";
import { getAuth } from "../../../../lib/auth";
import {
  weddingLocale,
  weddingMessages,
} from "../../../../lib/wedding-messages";
import { resolveWeddingShellNavigation } from "../../../../lib/workspace-navigation";
import {
  loadPlannerOrganizationAccessForActor,
  loadPlannerOrganizationInvitationsForActor,
  loadWeddingSettingsForActor,
} from "../../../../lib/wedding-service";
import { WeddingForm } from "../../wedding-form";
import { PartnerInvitationForm } from "../../partner-invitation-form";
import { PlannerOrganizationPanel } from "../../planner-organization-panel";

export const dynamic = "force-dynamic";

export default async function WeddingSettingsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly weddingId: string }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const weddingId = z.uuidv7().safeParse((await params).weddingId);
  if (!weddingId.success) notFound();
  const locale = weddingLocale((await searchParams).locale);
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) {
    const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
    redirect(
      `/sign-in?next=${encodeURIComponent(`/weddings/${weddingId.data}/settings${localeQuery}`)}`,
    );
  }

  let pageData;
  try {
    const loaded = await loadWeddingSettingsForActor({
      actorId: session.user.id,
      correlationId: randomUUID(),
      weddingId: weddingId.data,
    });
    if (!loaded) notFound();
    const navigation = resolveWeddingShellNavigation({
      actorId: session.user.id,
      weddingId: weddingId.data,
      membership: loaded.membership,
      workspaces: loaded.workspaces,
      requestedPath: `/weddings/${weddingId.data}/settings`,
      locale,
    });
    pageData = { loaded, navigation };
  } catch {
    return <WorkspaceUnavailable kind="wedding" locale={locale} />;
  }
  const messages = weddingMessages(locale);
  const plannerAccess =
    pageData.loaded.membership.role === "partner"
      ? await loadPlannerOrganizationAccessForActor({
          actorId: session.user.id,
          correlationId: randomUUID(),
          weddingId: weddingId.data,
        })
      : null;
  const plannerInvitations =
    pageData.loaded.membership.role === "partner" && !plannerAccess
      ? await loadPlannerOrganizationInvitationsForActor({
          actorId: session.user.id,
          correlationId: randomUUID(),
          weddingId: weddingId.data,
        })
      : [];
  return (
    <AppShell model={pageData.navigation}>
      <div lang={locale}>
        <nav aria-label={messages.language} className="language-links">
          {(["en", "nl", "fr", "de"] as const).map((language) => (
            <a
              aria-current={language === locale ? "page" : undefined}
              href={`/weddings/${weddingId.data}/settings?locale=${language}`}
              key={language}
            >
              {language.toUpperCase()}
            </a>
          ))}
        </nav>
        <p className="eyebrow">{messages.settingsEyebrow}</p>
        <h1>{messages.settingsTitle}</h1>
        <WeddingForm
          endpoint={`/api/v1/weddings/${weddingId.data}`}
          initial={{ ...pageData.loaded.wedding }}
          messages={messages}
          mode="settings"
        />
        <PartnerInvitationForm
          endpoint={`/api/v1/weddings/${weddingId.data}/invitations`}
          locale={locale}
          messages={messages}
        />
        {pageData.loaded.membership.role === "partner" ? (
          <PlannerOrganizationPanel
            weddingId={weddingId.data}
            locale={locale}
            initialAccess={plannerAccess}
            initialInvitations={plannerInvitations.map(
              ({ invitation, organizationName }) => ({
                id: invitation.id,
                organizationId: invitation.organizationId,
                organizationName,
                status: invitation.status,
                permissionCeiling: invitation.permissionCeiling,
                expiresAt: invitation.expiresAt,
              }),
            )}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
