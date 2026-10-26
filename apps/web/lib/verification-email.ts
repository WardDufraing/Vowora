import { createHash } from "node:crypto";

export interface VerificationEmail {
  readonly recipient: string;
  readonly verificationUrl: string;
}

export type SendVerificationEmail = (
  message: VerificationEmail,
) => Promise<void>;

export class VerificationEmailDeliveryError extends Error {
  constructor() {
    super("Verification email delivery failed");
    this.name = "VerificationEmailDeliveryError";
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
}): SendVerificationEmail {
  const request = config.fetch ?? fetch;
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
