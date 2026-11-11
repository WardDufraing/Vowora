import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../lib/auth";
import {
  organizationLocale,
  organizationMessages,
} from "../../../lib/organization-messages";
import { OrganizationForm } from "../organization-form";

export const dynamic = "force-dynamic";

export default async function NewOrganizationPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect("/sign-in?next=/organizations/new");
  const locale = organizationLocale((await searchParams).locale);
  const messages = organizationMessages(locale);
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <section className="account-card" aria-labelledby="organization-title">
        <h1 id="organization-title">{messages.createTitle}</h1>
        {session.user.emailVerified ? (
          <OrganizationForm messages={messages} />
        ) : (
          <p role="alert">{messages.verifyEmail}</p>
        )}
      </section>
    </main>
  );
}
