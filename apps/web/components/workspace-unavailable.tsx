import type { AppLocale } from "../i18n/messages";
import { workspaceMessages } from "../lib/workspace-messages";

export function WorkspaceUnavailable({
  kind,
  locale,
  weddingId,
}: {
  readonly kind: "item" | "wedding";
  readonly locale: AppLocale;
  readonly weddingId?: string;
}) {
  const labels = workspaceMessages(locale);
  const localeQuery = locale === "en" ? "" : `&locale=${locale}`;
  const dashboardQuery = locale === "en" ? "" : `?locale=${locale}`;
  const item = kind === "item" && weddingId;
  return (
    <main className="workspace-unavailable" id="main-content" lang={locale}>
      <h1>{item ? labels.itemUnavailable : labels.weddingUnavailable}</h1>
      <a
        className="button button--primary"
        href={
          item
            ? `/weddings/${weddingId}/dashboard${dashboardQuery}`
            : `/weddings?choose=true${localeQuery}`
        }
      >
        {item ? labels.itemUnavailableAction : labels.weddingUnavailableAction}
      </a>
    </main>
  );
}
