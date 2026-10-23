import { expect, test } from "@playwright/test";

test("product foundation renders honestly and remains outside search", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Vowora — Application foundation");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The application is in development.",
  );
  await expect(
    page.getByText(
      "Planning features and account access are not available yet.",
    ),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link")).toHaveCount(0);
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
