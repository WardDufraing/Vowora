"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
}) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function TextField({
  id,
  label,
  description,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {description ? (
        <p className="field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <input
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  readonly tone: "success" | "warning" | "destructive" | "info";
  readonly children: ReactNode;
}) {
  return <span className={`status status--${tone}`}>{children}</span>;
}

export function FoundationDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary">Open dialog example</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog__overlay" />
        <Dialog.Content className="dialog__content">
          <Dialog.Title>Review this example</Dialog.Title>
          <Dialog.Description>
            Focus stays inside this dialog and returns to the trigger when it
            closes.
          </Dialog.Description>
          <div className="button-row">
            <Dialog.Close asChild>
              <Button>Confirm</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
