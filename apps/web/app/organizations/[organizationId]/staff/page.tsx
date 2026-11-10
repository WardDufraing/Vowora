import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../../lib/auth";
import {
  organizationLocale,
  organizationMessages,
} from "../../../../lib/organization-messages";
import {
  loadOrganizationInvitations,
  loadOrganizationStaff,
} from "../../../../lib/organization-service";
import { StaffInvitationForm } from "./staff-invitation-form";
import { StaffList } from "./staff-list";

export const dynamic = "force-dynamic";
export default async function OrganizationStaffPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ organizationId: string }>;
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect("/sign-in?next=/organizations");
  const organizationId = (await params).organizationId;
  const locale = organizationLocale((await searchParams).locale);
  const messages = organizationMessages(locale);
  let members;
  let invitations;
  try {
    [members, invitations] = await Promise.all([
      loadOrganizationStaff({
        actorId: session.user.id,
        correlationId: randomUUID(),
        organizationId,
      }),
      loadOrganizationInvitations({
        actorId: session.user.id,
        correlationId: randomUUID(),
        organizationId,
      }),
    ]);
  } catch {
    redirect("/weddings");
  }
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <section className="account-card" aria-labelledby="staff-title">
        <h1 id="staff-title">{messages.staffTitle}</h1>
        <StaffList
          initial={members}
          messages={messages}
          organizationId={organizationId}
        />
        <StaffInvitationForm
          endpoint={`/api/v1/organizations/${organizationId}/invitations`}
          initial={invitations}
          locale={locale}
          messages={messages}
        />
      </section>
    </main>
  );
}
