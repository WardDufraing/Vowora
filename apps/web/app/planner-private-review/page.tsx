import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { readServerEnvironment } from "../../lib/env";
import { PlannerPrivateReview } from "./planner-private-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vowora planner private review",
  robots: { index: false, follow: false },
};

const organizationId = "019a2f36-0eb9-7000-8000-000000000002";

export default async function PlannerPrivateReviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ locale?: string }>;
}) {
  if (readServerEnvironment().VOWORA_ENV === "production") notFound();
  const localeValue = (await searchParams).locale;
  const locale = ["en", "nl", "fr", "de"].includes(localeValue ?? "")
    ? (localeValue as "en" | "nl" | "fr" | "de")
    : "en";
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <PlannerPrivateReview locale={locale} organizationId={organizationId} />
    </main>
  );
}
