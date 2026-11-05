import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import { appLocales, appMessages, type AppLocale } from "../../i18n/messages";
import {
  ContextualState,
  ResponsiveDataView,
  SharedFormExample,
} from "../../components/ui/shared-patterns";
import { readServerEnvironment } from "../../lib/env";
import {
  createAppTranslator,
  formatDateOnly,
  formatWeddingInstant,
  resolveAppLocale,
} from "../../lib/localization";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vowora shared patterns review",
  robots: { index: false, follow: false },
};

const localeNames: Readonly<Record<AppLocale, string>> = {
  en: "English",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
};

export default async function SharedPatternsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (readServerEnvironment().VOWORA_ENV === "production") notFound();
  const query = await searchParams;
  const locale = resolveAppLocale(query.locale);
  const t = createAppTranslator(locale);
  const dateOnly = formatDateOnly("2027-06-12", locale);
  const weddingInstant = formatWeddingInstant(
    "2027-06-12T14:30:00Z",
    locale,
    "Europe/Brussels",
  );

  return (
    <NextIntlClientProvider locale={locale} messages={appMessages[locale]}>
      <main className="shared-patterns" id="main-content" lang={locale}>
        <header className="shared-patterns__hero">
          <p className="eyebrow">{t("SharedPatterns.eyebrow")}</p>
          <h1>{t("SharedPatterns.title")}</h1>
          <p className="lede">{t("SharedPatterns.intro")}</p>
          <nav aria-label="Review language" className="locale-review-nav">
            {appLocales.map((item) => (
              <a
                aria-current={item === locale ? "page" : undefined}
                href={`?locale=${item}`}
                key={item}
                lang={item}
              >
                {localeNames[item]}
              </a>
            ))}
          </nav>
        </header>

        <section
          aria-labelledby="shared-form-heading"
          className="shared-patterns__section"
        >
          <h2 id="shared-form-heading">{t("SharedPatterns.formTitle")}</h2>
          <p>{t("SharedPatterns.formDescription")}</p>
          <SharedFormExample />
        </section>

        <section
          aria-labelledby="shared-records-heading"
          className="shared-patterns__section"
        >
          <h2 id="shared-records-heading">
            {t("SharedPatterns.recordsTitle")}
          </h2>
          <p>{t("SharedPatterns.recordsDescription")}</p>
          <ResponsiveDataView />
        </section>

        <section
          aria-labelledby="shared-states-heading"
          className="shared-patterns__section"
        >
          <h2 id="shared-states-heading">{t("SharedPatterns.statesTitle")}</h2>
          <div className="shared-state-grid">
            <ContextualState
              state="loading"
              title={t("SharedPatterns.loadingTitle")}
            >
              {t("SharedPatterns.loadingBody")}
            </ContextualState>
            <ContextualState
              state="empty"
              title={t("SharedPatterns.emptyTitle")}
            >
              {t("SharedPatterns.emptyBody")}
            </ContextualState>
            <ContextualState
              state="error"
              title={t("SharedPatterns.errorTitle")}
            >
              {t("SharedPatterns.errorBody")}
            </ContextualState>
            <ContextualState
              state="restricted"
              title={t("SharedPatterns.restrictedTitle")}
            >
              {t("SharedPatterns.restrictedBody")}
            </ContextualState>
          </div>
        </section>

        <section
          aria-labelledby="shared-date-heading"
          className="shared-patterns__section"
        >
          <h2 id="shared-date-heading">{t("SharedPatterns.dateTitle")}</h2>
          <dl className="localized-date-example">
            <div>
              <dt>{t("SharedPatterns.dateOnlyLabel")}</dt>
              <dd>{dateOnly}</dd>
            </div>
            <div>
              <dt>{t("SharedPatterns.instantLabel")}</dt>
              <dd>{weddingInstant}</dd>
            </div>
          </dl>
        </section>
      </main>
    </NextIntlClientProvider>
  );
}
