import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { readServerEnvironment } from "../../lib/env";
import {
  resolveWeddingShellNavigation,
  WeddingNavigationAccessError,
  weddingNavigationDestinationIds,
} from "../../lib/workspace-navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vowora app shell review",
  robots: { index: false, follow: false },
};

const actorId = "019a1f5e-70a0-7000-8000-000000000001";
const weddingId = "019a1f5e-70a0-7000-8000-000000000002";
const otherWeddingId = "019a1f5e-70a0-7000-8000-000000000003";

function createReviewModel(role: "partner" | "coordinator", requested: string) {
  try {
    return resolveWeddingShellNavigation({
      actorId,
      weddingId,
      membership: {
        actorId,
        weddingId,
        role,
        status: "active",
        accessExpiresAt: role === "partner" ? null : "2027-06-20T00:00:00.000Z",
        permissionOverrides: [],
      },
      workspaces: [
        {
          weddingId,
          name: "Jordan & Alex",
          weddingDate: "2027-06-12",
          lastOpenedAt: "2026-10-30T09:00:00.000Z",
          membership: {
            actorId,
            weddingId,
            role,
            status: "active",
            accessExpiresAt:
              role === "partner" ? null : "2027-06-20T00:00:00.000Z",
            permissionOverrides: [],
          },
        },
        {
          weddingId: otherWeddingId,
          name: "Morgan & Riley",
          weddingDate: null,
          lastOpenedAt: "2026-10-29T09:00:00.000Z",
          membership: {
            actorId,
            weddingId: otherWeddingId,
            role: "planner",
            status: "active",
            accessExpiresAt: null,
            permissionOverrides: [],
          },
        },
      ],
      requestedPath: `/weddings/${weddingId}/${requested}`,
      evaluatedAt: new Date("2026-10-30T10:00:00.000Z"),
    });
  } catch (error) {
    if (error instanceof WeddingNavigationAccessError) notFound();
    throw error;
  }
}

export default async function AppShellReviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (readServerEnvironment().VOWORA_ENV === "production") notFound();
  const query = await searchParams;
  const role = query.role === "coordinator" ? "coordinator" : "partner";
  const requested =
    typeof query.destination === "string" &&
    weddingNavigationDestinationIds.includes(query.destination as never)
      ? query.destination
      : "dashboard";
  const model = createReviewModel(role, requested);
  return (
    <AppShell model={model}>
      <p className="eyebrow">Responsive shell review · synthetic content</p>
      <h1>
        {
          model.destinations.find(({ id }) => id === model.activeDestination)
            ?.label
        }
      </h1>
      <p className="lede">
        This non-production fixture validates permission-aware navigation and
        responsive behavior. Feature data and workflows remain intentionally
        absent.
      </p>
      <section
        className="shell-placeholder"
        aria-labelledby="shell-state-heading"
      >
        <h2 id="shell-state-heading">Permission-limited preview</h2>
        <p>
          Only destinations granted by the server-owned membership projection
          appear in this shell.
        </p>
      </section>
    </AppShell>
  );
}
