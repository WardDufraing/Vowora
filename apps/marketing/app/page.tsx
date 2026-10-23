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
import { ThemeSelect } from "../components/theme-select";

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

const features = [
  {
    icon: ListChecks,
    title: "A shared sense of direction",
    text: "Tasks and timelines are planned to help you keep track of what comes next, together.",
    label: "Tasks & timelines",
  },
  {
    icon: Wallet,
    title: "Room for the practical details",
    text: "A place for budgets and vendor information is part of the vision, so the details can stay connected.",
    label: "Budgets & vendors",
  },
  {
    icon: Users,
    title: "The people at the heart of it",
    text: "Guest planning and collaboration are being designed around your wedding and the people helping you.",
    label: "Guests & collaboration",
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header container">
        <a className="brand" href="#main" aria-label="Vowora home">
          <Image
            src="/brand/vowora-app-icon-forest.svg"
            width={40}
            height={40}
            alt=""
            priority
          />
          vowora
        </a>
        <nav aria-label="Main navigation">
          <a href="#vision">The vision</a>
          <a href="#for-planners">For planners</a>
        </nav>
        <ThemeSelect />
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero container" aria-labelledby="hero-title">
          <Botanical />
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <Leaf size={16} aria-hidden="true" /> A new chapter in wedding
              planning
            </p>
            <h1 id="hero-title">
              One wedding.
              <br />
              One shared <em>plan.</em>
            </h1>
            <p className="hero-description">
              For the big picture, the little details, and everyone who matters.
              A calmer shared planning space for couples and professional
              wedding planners.
            </p>
            <p className="availability">
              <span aria-hidden="true" /> In development · Not yet available
            </p>
            <a className="button" href="#vision">
              Explore the vision <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="preview-wrap">
            <p className="preview-caption">
              An illustrative concept, not a live app
            </p>
            <div
              className="dashboard-preview"
              role="img"
              aria-label="Illustrative planning concept: a shared wedding overview with tasks, guest planning and a wedding-day schedule. These are planned features, not an available application."
            >
              <div className="preview-header">
                <span className="preview-wordmark">vowora</span>
                <span className="preview-tag">Your wedding, together</span>
              </div>
              <div className="preview-intro">
                <p className="eyebrow">The big picture</p>
                <h2>
                  A little more space
                  <br />
                  for what matters.
                </h2>
                <span>One place for your shared plan.</span>
              </div>
              <div className="preview-grid">
                <div className="preview-card">
                  <ListChecks size={20} aria-hidden="true" />
                  <h3>The next little steps</h3>
                  <p>
                    <Check size={14} aria-hidden="true" /> Gather your ideas
                  </p>
                  <p>
                    <span className="empty-check" /> Explore your venue options
                  </p>
                  <p>
                    <span className="empty-check" /> Shape your wedding day
                  </p>
                </div>
                <div className="preview-card">
                  <Users size={20} aria-hidden="true" />
                  <h3>Your favourite people</h3>
                  <div className="guest-symbols" aria-hidden="true">
                    <span>A</span>
                    <span>J</span>
                    <span>M</span>
                    <span>+</span>
                  </div>
                  <p>A place for your guest plans.</p>
                </div>
                <div className="preview-card preview-schedule">
                  <CalendarDays size={20} aria-hidden="true" />
                  <div>
                    <h3>A day that feels like you</h3>
                    <p>Your wedding-day schedule, connected.</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="preview-note">
              A glimpse of what we’re working towards.
            </p>
          </div>
        </section>
        <section
          id="vision"
          className="vision-section container"
          aria-labelledby="vision-title"
        >
          <div className="section-heading">
            <p className="eyebrow">Thoughtfully planned. Together.</p>
            <h2 id="vision-title">
              Less scattered.
              <br />
              <em>More connected.</em>
            </h2>
            <p>
              Vowora is being created to bring your wedding plans into one
              shared space. These capabilities are planned; the product is still
              in development.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text, label }) => (
              <article className="feature" key={title}>
                <div className="feature-icon">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <p className="eyebrow">{label}</p>
                <h3>{title}</h3>
                <p>{text}</p>
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
            <p className="eyebrow">For the people behind the day</p>
            <h2 id="planners-title">
              Made for couples.
              <br />
              <em>Mindful of planners.</em>
            </h2>
          </div>
          <div className="planner-copy">
            <p>
              Every wedding has its own story. Vowora’s vision includes a shared
              plan for each couple and a multi-wedding overview for professional
              planners.
            </p>
            <p>
              Thoughtful collaboration, with the right information available to
              the right people.
            </p>
            <a className="text-link" href="#vision">
              Discover the planned approach{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section className="closing container" aria-labelledby="closing-title">
          <Leaf size={28} aria-hidden="true" />
          <p className="eyebrow">Good things take care</p>
          <h2 id="closing-title">
            A calmer way to plan
            <br />
            is taking shape.
          </h2>
          <p>
            We’re at the beginning of the journey.
            <br />
            Vowora is not open for signups yet.
          </p>
          <a className="text-link" href="#main">
            Back to the beginning <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="site-footer container">
        <a className="brand" href="#main" aria-label="Vowora home">
          vowora
        </a>
        <p>One wedding, one shared plan.</p>
        <span>In development</span>
      </footer>
    </>
  );
}
