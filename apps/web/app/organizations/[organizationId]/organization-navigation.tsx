import type {
  OrganizationLocale,
  organizationMessages,
} from "../../../lib/organization-messages";

export function OrganizationNavigation({
  active,
  locale,
  messages,
  organizationId,
  showStaff = true,
}: {
  readonly active: "staff" | "weddings" | "private-notes";
  readonly locale: OrganizationLocale;
  readonly messages: ReturnType<typeof organizationMessages>;
  readonly organizationId: string;
  readonly showStaff?: boolean;
}) {
  const query = `?locale=${locale}`;
  return (
    <nav aria-label={messages.navigationLabel} className="locale-review-nav">
      {showStaff ? (
        <a
          aria-current={active === "staff" ? "page" : undefined}
          href={`/organizations/${organizationId}/staff${query}`}
        >
          {messages.staffNavigation}
        </a>
      ) : null}
      <a
        aria-current={active === "weddings" ? "page" : undefined}
        href={`/organizations/${organizationId}/weddings${query}`}
      >
        {messages.weddingsNavigation}
      </a>
      <a
        aria-current={active === "private-notes" ? "page" : undefined}
        href={`/organizations/${organizationId}/private-notes${query}`}
      >
        {messages.privateNotesNavigation}
      </a>
    </nav>
  );
}
