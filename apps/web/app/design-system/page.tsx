import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Button,
  Card,
  FoundationDialog,
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
      <header className="foundation__hero">
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
            <div className="notice" role="status" aria-live="polite">
              <strong>Saved example</strong>
              <span>Your confirmed changes would appear here.</span>
            </div>
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
