import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceChooser } from "../../components/workspace-chooser";
import { getAuth } from "../../lib/auth";
import { weddingLocale, weddingMessages } from "../../lib/wedding-messages";
import { loadWeddingWorkspaceEntryForActor } from "../../lib/wedding-service";
import { workspaceMessages } from "../../lib/workspace-messages";

export const dynamic = "force-dynamic";

export default async function WeddingWorkspaceEntryPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly choose?: string;
    readonly locale?: string;
  }>;
}) {
  const query = await searchParams;
  const locale = weddingLocale(query.locale);
  const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/weddings${localeQuery}`)}`);
  }
  const entry = await loadWeddingWorkspaceEntryForActor({
    actorId: session.user.id,
  });
  if (query.choose !== "true" && entry.lastOpenedAccessibleWeddingId) {
    redirect(
      `/weddings/${entry.lastOpenedAccessibleWeddingId}/dashboard${localeQuery}`,
    );
  }
  const labels = workspaceMessages(locale);
  const formLabels = weddingMessages(locale);
  if (entry.accessibleWorkspaces.length === 0) {
    return (
      <main className="workspace-entry" id="main-content" lang={locale}>
        <h1>{labels.noWorkspacesTitle}</h1>
        <p>{labels.noWorkspacesDescription}</p>
        <a
          className="button button--primary"
          href={`/weddings/new${localeQuery}`}
        >
          {formLabels.create}
        </a>
      </main>
    );
  }
  return (
    <main className="workspace-entry" id="main-content" lang={locale}>
      <WorkspaceChooser
        labels={labels}
        workspaces={entry.accessibleWorkspaces.map((workspace) => ({
          weddingId: workspace.weddingId,
          name: workspace.name,
          dateLabel: workspace.weddingDate ?? labels.dateNotSet,
          roleLabel: labels.roles[workspace.membership.role] ?? "",
          href: `/weddings/${workspace.weddingId}/dashboard${localeQuery}`,
        }))}
      />
    </main>
  );
}
