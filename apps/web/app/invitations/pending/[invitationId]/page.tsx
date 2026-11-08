import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAuth } from "../../../../lib/auth";
import {
  weddingLocale,
  weddingMessages,
} from "../../../../lib/wedding-messages";
import { loadPartnerInvitationForActor } from "../../../../lib/wedding-service";
import { InvitationAcceptance } from "../../[token]/invitation-acceptance";

export const dynamic = "force-dynamic";

export default async function PendingInvitationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly invitationId: string }>;
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const invitationId = z.uuidv7().safeParse((await params).invitationId);
  if (!invitationId.success) redirect("/sign-in");
  const locale = weddingLocale((await searchParams).locale);
  const path = `/invitations/pending/${invitationId.data}?locale=${locale}`;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  const invitation = await loadPartnerInvitationForActor({
    actorId: session.user.id,
    invitationId: invitationId.data,
  });
  return (
    <div lang={locale}>
      <InvitationAcceptance
        endpoint={`/api/v1/invitations/pending/${invitationId.data}/accept`}
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
