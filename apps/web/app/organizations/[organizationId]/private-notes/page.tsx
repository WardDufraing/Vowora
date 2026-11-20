import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getAuth } from "../../../../lib/auth";
import {
  organizationLocale,
  organizationMessages,
} from "../../../../lib/organization-messages";
import { loadOrganizationPrivateNotes } from "../../../../lib/organization-service";
import { OrganizationNavigation } from "../organization-navigation";
import { OrganizationPrivateNotes } from "./private-notes";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { organizationId } = await params;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) notFound();
  const locale = organizationLocale((await searchParams).locale);
  const messages = organizationMessages(locale);
  const notes = await loadOrganizationPrivateNotes({
    actorId: session.user.id,
    correlationId: randomUUID(),
    organizationId,
  }).catch(() => null);
  if (!notes) notFound();
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <OrganizationNavigation
        active="private-notes"
        locale={locale}
        messages={messages}
        organizationId={organizationId}
      />
      <OrganizationPrivateNotes
        initialNotes={notes}
        locale={locale}
        organizationId={organizationId}
      />
    </main>
  );
}
