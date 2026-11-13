import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getAuth } from "../../../../lib/auth";
import {
  loadOrganizationStaff,
  loadPlannerWeddingAccesses,
  loadPlannerWeddingInvitations,
} from "../../../../lib/organization-service";
import { PlannerWeddingAccessManager } from "./planner-wedding-access-manager";
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
  let accesses;
  let staff;
  try {
    [invitations, accesses, staff] = await Promise.all([
      loadPlannerWeddingInvitations({
        actorId: session.user.id,
        correlationId: randomUUID(),
        organizationId,
      }),
      loadPlannerWeddingAccesses({
        actorId: session.user.id,
        correlationId: randomUUID(),
        organizationId,
      }),
      loadOrganizationStaff({
        actorId: session.user.id,
        correlationId: randomUUID(),
        organizationId,
      }),
    ]);
  } catch {
    notFound();
  }
  const initial = invitations.map(({ invitation, weddingName }) => ({
    invitation: {
      id: invitation.id,
      expiresAt: invitation.expiresAt,
    },
    weddingName,
  }));
  return (
    <main lang={locale}>
      <PlannerWeddingInvitations
        organizationId={organizationId}
        initial={initial}
        locale={locale}
      />
      <PlannerWeddingAccessManager
        organizationId={organizationId}
        initialAccesses={accesses}
        staff={staff}
        currentMembershipId={
          staff.find(
            (member) =>
              member.email.toLowerCase() === session.user.email.toLowerCase(),
          )?.id
        }
        locale={locale}
      />
    </main>
  );
}
