"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  ContactRound,
  FileText,
  Gauge,
  HeartHandshake,
  Lightbulb,
  MoreHorizontal,
  PiggyBank,
  Settings,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type {
  WeddingNavigationDestination,
  WeddingNavigationDestinationId,
  WeddingNavigationGroup,
  WeddingShellNavigation,
} from "../lib/workspace-navigation";

const icons: Readonly<Record<WeddingNavigationDestinationId, LucideIcon>> = {
  dashboard: Gauge,
  timeline: ClipboardList,
  decisions: HeartHandshake,
  vendors: ContactRound,
  budget: PiggyBank,
  guests: UsersRound,
  schedule: CalendarDays,
  contacts: ContactRound,
  "documents-notes": FileText,
  inspiration: Lightbulb,
  reports: FileText,
  settings: Settings,
};

function NavigationLink({
  destination,
  active,
  compact = false,
  onNavigate,
}: {
  readonly destination: WeddingNavigationDestination;
  readonly active: boolean;
  readonly compact?: boolean;
  readonly onNavigate?: () => void;
}) {
  const Icon = icons[destination.id];
  return (
    <a
      aria-current={active ? "page" : undefined}
      className="shell-nav-link"
      data-compact={compact || undefined}
      href={destination.href}
      onClick={onNavigate}
      title={compact ? destination.label : undefined}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
      <span>{destination.label}</span>
    </a>
  );
}

function WorkspaceContext({
  model,
}: {
  readonly model: WeddingShellNavigation;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  if (model.workspaceOptions.length === 1) {
    return (
      <div className="workspace-context" aria-label="Current wedding workspace">
        <strong>{model.weddingName}</strong>
        <span>
          {model.weddingDateLabel} · {model.roleLabel}
        </span>
      </div>
    );
  }
  const visibleWorkspaces = model.workspaceOptions.filter(({ name }) =>
    name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <details className="workspace-switcher" ref={detailsRef}>
      <summary>
        <span className="screen-reader-only">
          Switch wedding workspace. Current:
        </span>
        <span>
          <strong>{model.weddingName}</strong>
          <small>
            {model.weddingDateLabel} · {model.roleLabel}
          </small>
        </span>
      </summary>
      <div className="workspace-switcher__panel">
        <label>
          <span>Search weddings</span>
          <input
            onChange={(event) => setQuery(event.currentTarget.value)}
            type="search"
            value={query}
          />
        </label>
        {visibleWorkspaces.length === 0 ? (
          <div className="workspace-switcher__empty" role="status">
            <p>No weddings found</p>
            <button
              className="button button--ghost"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          </div>
        ) : (
          <nav aria-label="Wedding workspaces">
            {visibleWorkspaces.map((workspace) => {
              const content = (
                <>
                  <span>
                    <strong>{workspace.name}</strong>
                    <small>
                      {workspace.dateLabel} · {workspace.roleLabel}
                    </small>
                  </span>
                  {workspace.current ? (
                    <Check aria-hidden="true" size={18} />
                  ) : null}
                </>
              );
              return workspace.current ? (
                <button
                  aria-current="page"
                  key={workspace.weddingId}
                  onClick={() => detailsRef.current?.removeAttribute("open")}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                <a href={workspace.href} key={workspace.weddingId}>
                  {content}
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </details>
  );
}

function MoreNavigation({ model }: { readonly model: WeddingShellNavigation }) {
  const [open, setOpen] = useState(false);
  const remaining = model.destinations.filter(
    ({ mobile }) => mobile === "more",
  );
  const groups: readonly { id: WeddingNavigationGroup; label: string }[] = [
    { id: "planning", label: "Planning" },
    { id: "people", label: "People" },
    { id: "reports", label: "Reports" },
  ];
  const settings = remaining.find(({ id }) => id === "settings");
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="More workspace navigation"
          className="mobile-more-trigger"
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={22} />
          <span>More</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog__overlay" />
        <Dialog.Content className="mobile-more-sheet">
          <div className="mobile-more-sheet__header">
            <div>
              <Dialog.Title>More</Dialog.Title>
              <Dialog.Description>
                Additional destinations for {model.weddingName}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close more navigation"
              className="icon-button"
            >
              <X aria-hidden="true" size={22} />
            </Dialog.Close>
          </div>
          <nav aria-label="More wedding workspace navigation">
            {groups.map((group) => {
              const destinations = remaining.filter(
                ({ mobileGroup }) => mobileGroup === group.id,
              );
              if (destinations.length === 0) return null;
              return (
                <section aria-labelledby={`more-${group.id}`} key={group.id}>
                  <h2 id={`more-${group.id}`}>{group.label}</h2>
                  {destinations.map((destination) => (
                    <NavigationLink
                      active={model.activeDestination === destination.id}
                      destination={destination}
                      key={destination.id}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </section>
              );
            })}
            {settings ? (
              <div className="mobile-more-sheet__settings">
                <NavigationLink
                  active={model.activeDestination === settings.id}
                  destination={settings}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            ) : null}
            {remaining.length === 0 ? (
              <p className="mobile-more-sheet__empty">
                No additional areas are available.
              </p>
            ) : null}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AppShell({
  model,
  children,
}: {
  readonly model: WeddingShellNavigation;
  readonly children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const primaryMobile = model.destinations.filter(
    ({ mobile }) => mobile === "primary",
  );
  const settings = model.destinations.find(({ id }) => id === "settings");
  return (
    <div className="app-shell" data-sidebar-collapsed={collapsed || undefined}>
      <aside
        className="app-shell__sidebar"
        aria-label="Wedding workspace sidebar"
      >
        <WorkspaceContext model={model} />
        <nav aria-label="Wedding workspace">
          {model.destinations
            .filter(({ id }) => id !== "settings")
            .map((destination) => (
              <NavigationLink
                active={model.activeDestination === destination.id}
                compact={collapsed}
                destination={destination}
                key={destination.id}
              />
            ))}
        </nav>
        <div className="app-shell__sidebar-footer">
          {settings ? (
            <NavigationLink
              active={model.activeDestination === settings.id}
              compact={collapsed}
              destination={settings}
            />
          ) : null}
          <button
            aria-expanded={!collapsed}
            className="sidebar-collapse"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronLeft aria-hidden="true" />
            )}
            <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </button>
        </div>
      </aside>

      <header className="app-shell__header">
        <div className="app-shell__mobile-context">
          <WorkspaceContext model={model} />
        </div>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span>{model.weddingName}</span>
          <span aria-hidden="true">/</span>
          <strong>
            {
              model.destinations.find(
                ({ id }) => id === model.activeDestination,
              )?.label
            }
          </strong>
        </nav>
        <a className="account-link" href="/account">
          <CircleUserRound aria-hidden="true" size={20} />
          <span>Account</span>
        </a>
      </header>

      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav
        className="mobile-bottom-nav"
        aria-label="Primary wedding navigation"
      >
        {primaryMobile.map((destination) => (
          <NavigationLink
            active={model.activeDestination === destination.id}
            destination={destination}
            key={destination.id}
          />
        ))}
        <MoreNavigation model={model} />
      </nav>
    </div>
  );
}
