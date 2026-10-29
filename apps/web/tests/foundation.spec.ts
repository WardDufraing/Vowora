import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test.describe("semantic theme foundation", () => {
  test("defaults to System, follows OS changes and persists explicit overrides", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/design-system");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    await expect(page.getByLabel("Appearance")).toHaveValue("system");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(20, 33, 27)",
    );

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(248, 248, 245)",
    );

    await page.getByLabel("Appearance").selectOption("dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(20, 33, 27)",
    );
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme} foundation has no detectable accessibility violations`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript((preference) => {
        localStorage.setItem("vowora-app-theme", preference);
      }, theme);
      await page.goto("/design-system");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "A focused welcome back" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Planning at a glance" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "One thoughtful place to plan together",
        }),
      ).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      await testInfo.attach(`foundation-${theme}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });

      await page.goto("/sign-in");
      await expect(
        page.getByRole("link", { name: "Forgot your password?" }),
      ).toHaveCSS("text-decoration-line", "underline");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  }

  test("supports keyboard dialog behavior and forced-color focus", async ({
    page,
  }) => {
    await page.goto("/design-system");
    await page.getByRole("button", { name: "Open dialog example" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open dialog example" }),
    ).toBeFocused();

    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () =>
          window.matchMedia("(forced-colors: active)").matches &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
  });

  test("reflows at narrow and large-text equivalents with usable targets", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/design-system");
    await page
      .getByRole("button", { name: "Secondary action" })
      .evaluate((button) => {
        button.textContent =
          "Secondary action with a deliberately long localized label";
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 640, height: 720 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const targets = await page
      .locator("button:not([disabled]), select")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
    expect(
      targets.every(({ width, height }) => width >= 44 && height >= 44),
    ).toBe(true);
    await testInfo.attach("foundation-mobile-large-text", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});

test("sign-in exposes an accessible fallback when elevated risk requires a challenge", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/sign-in/email", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "AUTHENTICATION_CHALLENGE_REQUIRED" }),
    });
  });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("partner@example.test");
  await page.getByLabel("Password").fill("synthetic-passphrase-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Complete the verification challenge and try again.",
  );
  await expect(
    page.getByText(
      "Additional verification is temporarily unavailable. Try again later.",
      { exact: true },
    ),
  ).toHaveAttribute("role", "alert");
});
