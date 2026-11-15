import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getAuth } from "../../../../lib/auth";
import {
  organizationLocale,
  organizationMessages,
} from "../../../../lib/organization-messages";
import {
  loadOrganizationStaff,
  loadCurrentLeadWeddingContext,
  loadPlannerWeddingAccesses,
  loadPlannerWeddingInvitations,
} from "../../../../lib/organization-service";
import { PlannerWeddingAccessManager } from "./planner-wedding-access-manager";
import { PlannerWeddingInvitations } from "./planner-wedding-invitations";
import { OrganizationNavigation } from "../organization-navigation";
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
  let invitations: Awaited<ReturnType<typeof loadPlannerWeddingInvitations>>;
  let accesses: Awaited<ReturnType<typeof loadPlannerWeddingAccesses>>;
  let staff: readonly {
    id: string;
    name: string;
    email: string;
    status: "active" | "revoked";
  }[];
  let currentMembershipId: string | undefined;
  let canManageAssignments = true;
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
    try {
      const lead = await loadCurrentLeadWeddingContext({
        actorId: session.user.id,
        organizationId,
      });
      invitations = [];
      accesses = lead.accesses;
      staff = lead.staff;
      currentMembershipId = lead.currentMembershipId;
      canManageAssignments = false;
    } catch {
      notFound();
    }
  }
  const initial = invitations.map(({ invitation, weddingName }) => ({
    invitation: {
      id: invitation.id,
      expiresAt: invitation.expiresAt,
    },
    weddingName,
  }));
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <OrganizationNavigation
        active="weddings"
        locale={locale}
        messages={messages}
        organizationId={organizationId}
        showStaff={canManageAssignments}
      />
      {!canManageAssignments ? <h1>{messages.weddingsNavigation}</h1> : null}
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
          currentMembershipId ??
          staff.find(
            (member) =>
              member.email.toLowerCase() === session.user.email.toLowerCase(),
          )?.id
        }
        canManageAssignments={canManageAssignments}
        locale={locale}
      />
    </main>
  );
}
