import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { WorkspaceUnavailable } from "../../../../../components/workspace-unavailable";
import { getAuth } from "../../../../../lib/auth";
import { weddingLocale } from "../../../../../lib/wedding-messages";
import { loadWeddingShellForActor } from "../../../../../lib/wedding-service";
import { weddingNavigationDestinationIds } from "../../../../../lib/workspace-navigation";

export const dynamic = "force-dynamic";

const recordDestinations = weddingNavigationDestinationIds.filter(
  (destination) =>
    destination !== "dashboard" &&
    destination !== "settings" &&
    destination !== "reports",
);

export default async function WeddingRecordDeepLinkPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{
    readonly destination: string;
    readonly recordId: string;
    readonly weddingId: string;
  }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const route = await params;
  const weddingId = z.uuidv7().safeParse(route.weddingId);
  const recordId = z.uuidv7().safeParse(route.recordId);
  if (
    !weddingId.success ||
    !recordId.success ||
    !recordDestinations.includes(route.destination as never)
  ) {
    notFound();
  }
  const locale = weddingLocale((await searchParams).locale);
  const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
  const exactPath = `/weddings/${weddingId.data}/${route.destination}/${recordId.data}${localeQuery}`;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(exactPath)}`);
  let accessible = false;
  try {
    accessible = Boolean(
      await loadWeddingShellForActor({
        actorId: session.user.id,
        weddingId: weddingId.data,
      }),
    );
  } catch {
    accessible = false;
  }
  return accessible ? (
    <WorkspaceUnavailable
      kind="item"
      locale={locale}
      weddingId={weddingId.data}
    />
  ) : (
    <WorkspaceUnavailable kind="wedding" locale={locale} />
  );
}
