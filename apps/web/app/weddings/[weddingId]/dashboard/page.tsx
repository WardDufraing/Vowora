import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { AppShell } from "../../../../components/app-shell";
import { WorkspaceUnavailable } from "../../../../components/workspace-unavailable";
import { getAuth } from "../../../../lib/auth";
import { weddingLocale } from "../../../../lib/wedding-messages";
import { loadWeddingShellForActor } from "../../../../lib/wedding-service";
import { resolveWeddingShellNavigation } from "../../../../lib/workspace-navigation";

export const dynamic = "force-dynamic";

export default async function WeddingDashboardPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly weddingId: string }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const weddingId = z.uuidv7().safeParse((await params).weddingId);
  if (!weddingId.success) notFound();
  const locale = weddingLocale((await searchParams).locale);
  const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/weddings/${weddingId.data}/dashboard${localeQuery}`)}`,
    );
  }
  let navigation;
  try {
    const loaded = await loadWeddingShellForActor({
      actorId: session.user.id,
      weddingId: weddingId.data,
    });
    if (!loaded) throw new Error("unavailable");
    navigation = resolveWeddingShellNavigation({
      actorId: session.user.id,
      weddingId: weddingId.data,
      membership: loaded.current.membership,
      workspaces: loaded.workspaces,
      requestedPath: `/weddings/${weddingId.data}/dashboard`,
      locale,
    });
  } catch {
    return <WorkspaceUnavailable kind="wedding" locale={locale} />;
  }
  return (
    <AppShell model={navigation}>
      <div lang={locale}>
        <h1>{navigation.labels.dashboardTitle}</h1>
        <p className="lede">{navigation.labels.dashboardDescription}</p>
      </div>
    </AppShell>
  );
}
