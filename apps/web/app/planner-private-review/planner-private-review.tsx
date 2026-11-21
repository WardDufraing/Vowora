"use client";

import { OrganizationPrivateNotes } from "../organizations/[organizationId]/private-notes/private-notes";
import { PlannerWeddingHandover } from "../organizations/[organizationId]/weddings/planner-wedding-handover";

export function PlannerPrivateReview({
  locale,
  organizationId,
}: {
  locale: "en" | "nl" | "fr" | "de";
  organizationId: string;
}) {
  return (
    <>
      <OrganizationPrivateNotes
        organizationId={organizationId}
        locale={locale}
        initialNotes={[
          {
            id: "019a2f36-0eb9-7000-8000-000000000003",
            weddingId: "019a2f36-0eb9-7000-8000-000000000004",
            title: "Supplier concern",
            body: "Internal follow-up for active staff only.",
            status: "active",
            archivedAt: null,
            createdAt: "2026-11-17T10:00:00.000Z",
            updatedAt: "2026-11-17T10:00:00.000Z",
            editable: true,
          },
        ]}
      />
      <PlannerWeddingHandover
        organizationId={organizationId}
        accessId="019a2f36-0eb9-7000-8000-000000000005"
        locale={locale}
        onComplete={() => undefined}
        headingLevel={2}
      />
    </>
  );
}
