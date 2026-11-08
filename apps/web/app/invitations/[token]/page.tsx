import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../lib/auth";
import { weddingLocale, weddingMessages } from "../../../lib/wedding-messages";
import { loadPartnerInvitationForActor } from "../../../lib/wedding-service";
import { InvitationAcceptance } from "./invitation-acceptance";

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly token: string }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const token = (await params).token;
  if (token.length < 32 || token.length > 256) redirect("/sign-in");
  const locale = weddingLocale((await searchParams).locale);
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) {
    const next = encodeURIComponent(`/invitations/${token}?locale=${locale}`);
    redirect(`/sign-in?next=${next}`);
  }
  const invitation = await loadPartnerInvitationForActor({
    actorId: session.user.id,
    token,
  });
  return (
    <div lang={locale}>
      <InvitationAcceptance
        endpoint={`/api/v1/invitations/${encodeURIComponent(token)}/accept`}
        expiresAt={invitation?.expiresAt}
        initiallyExpired={
          invitation ? Date.parse(invitation.expiresAt) <= Date.now() : false
        }
        locale={locale}
        messages={weddingMessages(locale)}
      />
    </div>
  );
}
