"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { parseDateOnly } from "../../lib/localization";
import { Button, StatusBadge } from "./foundation";

export function FormField({
  id,
  label,
  description,
  error,
  required,
  optionalLabel,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly optionalLabel?: string;
  readonly children: ReactElement<{
    readonly id?: string;
    readonly required?: boolean;
    readonly "aria-describedby"?: string;
    readonly "aria-invalid"?: boolean;
  }>;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = cloneElement(children, {
    id,
    required,
    "aria-describedby":
      [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
  });
  return (
    <div className="field" data-invalid={error ? true : undefined}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : optionalLabel ? (
          <span className="field__optional"> ({optionalLabel})</span>
        ) : null}
      </label>
      {description ? (
        <p className="field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div data-field-control>{control}</div>
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export function ErrorSummary({
  title,
  errors,
  summaryRef,
}: {
  readonly title: string;
  readonly errors: readonly { id: string; message: string }[];
  readonly summaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (errors.length === 0) return null;
  return <VisibleErrorSummary {...{ errors, summaryRef, title }} />;
}

function VisibleErrorSummary({
  title,
  errors,
  summaryRef,
}: {
  readonly title: string;
  readonly errors: readonly { id: string; message: string }[];
  readonly summaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const titleId = useId();
  return (
    <div
      aria-labelledby={titleId}
      className="error-summary"
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
    >
      <h3 id={titleId}>{title}</h3>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a href={`#${error.id}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConfirmationDialog({
  title,
  description,
  triggerLabel,
  confirmLabel,
  cancelLabel,
  risk = "standard",
  onConfirm,
}: {
  readonly title: string;
  readonly description: string;
  readonly triggerLabel: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly risk?: "standard" | "destructive";
  readonly onConfirm?: () => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary">{triggerLabel}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog__overlay" />
        <Dialog.Content className="dialog__content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <div className="button-row">
            <Dialog.Close asChild>
              <Button
                onClick={onConfirm}
                variant={risk === "destructive" ? "destructive" : "primary"}
              >
                {confirmLabel}
              </Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ViewState = "loading" | "empty" | "error" | "restricted";

export function ContextualState({
  state,
  title,
  children,
}: {
  readonly state: ViewState;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      aria-live={state === "loading" ? "polite" : undefined}
      aria-busy={state === "loading" ? true : undefined}
      className={`contextual-state contextual-state--${state}`}
      role={state === "error" ? "alert" : "status"}
    >
      <h3 id={titleId}>{title}</h3>
      <p>{children}</p>
      {state === "loading" ? (
        <div aria-hidden="true" className="state-skeleton" />
      ) : null}
    </section>
  );
}

const exampleRecords = [
  {
    id: "review",
    titleKey: "reviewGuestList",
    ownerKey: "couple",
    statusKey: "inProgress",
  },
  {
    id: "venue",
    titleKey: "confirmVenueDetails",
    ownerKey: "planner",
    statusKey: "confirmed",
  },
] as const;

export function ResponsiveDataView() {
  const t = useTranslations("SharedPatterns");
  const [descending, setDescending] = useState(false);
  const [selected, setSelected] = useState<readonly string[]>(["venue"]);
  const records = useMemo(
    () =>
      [...exampleRecords].sort((a, b) => {
        const aTitle = t(a.titleKey);
        const bTitle = t(b.titleKey);
        return descending
          ? bTitle.localeCompare(aTitle)
          : aTitle.localeCompare(bTitle);
      }),
    [descending, t],
  );
  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="shared-data-view">
      <p aria-live="polite" className="selection-summary">
        {t("selectedCount", { count: selected.length })}
      </p>
      <div className="table-shell" tabIndex={0} aria-label={t("recordsTitle")}>
        <table>
          <caption>{t("recordsDescription")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("selection")}</th>
              <th
                aria-sort={descending ? "descending" : "ascending"}
                scope="col"
              >
                <button
                  aria-label={t("sortByTask", {
                    direction: t(descending ? "descending" : "ascending"),
                  })}
                  className="table-sort"
                  onClick={() => setDescending((value) => !value)}
                  type="button"
                >
                  {t("task")}{" "}
                  <span aria-hidden="true">{descending ? "↓" : "↑"}</span>
                </button>
              </th>
              <th scope="col">{t("owner")}</th>
              <th scope="col">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isSelected = selected.includes(record.id);
              const title = t(record.titleKey);
              return (
                <tr aria-selected={isSelected} key={record.id}>
                  <td>
                    <input
                      aria-label={t("selectRecord", { title })}
                      checked={isSelected}
                      onChange={() => toggle(record.id)}
                      type="checkbox"
                    />
                  </td>
                  <th scope="row">{title}</th>
                  <td>{t(record.ownerKey)}</td>
                  <td>
                    <StatusBadge
                      tone={
                        record.statusKey === "confirmed" ? "success" : "info"
                      }
                    >
                      {t(record.statusKey)}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        aria-label={t("recordsTitle")}
        className="shared-mobile-records"
        role="list"
      >
        {records.map((record) => {
          const isSelected = selected.includes(record.id);
          const title = t(record.titleKey);
          return (
            <article
              aria-label={title}
              className={
                isSelected
                  ? "shared-mobile-record shared-mobile-record--selected"
                  : "shared-mobile-record"
              }
              key={record.id}
              role="listitem"
            >
              <label>
                <input
                  aria-label={t("selectRecord", { title })}
                  checked={isSelected}
                  onChange={() => toggle(record.id)}
                  type="checkbox"
                />
                <strong>{title}</strong>
              </label>
              <dl>
                <div>
                  <dt>{t("owner")}</dt>
                  <dd>{t(record.ownerKey)}</dd>
                </div>
                <div>
                  <dt>{t("status")}</dt>
                  <dd>{t(record.statusKey)}</dd>
                </div>
                <div>
                  <dt>{t("selection")}</dt>
                  <dd>{t(isSelected ? "selected" : "notSelected")}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function SharedFormExample() {
  const t = useTranslations("SharedPatterns");
  const [errors, setErrors] = useState<
    readonly { id: string; message: string }[]
  >([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (errors.length > 0) summaryRef.current?.focus();
  }, [errors]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: { id: string; message: string }[] = [];
    if (!String(form.get("title") ?? "").trim())
      next.push({ id: "shared-title", message: t("nameError") });
    try {
      parseDateOnly(form.get("weddingDate"));
    } catch {
      next.push({ id: "shared-date", message: t("dateError") });
    }
    setErrors(next);
    setConfirmed(false);
  };
  const errorFor = (id: string) =>
    errors.find((error) => error.id === id)?.message;

  return (
    <form className="shared-form" noValidate onSubmit={submit}>
      <ErrorSummary
        errors={errors}
        summaryRef={summaryRef}
        title={t("errorSummaryTitle")}
      />
      <FormField
        description={t("nameDescription")}
        error={errorFor("shared-title")}
        id="shared-title"
        label={t("nameLabel")}
        required
      >
        <input name="title" />
      </FormField>
      <FormField
        description={t("dateDescription")}
        error={errorFor("shared-date")}
        id="shared-date"
        label={t("dateLabel")}
        required
      >
        <input name="weddingDate" type="date" />
      </FormField>
      <p className="long-label-example">{t("longLabel")}</p>
      <div className="button-row">
        <Button type="submit">{t("submit")}</Button>
        <ConfirmationDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("confirm")}
          description={t("dialogDescription")}
          onConfirm={() => setConfirmed(true)}
          title={t("dialogTitle")}
          triggerLabel={t("dialogTitle")}
        />
      </div>
      {confirmed ? <p role="status">{t("confirm")}</p> : null}
    </form>
  );
}
