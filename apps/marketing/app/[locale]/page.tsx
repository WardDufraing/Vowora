import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  Leaf,
  ListChecks,
  Users,
  Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ThemeSelect } from "../../components/theme-select";
import { routing, localePath, languageNames } from "../../i18n/routing";
function Botanical() {
  return (
    <svg
      className="botanical"
      viewBox="0 0 480 640"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.5">
        <path d="M263 650C238 478 333 269 305 38M254 569C191 452 118 424 62 317M261 481C357 405 395 320 428 199M280 317C214 246 186 170 176 83" />
        <path
          fill="currentColor"
          fillOpacity=".15"
          d="M303 147C254 122 252 69 281 30C313 58 324 107 303 147ZM303 212C343 188 358 148 350 107C313 122 296 166 303 212ZM286 290C244 277 226 241 227 202C269 214 292 250 286 290ZM283 373C321 364 343 337 350 300C310 305 285 335 283 373ZM269 453C225 426 205 388 212 347C254 369 275 410 269 453ZM235 502C191 502 163 478 152 441C192 439 226 465 235 502ZM165 435C126 428 105 398 106 365C141 372 167 400 165 435ZM114 385C79 371 66 343 69 311C103 324 121 352 114 385ZM348 383C347 343 368 317 403 304C407 340 386 373 348 383ZM389 305C381 272 396 239 428 217C439 250 425 286 389 305ZM235 249C202 243 182 218 178 187C212 188 235 216 235 249ZM192 169C162 157 153 129 159 101C186 112 201 140 192 169Z"
        />
      </g>
    </svg>
  );
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const features = [ListChecks, Wallet, Users];
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <header className="site-header container">
        <a className="brand" href="#main" aria-label={t("home")}>
          <Image
            src="/brand/vowora-app-icon-forest.svg"
            width={40}
            height={40}
            alt=""
            priority
          />
          vowora
        </a>
        <nav aria-label={t("nav")}>
          <a href="#vision">{t("visionNav")}</a>
          <a href="#for-planners">{t("plannersNav")}</a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero container" aria-labelledby="hero-title">
          <Botanical />
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <Leaf size={16} aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 id="hero-title">
              {t("heroFirst")}
              <br />
              {t("heroSecond")}
              <em>{t("heroEmphasis")}</em>
            </h1>
            <p className="hero-description">{t("description")}</p>
            <p className="availability">
              <span aria-hidden="true" />
              {t("availability")}
            </p>
            <a className="button" href="#vision">
              {t("explore")}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="preview-wrap">
            <p className="preview-caption">{t("concept")}</p>
            <div
              className="dashboard-preview"
              role="img"
              aria-label={t("conceptAlt")}
            >
              <div className="preview-header">
                <span className="preview-wordmark">vowora</span>
                <span className="preview-tag">{t("together")}</span>
              </div>
              <div className="preview-intro">
                <p className="eyebrow">{t("bigPicture")}</p>
                <h2>
                  {t("previewFirst")}
                  <br />
                  {t("previewSecond")}
                </h2>
                <span>{t("previewSpace")}</span>
              </div>
              <div className="preview-grid">
                <div className="preview-card">
                  <ListChecks size={20} aria-hidden="true" />
                  <h3>{t("steps")}</h3>
                  <p>
                    <Check size={14} aria-hidden="true" />
                    {t("ideas")}
                  </p>
                  <p>
                    <span className="empty-check" />
                    {t("venues")}
                  </p>
                  <p>
                    <span className="empty-check" />
                    {t("day")}
                  </p>
                </div>
                <div className="preview-card">
                  <Users size={20} aria-hidden="true" />
                  <h3>{t("people")}</h3>
                  <div className="guest-symbols" aria-hidden="true">
                    <span>A</span>
                    <span>J</span>
                    <span>M</span>
                    <span>+</span>
                  </div>
                  <p>{t("guests")}</p>
                </div>
                <div className="preview-card preview-schedule">
                  <CalendarDays size={20} aria-hidden="true" />
                  <div>
                    <h3>{t("schedule")}</h3>
                    <p>{t("scheduleText")}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="preview-note">{t("previewNote")}</p>
          </div>
        </section>
        <section
          id="vision"
          className="vision-section container"
          aria-labelledby="vision-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("visionEyebrow")}</p>
            <h2 id="vision-title">
              {t("visionFirst")}
              <br />
              <em>{t("visionSecond")}</em>
            </h2>
            <p>{t("visionText")}</p>
          </div>
          <div className="feature-grid">
            {features.map((Icon, index) => (
              <article className="feature" key={index}>
                <div className="feature-icon">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <p className="eyebrow">{t(`feature${index + 1}Label`)}</p>
                <h3>{t(`feature${index + 1}Title`)}</h3>
                <p>{t(`feature${index + 1}Text`)}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="for-planners"
          className="planner-section container"
          aria-labelledby="planners-title"
        >
          <div>
            <p className="eyebrow">{t("plannerEyebrow")}</p>
            <h2 id="planners-title">
              {t("plannerFirst")}
              <br />
              <em>{t("plannerSecond")}</em>
            </h2>
          </div>
          <div className="planner-copy">
            <p>{t("plannerText")}</p>
            <p>{t("plannerDetail")}</p>
            <a className="text-link" href="#vision">
              {t("discover")} <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section className="closing container" aria-labelledby="closing-title">
          <Leaf size={28} aria-hidden="true" />
          <p className="eyebrow">{t("closingEyebrow")}</p>
          <h2 id="closing-title">
            {t("closingFirst")}
            <br />
            {t("closingSecond")}
          </h2>
          <p>
            {t("closingText")}
            <br />
            {t("closingUnavailable")}
          </p>
          <a className="text-link" href="#main">
            {t("back")}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="site-footer container">
        <div className="footer-brand">
          <a className="brand" href="#main" aria-label={t("home")}>
            vowora
          </a>
          <p>{t("footerTag")}</p>
          <span>{t("development")}</span>
        </div>
        <div className="footer-preferences">
          <nav className="language-links" aria-label={t("languages")}>
            {routing.locales.map((language) => (
              <a
                key={language}
                href={localePath(language)}
                hrefLang={language}
                lang={language}
                aria-current={language === locale ? "page" : undefined}
              >
                {languageNames[language]}
              </a>
            ))}
          </nav>
          <ThemeSelect
            labels={{
              theme: t("theme"),
              system: t("system"),
              light: t("light"),
              dark: t("dark"),
            }}
          />
        </div>
      </footer>
    </>
  );
}
