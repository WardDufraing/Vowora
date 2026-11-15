import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { readServerEnvironment } from "../../lib/env";
import {
  organizationLocale,
  organizationMessages,
} from "../../lib/organization-messages";
import { OrganizationNavigation } from "../organizations/[organizationId]/organization-navigation";
import { PlannerWeddingAccessManager } from "../organizations/[organizationId]/weddings/planner-wedding-access-manager";
import { PlannerWeddingInvitations } from "../organizations/[organizationId]/weddings/planner-wedding-invitations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vowora planner organization review",
  robots: { index: false, follow: false },
};

const organizationId = "019a2f36-0eb9-7000-8000-000000000002";

export default async function OrganizationManagementReviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  if (readServerEnvironment().VOWORA_ENV === "production") notFound();
  const locale = organizationLocale((await searchParams).locale);
  const messages = organizationMessages(locale);
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <OrganizationNavigation
        active="weddings"
        locale={locale}
        messages={messages}
        organizationId={organizationId}
      />
      <PlannerWeddingInvitations
        organizationId={organizationId}
        initial={[
          {
            invitation: {
              id: "019a2f36-0eb9-7000-8000-000000000003",
              expiresAt: "2026-11-26T00:00:00.000Z",
            },
            weddingName: "Jordan & Alex",
          },
        ]}
        locale={locale}
      />
      <PlannerWeddingAccessManager
        organizationId={organizationId}
        currentMembershipId="019a2f36-0eb9-7000-8000-000000000004"
        initialAccesses={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000005",
            weddingId: "019a2f36-0eb9-7000-8000-000000000006",
            weddingName: "Morgan & Riley",
            permissionCeiling: [{ area: "tasks", actions: ["view", "edit"] }],
            assignments: [],
          },
        ]}
        locale={locale}
        staff={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000004",
            name: "Alex Morgan",
            email: "alex@example.test",
            status: "active",
          },
        ]}
      />
    </main>
  );
}
