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
  Heart,
  Lightbulb,
  MoreHorizontal,
  PiggyBank,
  Settings,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  WeddingNavigationDestination,
  WeddingNavigationDestinationId,
  WeddingNavigationGroup,
  WeddingShellNavigation,
} from "../lib/workspace-navigation";
import { selectMobilePrimaryDestinations } from "../lib/workspace-navigation";
import { ThemePreferenceControl } from "./theme-preference";

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

interface NavigationGuardLabels {
  readonly title: string;
  readonly description: string;
  readonly save: string;
  readonly discard: string;
  readonly stay: string;
}

interface WorkspaceNavigationGuard {
  readonly register: (input: {
    readonly save: () => Promise<boolean>;
    readonly labels: NavigationGuardLabels;
  }) => () => void;
  readonly setDirty: (dirty: boolean) => void;
}

const NavigationGuardContext = createContext<WorkspaceNavigationGuard | null>(
  null,
);
const defaultNavigationGuardLabels: NavigationGuardLabels = {
  title: "Unsaved changes",
  description: "Save your changes before leaving this wedding workspace?",
  save: "Save",
  discard: "Discard",
  stay: "Stay",
};

export function useWorkspaceNavigationGuard() {
  return useContext(NavigationGuardContext);
}

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
  const compactContext = (
    <span
      aria-hidden="true"
      className="workspace-context__compact"
      title={`Current workspace: ${model.weddingName}`}
    >
      <Heart aria-hidden="true" size={20} strokeWidth={1.8} />
    </span>
  );
  if (model.workspaceOptions.length === 1) {
    return (
      <div className="workspace-context" aria-label="Current wedding workspace">
        {compactContext}
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
        {compactContext}
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
  const activeInMore = remaining.some(
    ({ id }) => id === model.activeDestination,
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-current={activeInMore ? "page" : undefined}
          className="mobile-more-trigger"
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={22} />
          <span>More</span>
          {activeInMore ? (
            <span className="mobile-current-label">Current</span>
          ) : null}
          <span className="screen-reader-only">workspace navigation</span>
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
          <section aria-labelledby="more-appearance">
            <h2 id="more-appearance">Appearance</h2>
            <ThemePreferenceControl id="app-theme-mobile" />
          </section>
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    | { readonly kind: "link"; readonly href: string }
    | { readonly kind: "back" }
    | null
  >(null);
  const [savingNavigation, setSavingNavigation] = useState(false);
  const [guardLabels, setGuardLabels] = useState(defaultNavigationGuardLabels);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);
  const historyGuardRef = useRef(false);
  const bypassHistoryRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const register = useCallback<WorkspaceNavigationGuard["register"]>(
    (input) => {
      saveRef.current = input.save;
      setGuardLabels(input.labels);
      return () => {
        saveRef.current = null;
        setDirty(false);
      };
    },
    [],
  );
  const guard = useMemo(() => ({ register, setDirty }), [register]);

  useEffect(() => {
    if (dirty && !historyGuardRef.current) {
      window.history.pushState(
        { ...window.history.state, voworaUnsavedGuard: true },
        "",
        window.location.href,
      );
      historyGuardRef.current = true;
    } else if (!dirty && historyGuardRef.current && !pendingNavigation) {
      bypassHistoryRef.current = true;
      window.history.back();
      historyGuardRef.current = false;
    }
  }, [dirty, pendingNavigation]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const captureLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      const anchor =
        target instanceof Element
          ? target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
      )
        return;
      event.preventDefault();
      returnFocusRef.current = anchor;
      setPendingNavigation({
        kind: "link",
        href: `${url.pathname}${url.search}${url.hash}`,
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", captureLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", captureLink, true);
    };
  }, [dirty]);

  useEffect(() => {
    const onPopState = () => {
      if (bypassHistoryRef.current) {
        bypassHistoryRef.current = false;
        return;
      }
      if (!dirty || !historyGuardRef.current) return;
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      window.history.forward();
      setPendingNavigation({ kind: "back" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty]);

  const proceed = useCallback(
    (pending: NonNullable<typeof pendingNavigation>) => {
      setDirty(false);
      setPendingNavigation(null);
      if (pending.kind === "back") {
        bypassHistoryRef.current = true;
        historyGuardRef.current = false;
        window.history.go(-2);
      } else {
        if (historyGuardRef.current) {
          bypassHistoryRef.current = true;
          window.history.back();
        }
        historyGuardRef.current = false;
        window.setTimeout(() => router.push(pending.href), 0);
      }
    },
    [router],
  );
  const saveAndProceed = useCallback(async () => {
    if (!pendingNavigation || !saveRef.current) return;
    setSavingNavigation(true);
    const saved = await saveRef.current();
    setSavingNavigation(false);
    if (saved) proceed(pendingNavigation);
  }, [pendingNavigation, proceed]);
  const primaryMobile = selectMobilePrimaryDestinations(model.destinations);
  const settings = model.destinations.find(({ id }) => id === "settings");
  return (
    <NavigationGuardContext.Provider value={guard}>
      <div
        className="app-shell"
        data-sidebar-collapsed={collapsed || undefined}
      >
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
      <Dialog.Root
        open={pendingNavigation !== null}
        onOpenChange={(open) => {
          if (!open && !savingNavigation) setPendingNavigation(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog__overlay" />
          <Dialog.Content
            className="dialog__content"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocusRef.current?.focus();
            }}
          >
            <Dialog.Title>{guardLabels.title}</Dialog.Title>
            <Dialog.Description>{guardLabels.description}</Dialog.Description>
            <div className="dialog__actions">
              <button
                className="button button--primary"
                disabled={savingNavigation}
                onClick={() => void saveAndProceed()}
                type="button"
              >
                {guardLabels.save}
              </button>
              <button
                className="button button--secondary"
                disabled={savingNavigation}
                onClick={() => pendingNavigation && proceed(pendingNavigation)}
                type="button"
              >
                {guardLabels.discard}
              </button>
              <Dialog.Close asChild>
                <button
                  className="button button--ghost"
                  disabled={savingNavigation}
                  type="button"
                >
                  {guardLabels.stay}
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </NavigationGuardContext.Provider>
  );
}
