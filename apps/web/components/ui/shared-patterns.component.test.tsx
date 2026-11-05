import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { appMessages } from "../../i18n/messages";
import {
  ConfirmationDialog,
  ContextualState,
  ResponsiveDataView,
  SharedFormExample,
} from "./shared-patterns";

function renderEnglish(children: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={appMessages.en}>
      {children}
    </NextIntlClientProvider>,
  );
}

describe("shared application patterns", () => {
  it("focuses an actionable error summary and links to invalid fields", async () => {
    const user = userEvent.setup();
    renderEnglish(<SharedFormExample />);
    await user.click(screen.getByRole("button", { name: "Review example" }));
    const summary = screen.getByRole("alert", {
      name: "Check the highlighted fields",
    });
    expect(summary).toHaveFocus();
    expect(screen.getByLabelText(/Example title/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByRole("link", { name: "Enter an example title." }),
    ).toHaveAttribute("href", "#shared-title");
  });

  it("returns focus when a contextual confirmation closes", async () => {
    const user = userEvent.setup();
    renderEnglish(
      <ConfirmationDialog
        cancelLabel="Keep editing"
        confirmLabel="Confirm example"
        description="No data changes."
        title="Confirm this example"
        triggerLabel="Open confirmation"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open confirmation" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("keeps selection and sorting semantics in the responsive data source", async () => {
    const user = userEvent.setup();
    renderEnglish(<ResponsiveDataView />);
    expect(screen.getByText("1 record selected")).toBeVisible();
    const sort = screen.getByRole("button", { name: /Sort by task/ });
    await user.click(sort);
    expect(screen.getByRole("columnheader", { name: /Task/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    const selects = screen.getAllByRole("checkbox", {
      name: "Select Review guest list",
    });
    await user.click(selects[0]!);
    expect(screen.getByText("2 records selected")).toBeVisible();
    expect(selects[1]).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByText("No records selected")).toBeVisible();
    expect(selects[0]).not.toBeChecked();
    expect(selects[1]).not.toBeChecked();
  });

  it("announces truthful loading, empty, error and permission states", () => {
    render(
      <>
        <ContextualState state="loading" title="Loading">
          Still loading.
        </ContextualState>
        <ContextualState state="empty" title="Empty">
          Nothing here.
        </ContextualState>
        <ContextualState state="error" title="Error">
          Could not load.
        </ContextualState>
        <ContextualState state="restricted" title="Restricted">
          Not allowed.
        </ContextualState>
      </>,
    );
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load.");
  });
});
