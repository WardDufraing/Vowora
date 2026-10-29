import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Button,
  Card,
  FoundationDialog,
  FoundationNavigation,
  Notice,
  StatusBadge,
  TextField,
} from "../../components/ui/foundation";
import { readServerEnvironment } from "../../lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vowora design foundation review",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (readServerEnvironment().VOWORA_ENV === "production") notFound();

  return (
    <main className="foundation" id="main-content">
      <FoundationNavigation />
      <header className="foundation__hero" id="foundation-overview">
        <p className="eyebrow">Foundation review · non-production example</p>
        <h1>A calm foundation for wedding planning</h1>
        <p className="lede">
          Semantic tokens keep every workspace readable and consistent without
          changing product permissions or behavior.
        </p>
        <div className="button-row">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="ghost">Quiet action</Button>
          <Button variant="destructive">Destructive example</Button>
          <Button disabled>Unavailable</Button>
        </div>
      </header>

      <section
        aria-labelledby="representative-heading"
        className="foundation__section"
        id="representative-layouts"
      >
        <h2 id="representative-heading">Representative layouts</h2>
        <p>
          Synthetic foundation examples validate the approved visual language;
          they are not product screens or new workflows.
        </p>
        <div className="representative-layouts">
          <article className="representative-layout representative-layout--login">
            <div>
              <p className="eyebrow">Atmospheric login example</p>
              <h3>A focused welcome back</h3>
              <p>
                Botanical hierarchy supports a clear, practical account form.
              </p>
            </div>
            <form aria-label="Synthetic sign-in example">
              <TextField id="review-email" label="Email" type="email" />
              <TextField
                id="review-password"
                label="Password"
                type="password"
              />
              <Button type="button">Sign in example</Button>
            </form>
          </article>

          <article className="representative-layout representative-layout--dashboard">
            <p className="eyebrow">Editorial dashboard example</p>
            <h3>Planning at a glance</h3>
            <div className="metric-grid">
              <div className="metric">
                <strong>Example</strong>
                <span>Countdown moment</span>
              </div>
              <div className="metric">
                <strong>3 of 5</strong>
                <span>Sample priorities</span>
              </div>
              <div className="metric">
                <strong>Calm</strong>
                <span>Permission-limited state</span>
              </div>
            </div>
          </article>

          <article className="representative-layout representative-layout--marketing">
            <p className="eyebrow">Immersive marketing example</p>
            <h3>One thoughtful place to plan together</h3>
            <p>
              A restrained botanical feature surface can introduce truthful
              product information without changing public marketing behavior.
            </p>
            <Button type="button" variant="secondary">
              Learn more example
            </Button>
          </article>
        </div>
      </section>

      <section aria-labelledby="states-heading" className="foundation__section">
        <h2 id="states-heading">Accessible states</h2>
        <div className="foundation__grid">
          <Card title="Form controls">
            <TextField
              id="example-name"
              label="Display name"
              description="A persistent description stays connected to the field."
              defaultValue="Jordan & Alex"
            />
            <TextField
              id="example-error"
              label="Example with an error"
              error="Enter a valid value before continuing."
              defaultValue="Incomplete"
            />
          </Card>
          <Card title="Status language">
            <p>
              Status text carries the meaning; color only supports scanning.
            </p>
            <div className="status-row" aria-label="Status examples">
              <StatusBadge tone="success">✓ Confirmed</StatusBadge>
              <StatusBadge tone="warning">! Needs attention</StatusBadge>
              <StatusBadge tone="destructive">× Action failed</StatusBadge>
              <StatusBadge tone="info">i In progress</StatusBadge>
            </div>
          </Card>
          <Card title="Dialog behavior">
            <p>
              The shared dialog primitive supports Escape, focus containment,
              and focus return.
            </p>
            <FoundationDialog />
          </Card>
          <Card title="Feedback">
            <Notice title="Saved example">
              Your confirmed changes would appear here.
            </Notice>
            <div
              className="skeleton"
              aria-label="Loading example"
              role="status"
            >
              <span>Loading example…</span>
            </div>
          </Card>
        </div>
      </section>

      <section
        aria-labelledby="records-heading"
        className="foundation__section"
      >
        <h2 id="records-heading">Responsive record pattern</h2>
        <div
          className="table-shell"
          tabIndex={0}
          aria-label="Scrollable task example"
        >
          <table>
            <caption>Example tasks — visual foundation data only</caption>
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Owner</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Review guest list</th>
                <td>Couple</td>
                <td>
                  <StatusBadge tone="info">In progress</StatusBadge>
                </td>
              </tr>
              <tr aria-selected="true">
                <th scope="row">Confirm venue details</th>
                <td>Planner</td>
                <td>
                  <StatusBadge tone="success">Confirmed</StatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <article
          className="mobile-record"
          aria-labelledby="mobile-record-title"
        >
          <h3 id="mobile-record-title">Confirm venue details</h3>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>Planner</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Confirmed</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
