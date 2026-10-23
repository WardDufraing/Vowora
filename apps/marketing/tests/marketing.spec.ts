import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("truthful public page, working destinations and no fabricated application", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Vowora — One wedding, one shared plan");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "One wedding.One shared plan.",
  );
  await expect(
    page.getByText("In development · Not yet available"),
  ).toBeVisible();
  await expect(
    page.getByText("An illustrative concept, not a live app"),
  ).toBeVisible();
  await expect(
    page.getByText("Vowora is not open for signups yet."),
  ).toBeVisible();
  await expect(
    page.locator(
      "form, input[type=email], a[href='/app'], a[href*='app.vowora.app']",
    ),
  ).toHaveCount(0);
  const hrefs = await page
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
  for (const href of hrefs) {
    expect(href).toMatch(/^#[a-z-]+$/);
    await expect(page.locator(href)).toHaveCount(1);
  }
  await page.getByRole("link", { name: "Explore the vision" }).click();
  await expect(page).toHaveURL(/#vision$/);
  await expect(
    page.getByRole("heading", { name: "Less scattered. More connected." }),
  ).toBeInViewport();
  const brand = await request.get("/brand/vowora-app-icon-forest.svg");
  expect(brand.ok()).toBe(true);
  expect(brand.headers()["content-type"]).toContain("image/svg+xml");
  for (const path of ["/app", "/login", "/api/v1", "/signup"])
    expect((await request.get(path)).status()).toBe(404);
  expect(errors).toEqual([]);
});

test("SEO defaults remain unindexed until verified production URL is configured", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /in the making/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Vowora/,
  );
  const verified =
    process.env.MARKETING_SITE_URL === "https://vowora.app" ||
    process.env.MARKETING_SITE_URL === "https://vowora.app/";
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  if (verified) {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https:\/\/vowora\.app\/?$/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );
    expect(await robots.text()).toContain("Allow: /");
    expect(await sitemap.text()).toContain("https://vowora.app/");
  } else {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    expect(await robots.text()).toContain("Disallow: /");
    expect(await sitemap.text()).not.toContain("<loc>");
  }
});

for (const scheme of ["light", "dark"] as const) {
  test(`${scheme}: mobile marketing content accessible and links keyboard reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(scan.violations).toEqual([]);
    const reached: string[] = [];
    const focusableCount = await page.locator("a[href], select").count();
    for (let i = 0; i < focusableCount; i++) {
      await page.keyboard.press("Tab");
      reached.push(
        await page
          .locator(":focus")
          .evaluate((el) => el.getAttribute("href") ?? el.tagName),
      );
    }
    expect(reached).toContain("SELECT");
    expect(reached).toContain("#for-planners");
    expect(reached).toContain("#vision");
  });
}
