import { expect, test } from "@playwright/test";

test("account entry points render honestly and remain outside search", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Vowora — Account access");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The application is in development.",
  );
  await expect(
    page.getByText(
      "Planning features are in development. Account access is available.",
    ),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
  await expect(
    page.getByRole("link", { name: "Create account" }),
  ).toHaveAttribute("href", "/sign-up");
});

test("sign-up and sign-in forms expose accessible account controls", async ({
  page,
}) => {
  for (const [path, heading, button] of [
    ["/sign-up", "Create your account", "Create account"],
    ["/sign-in", "Sign in", "Sign in"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: button })).toBeVisible();
  }
});

test("verification page offers an enumeration-safe resend form", async ({
  page,
}) => {
  await page.goto("/verify-email");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Verify your email",
  );
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send verification email" }),
  ).toBeVisible();
});

test("password recovery renders safe accessible request and reset states", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Reset your password",
  );
  await expect(page.getByLabel("Email")).toHaveAttribute(
    "autocomplete",
    "email",
  );
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeVisible();

  await page.goto("/reset-password?token=synthetic-token");
  await expect(page.getByLabel("New password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await expect(
    page.getByRole("button", { name: "Set new password" }),
  ).toBeVisible();

  await page.goto("/reset-password?error=INVALID_TOKEN");
  await expect(
    page.getByText("This reset link is invalid or expired.", { exact: true }),
  ).toBeVisible();
});

test("product foundation fits narrow mobile viewports", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
