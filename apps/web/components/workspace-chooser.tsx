"use client";

import { useState } from "react";

import type { WorkspaceMessages } from "../lib/workspace-messages";

export interface WorkspaceChooserOption {
  readonly weddingId: string;
  readonly name: string;
  readonly dateLabel: string;
  readonly roleLabel: string;
  readonly href: string;
}

export function WorkspaceChooser({
  labels,
  workspaces,
}: {
  readonly labels: WorkspaceMessages;
  readonly workspaces: readonly WorkspaceChooserOption[];
}) {
  const [query, setQuery] = useState("");
  const visible = workspaces.filter(({ name }) =>
    name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section
      className="workspace-chooser"
      aria-labelledby="workspace-chooser-title"
    >
      <h1 id="workspace-chooser-title">{labels.chooseTitle}</h1>
      <p>{labels.chooseDescription}</p>
      <label>
        <span>{labels.searchWeddings}</span>
        <input
          onChange={(event) => setQuery(event.currentTarget.value)}
          type="search"
          value={query}
        />
      </label>
      {visible.length === 0 ? (
        <div className="workspace-switcher__empty" role="status">
          <p>{labels.noWeddings}</p>
          <button className="button button--ghost" onClick={() => setQuery("")}>
            {labels.clearSearch}
          </button>
        </div>
      ) : (
        <nav aria-label={labels.chooseTitle}>
          {visible.map((workspace) => (
            <a href={workspace.href} key={workspace.weddingId}>
              <strong>{workspace.name}</strong>
              <span>
                {workspace.dateLabel} · {workspace.roleLabel}
              </span>
            </a>
          ))}
        </nav>
      )}
    </section>
  );
}
