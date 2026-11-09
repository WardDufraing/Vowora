import {
  evaluateWeddingRecordPermission,
  parseWeddingMembership,
  weddingPermissionAreas,
  type WeddingMembership,
  type WeddingPermissionArea,
} from "@vowora/domain";
import { z } from "zod";

import type { AppLocale } from "../i18n/messages";
import {
  workspaceMessages,
  type WorkspaceMessages,
} from "./workspace-messages";

export const weddingNavigationDestinationIds = [
  "dashboard",
  "timeline",
  "decisions",
  "vendors",
  "budget",
  "guests",
  "schedule",
  "contacts",
  "documents-notes",
  "inspiration",
  "reports",
  "settings",
] as const;

export type WeddingNavigationDestinationId =
  (typeof weddingNavigationDestinationIds)[number];

export const mobilePrimaryDestinationIds = [
  "dashboard",
  "timeline",
  "guests",
  "budget",
] as const satisfies readonly WeddingNavigationDestinationId[];

export type WeddingNavigationGroup = "planning" | "people" | "reports";

export interface WeddingNavigationDestination {
  readonly id: WeddingNavigationDestinationId;
  readonly href: string;
  readonly label: string;
  readonly mobile: "primary" | "more" | "none";
  readonly mobileGroup?: WeddingNavigationGroup;
}

export interface WeddingWorkspaceOption {
  readonly weddingId: string;
  readonly name: string;
  readonly dateLabel: string;
  readonly roleLabel: string;
  readonly href: string;
  readonly current: boolean;
}

export interface WeddingShellNavigation {
  readonly activeDestination: WeddingNavigationDestinationId;
  readonly destinations: readonly WeddingNavigationDestination[];
  readonly weddingId: string;
  readonly weddingName: string;
  readonly weddingDateLabel: string;
  readonly roleLabel: string;
  readonly workspaceOptions: readonly WeddingWorkspaceOption[];
  readonly labels: WorkspaceMessages;
}

export function selectMobilePrimaryDestinations(
  destinations: readonly WeddingNavigationDestination[],
): readonly WeddingNavigationDestination[] {
  return mobilePrimaryDestinationIds.flatMap((id) => {
    const destination = destinations.find(
      (candidate) => candidate.id === id && candidate.mobile === "primary",
    );
    return destination ? [destination] : [];
  });
}

export class WeddingNavigationAccessError extends Error {
  constructor() {
    super("The wedding workspace is unavailable");
    this.name = "WeddingNavigationAccessError";
  }
}

const workspaceSchema = z.strictObject({
  weddingId: z.uuidv7(),
  name: z.string().trim().min(1).max(120),
  weddingDate: z.iso.date().nullable(),
  lastOpenedAt: z.iso.datetime({ offset: true }),
  membership: z.unknown(),
});

type WorkspaceInput = Readonly<z.input<typeof workspaceSchema>>;

const relationships = [
  "workspace",
  "assigned",
  "explicitly_shared",
  "essential_contact",
] as const;

function hasAreaPermission(
  membership: WeddingMembership,
  area: WeddingPermissionArea,
  action: "view" | "download_export",
  evaluatedAt: Date,
): boolean {
  return relationships.some(
    (relationship) =>
      evaluateWeddingRecordPermission(
        membership,
        {
          actorId: membership.actorId,
          weddingId: membership.weddingId,
          area,
          action,
          relationship,
          visibility: "wedding_shared",
        },
        evaluatedAt,
      ).allowed,
  );
}

const catalog: readonly Omit<WeddingNavigationDestination, "href" | "label">[] =
  [
    { id: "dashboard", mobile: "primary" },
    { id: "timeline", mobile: "primary" },
    {
      id: "decisions",
      mobile: "more",
      mobileGroup: "planning",
    },
    { id: "vendors", mobile: "more", mobileGroup: "planning" },
    { id: "budget", mobile: "primary" },
    { id: "guests", mobile: "primary" },
    {
      id: "schedule",
      mobile: "more",
      mobileGroup: "planning",
    },
    { id: "contacts", mobile: "more", mobileGroup: "people" },
    {
      id: "documents-notes",
      mobile: "more",
      mobileGroup: "planning",
    },
    {
      id: "inspiration",
      mobile: "more",
      mobileGroup: "planning",
    },
    {
      id: "reports",
      mobile: "more",
      mobileGroup: "reports",
    },
    { id: "settings", mobile: "more" },
  ];

function destinationAllowed(
  id: WeddingNavigationDestinationId,
  membership: WeddingMembership,
  evaluatedAt: Date,
): boolean {
  const view = (area: WeddingPermissionArea) =>
    hasAreaPermission(membership, area, "view", evaluatedAt);
  if (id === "dashboard") return true;
  if (id === "timeline") return view("tasks");
  if (id === "documents-notes") return view("documents") || view("notes");
  if (id === "reports") {
    return weddingPermissionAreas.some((area) =>
      hasAreaPermission(membership, area, "download_export", evaluatedAt),
    );
  }
  if (id === "settings") return membership.role === "partner";
  const areaByDestination: Partial<
    Record<WeddingNavigationDestinationId, WeddingPermissionArea>
  > = {
    decisions: "decisions",
    vendors: "vendors",
    budget: "budget",
    guests: "guests",
    schedule: "schedule",
    contacts: "contacts",
    inspiration: "inspiration",
  };
  const area = areaByDestination[id];
  return area ? view(area) : false;
}

function assertActiveExactMembership(
  membership: WeddingMembership,
  actorId: string,
  weddingId: string,
  evaluatedAt: Date,
): void {
  if (
    membership.actorId !== actorId ||
    membership.weddingId !== weddingId ||
    membership.status !== "active" ||
    (membership.accessExpiresAt !== null &&
      Date.parse(membership.accessExpiresAt) <= evaluatedAt.getTime())
  ) {
    throw new WeddingNavigationAccessError();
  }
}

function readMembership(input: unknown): WeddingMembership {
  try {
    return parseWeddingMembership(input);
  } catch {
    throw new WeddingNavigationAccessError();
  }
}

/**
 * Builds the navigation model exclusively from authenticated, server-loaded
 * membership projections. The returned links are presentation hints; feature
 * routes must still enforce their own 04-b server authorization operation.
 */
export function resolveWeddingShellNavigation(input: {
  readonly actorId: string;
  readonly weddingId: string;
  readonly membership: unknown;
  readonly workspaces: readonly WorkspaceInput[];
  readonly requestedPath?: string;
  readonly evaluatedAt?: Date;
  readonly locale?: AppLocale;
}): WeddingShellNavigation {
  const membership = readMembership(input.membership);
  const evaluatedAt = input.evaluatedAt ?? new Date();
  const locale = input.locale ?? "en";
  const labels = workspaceMessages(locale);
  const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
  assertActiveExactMembership(
    membership,
    input.actorId,
    input.weddingId,
    evaluatedAt,
  );

  const parsedWorkspaces = input.workspaces.map((workspace) => {
    const parsed = workspaceSchema.safeParse(workspace);
    if (!parsed.success) {
      throw new WeddingNavigationAccessError();
    }
    const workspaceMembership = readMembership(parsed.data.membership);
    assertActiveExactMembership(
      workspaceMembership,
      input.actorId,
      parsed.data.weddingId,
      evaluatedAt,
    );
    return { ...parsed.data, membership: workspaceMembership };
  });
  if (
    parsedWorkspaces.length === 0 ||
    !parsedWorkspaces.some(
      (workspace) => workspace.weddingId === input.weddingId,
    ) ||
    new Set(parsedWorkspaces.map((workspace) => workspace.weddingId)).size !==
      parsedWorkspaces.length
  ) {
    throw new WeddingNavigationAccessError();
  }

  const destinations = catalog
    .filter((destination) =>
      destinationAllowed(destination.id, membership, evaluatedAt),
    )
    .map((destination) =>
      Object.freeze({
        ...destination,
        label: labels.destinations[destination.id]!,
        href: `/weddings/${input.weddingId}/${destination.id}${localeQuery}`,
      }),
    );

  let activeDestination: WeddingNavigationDestinationId = "dashboard";
  if (input.requestedPath) {
    const match = /^\/weddings\/([^/]+)\/([^/?#]+)$/.exec(input.requestedPath);
    if (!match || match[1] !== input.weddingId) {
      throw new WeddingNavigationAccessError();
    }
    const destination = destinations.find(({ id }) => id === match[2]);
    if (!destination) throw new WeddingNavigationAccessError();
    activeDestination = destination.id;
  }

  const orderedWorkspaces = [...parsedWorkspaces].sort(
    (left, right) =>
      Date.parse(right.lastOpenedAt) - Date.parse(left.lastOpenedAt),
  );
  const currentWorkspace = orderedWorkspaces.find(
    ({ weddingId }) => weddingId === input.weddingId,
  )!;
  return Object.freeze({
    activeDestination,
    destinations: Object.freeze(destinations),
    weddingId: input.weddingId,
    weddingName: currentWorkspace.name,
    weddingDateLabel: currentWorkspace.weddingDate ?? labels.dateNotSet,
    roleLabel: labels.roles[membership.role]!,
    labels,
    workspaceOptions: Object.freeze(
      orderedWorkspaces.map((workspace) =>
        Object.freeze({
          weddingId: workspace.weddingId,
          name: workspace.name,
          dateLabel: workspace.weddingDate ?? labels.dateNotSet,
          roleLabel:
            labels.roles[
              workspace.weddingId === input.weddingId
                ? membership.role
                : workspace.membership.role
            ]!,
          href: `/weddings/${workspace.weddingId}/dashboard${localeQuery}`,
          current: workspace.weddingId === input.weddingId,
        }),
      ),
    ),
  });
}

export function assertWeddingShellDestination(
  navigation: WeddingShellNavigation,
  destinationId: WeddingNavigationDestinationId,
): WeddingNavigationDestination {
  const destination = navigation.destinations.find(
    ({ id }) => id === destinationId,
  );
  if (!destination) throw new WeddingNavigationAccessError();
  return destination;
}
