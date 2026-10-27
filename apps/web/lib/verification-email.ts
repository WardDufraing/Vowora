import { createHash } from "node:crypto";

export interface VerificationEmail {
  readonly recipient: string;
  readonly verificationUrl: string;
}

export interface PasswordResetEmail {
  readonly recipient: string;
  readonly resetUrl: string;
}

export type SendVerificationEmail = (
  message: VerificationEmail,
) => Promise<void>;
export type SendPasswordResetEmail = (
  message: PasswordResetEmail,
) => Promise<void>;

export class VerificationEmailDeliveryError extends Error {
  constructor() {
    super("Verification email delivery failed");
    this.name = "VerificationEmailDeliveryError";
  }
}

export class PasswordResetEmailDeliveryError extends Error {
  constructor() {
    super("Password reset email delivery failed");
    this.name = "PasswordResetEmailDeliveryError";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function createResendVerificationEmailSender(config: {
  readonly apiKey: string;
  readonly from: string;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}): SendVerificationEmail {
  const request = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 5_000;
  return async ({ recipient, verificationUrl }) => {
    const idempotencyKey = createHash("sha256")
      .update(verificationUrl)
      .digest("hex");
    const safeUrl = escapeHtml(verificationUrl);
    let response: Response;
    try {
      response = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `vowora-verification-${idempotencyKey}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          from: config.from,
          to: [recipient],
          subject: "Verify your Vowora email",
          html: `<p>Verify your email address to continue to Vowora.</p><p><a href="${safeUrl}">Verify email</a></p><p>This link expires in one hour.</p>`,
        }),
      });
    } catch {
      throw new VerificationEmailDeliveryError();
    }
    if (!response.ok) throw new VerificationEmailDeliveryError();
  };
}

export function createResendPasswordResetEmailSender(config: {
  readonly apiKey: string;
  readonly from: string;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}): SendPasswordResetEmail {
  const request = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 5_000;
  return async ({ recipient, resetUrl }) => {
    const idempotencyKey = createHash("sha256").update(resetUrl).digest("hex");
    const safeUrl = escapeHtml(resetUrl);
    let response: Response;
    try {
      response = await request("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `vowora-password-reset-${idempotencyKey}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          from: config.from,
          to: [recipient],
          subject: "Reset your Vowora password",
          html: `<p>A password reset was requested for your Vowora account.</p><p><a href="${safeUrl}">Reset password</a></p><p>This single-use link expires in one hour. If you did not request it, you can ignore this email.</p>`,
        }),
      });
    } catch {
      throw new PasswordResetEmailDeliveryError();
    }
    if (!response.ok) throw new PasswordResetEmailDeliveryError();
  };
}
