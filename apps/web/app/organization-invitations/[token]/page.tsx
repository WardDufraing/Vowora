import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../lib/auth";
import { safeAuthContinuation } from "../../../lib/auth-continuation";
import {
  organizationLocale,
  organizationMessages,
} from "../../../lib/organization-messages";
import { loadOrganizationInvitationForActor } from "../../../lib/organization-service";
import { OrganizationInvitationAcceptance } from "../invitation-acceptance";

export const dynamic = "force-dynamic";

export default async function OrganizationInvitationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ token: string }>;
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  const token = (await params).token;
  const locale = organizationLocale((await searchParams).locale);
  const next = safeAuthContinuation(
    `/organization-invitations/${token}?locale=${locale}`,
  );
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  const invitation = await loadOrganizationInvitationForActor(session.user.id, {
    token,
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
        endpoint={`/api/v1/organization-invitations/${token}/accept`}
        expired={invitation.expired}
        messages={organizationMessages(locale)}
        organizationName={invitation.organizationName}
      />
    </main>
  );
}
