import { describe, expect, it, vi } from "vitest";

import {
  createResendVerificationEmailSender,
  VerificationEmailDeliveryError,
} from "./verification-email";

describe("verification email delivery", () => {
  it("sends a privacy-minimized message with a stable idempotency key", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 202 }));
    const sender = createResendVerificationEmailSender({
      apiKey: "private-test-key",
      from: "accounts@vowora.app",
      fetch: request,
    });
    const message = {
      recipient: "partner@example.test",
      verificationUrl:
        "https://app.vowora.app/api/v1/auth/verify-email?token=synthetic-token&callbackURL=%2Faccount",
    };
    await sender(message);
    await sender(message);

    expect(request).toHaveBeenCalledTimes(2);
    const [endpoint, init] = request.mock.calls[0]!;
    expect(endpoint).toBe("https://api.resend.com/emails");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer private-test-key",
      "Content-Type": "application/json",
    });
    expect((init?.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      (request.mock.calls[1]![1]?.headers as Record<string, string>)[
        "Idempotency-Key"
      ],
    );
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      from: "accounts@vowora.app",
      to: [message.recipient],
      subject: "Verify your Vowora email",
    });
    expect(body.html).toContain("synthetic-token&amp;callbackURL=");
    expect(body.html).not.toContain("private-test-key");
  });

  it("returns a fixed safe error for network and provider failures", async () => {
    for (const request of [
      vi.fn<typeof fetch>().mockRejectedValue(new Error("private-network")),
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response("private-provider-body", { status: 400 }),
        ),
    ]) {
      const sender = createResendVerificationEmailSender({
        apiKey: "private-test-key",
        from: "accounts@vowora.app",
        fetch: request,
      });
      let error: unknown;
      try {
        await sender({
          recipient: "partner@example.test",
          verificationUrl: "https://app.vowora.app/private-token",
        });
      } catch (caught) {
        error = caught;
      }
      expect(error).toBeInstanceOf(VerificationEmailDeliveryError);
      expect(String(error)).toBe(
        "VerificationEmailDeliveryError: Verification email delivery failed",
      );
    }
  });
});
