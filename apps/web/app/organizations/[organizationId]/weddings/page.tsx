import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getAuth } from "../../../../lib/auth";
import { loadPlannerWeddingInvitations } from "../../../../lib/organization-service";
import { PlannerWeddingInvitations } from "./planner-wedding-invitations";
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
  const raw = (await searchParams).locale;
  const locale = raw === "nl" || raw === "fr" || raw === "de" ? raw : "en";
  let invitations;
  try {
    invitations = await loadPlannerWeddingInvitations({
      actorId: session.user.id,
      correlationId: randomUUID(),
      organizationId,
    });
  } catch {
    notFound();
  }
  const initial = invitations.map(({ invitation, weddingName }) => ({
    invitation: {
      id: invitation.id,
      expiresAt: invitation.expiresAt.toISOString(),
    },
    weddingName,
  }));
  return (
    <PlannerWeddingInvitations
      organizationId={organizationId}
      initial={initial}
      locale={locale}
    />
  );
}
