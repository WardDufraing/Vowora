import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../../lib/auth";
import { safeAuthContinuation } from "../../../../lib/auth-continuation";
import {
  organizationLocale,
  organizationMessages,
} from "../../../../lib/organization-messages";
import { loadOrganizationInvitationForActor } from "../../../../lib/organization-service";
import { OrganizationInvitationAcceptance } from "../../invitation-acceptance";

export const dynamic = "force-dynamic";

export default async function PendingOrganizationInvitationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ invitationId: string }>;
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  const invitationId = (await params).invitationId;
  const locale = organizationLocale((await searchParams).locale);
  const next = safeAuthContinuation(
    `/organization-invitations/pending/${invitationId}?locale=${locale}`,
  );
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  const invitation = await loadOrganizationInvitationForActor(session.user.id, {
    invitationId,
  });
  if (!invitation)
    return (
      <main className="account-page" id="main-content" lang={locale}>
        <p role="alert">{organizationMessages(locale).error}</p>
      </main>
    );
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <OrganizationInvitationAcceptance
        endpoint={`/api/v1/organization-invitations/pending/${invitationId}/accept`}
        expired={invitation.expired}
        locale={locale}
        messages={organizationMessages(locale)}
        organizationName={invitation.organizationName}
      />
    </main>
  );
}
