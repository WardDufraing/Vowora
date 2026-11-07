import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../lib/auth";
import { weddingLocale, weddingMessages } from "../../../lib/wedding-messages";
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
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) {
    const next = encodeURIComponent(`/invitations/${token}`);
    redirect(`/sign-in?next=${next}`);
  }
  const locale = weddingLocale((await searchParams).locale);
  return (
    <div lang={locale}>
      <InvitationAcceptance messages={weddingMessages(locale)} token={token} />
    </div>
  );
}
