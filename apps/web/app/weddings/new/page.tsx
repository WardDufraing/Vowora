import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "../../../lib/auth";
import { weddingLocale, weddingMessages } from "../../../lib/wedding-messages";
import { WeddingForm } from "../wedding-form";

export const dynamic = "force-dynamic";

export default async function NewWeddingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly locale?: string }>;
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!session) redirect("/sign-in?next=/weddings/new");
  const locale = weddingLocale((await searchParams).locale);
  const messages = weddingMessages(locale);
  return (
    <main className="account-page" id="main-content" lang={locale}>
      <section className="account-card" aria-labelledby="new-wedding-title">
        <nav aria-label={messages.language} className="language-links">
          {(["en", "nl", "fr", "de"] as const).map((language) => (
            <a
              aria-current={language === locale ? "page" : undefined}
              href={`/weddings/new?locale=${language}`}
              key={language}
            >
              {language.toUpperCase()}
            </a>
          ))}
        </nav>
        <p className="eyebrow">{messages.createEyebrow}</p>
        <h1 id="new-wedding-title">{messages.createTitle}</h1>
        <p className="lede">{messages.createIntro}</p>
        <WeddingForm
          endpoint="/api/v1/weddings"
          initial={{
            name: "",
            weddingDate: null,
            timeZone: "Europe/Brussels",
          }}
          messages={messages}
          mode="create"
        />
      </section>
    </main>
  );
}
