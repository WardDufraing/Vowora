import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import en from "../messages/en.json";
import nl from "../messages/nl.json";
import fr from "../messages/fr.json";
import de from "../messages/de.json";
const dictionaries = { en, nl, fr, de };
const paths = { en: "/", nl: "/nl", fr: "/fr", de: "/de" };
const verified =
  process.env.MARKETING_SITE_URL === "https://vowora.app" ||
  process.env.MARKETING_SITE_URL === "https://vowora.app/";
for (const [locale, messages] of Object.entries(dictionaries)) {
  test(`${locale}: complete translated page, footer controls and metadata`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(paths[locale as keyof typeof paths]);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle(messages.title);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      messages.heroFirst + messages.heroSecond + messages.heroEmphasis,
    );
    const nonVisible = [
      "skip",
      "home",
      "nav",
      "conceptAlt",
      "languages",
      "title",
      "metaDescription",
      "ogDescription",
      "twitterDescription",
    ];
    const text = (await page.locator("body").textContent())!;
    for (const [key, value] of Object.entries(messages)) {
      if (!nonVisible.includes(key))
        expect(text, `${locale}.${key}`).toContain(value);
    }
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
    await expect(
      page.getByRole("navigation", { name: messages.nav }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: messages.conceptAlt }),
    ).toBeVisible();
    await expect(page.locator("header select")).toHaveCount(0);
    const theme = page
      .locator("footer")
      .getByLabel(messages.theme, { exact: true });
    await expect(theme).toHaveCount(1);
    expect(await theme.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(
      "400",
    );
    expect((await theme.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const nav = page
      .locator("footer")
      .getByRole("navigation", { name: messages.languages });
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute(
      "href",
      paths[locale as keyof typeof paths],
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      messages.metaDescription,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      messages.title,
    );
    if (verified) {
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonical!).href).toBe(
        new URL(paths[locale as keyof typeof paths], "https://vowora.app").href,
      );
      for (const [language, path] of Object.entries(paths)) {
        const alternate = await page
          .locator(`link[rel="alternate"][hreflang="${language}"]`)
          .getAttribute("href");
        expect(new URL(alternate!).href).toBe(
          new URL(path, "https://vowora.app").href,
        );
      }
      const fallback = await page
        .locator('link[hreflang="x-default"]')
        .getAttribute("href");
      expect(new URL(fallback!).href).toBe("https://vowora.app/");
    } else {
      await expect(
        page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]'),
      ).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      );
    }
    await page.getByRole("link", { name: messages.explore }).click();
    await expect(page).toHaveURL(
      new RegExp(`${paths[locale as keyof typeof paths]}#vision$`),
    );
    expect(errors).toEqual([]);
  });
  for (const scheme of ["light", "dark"] as const) {
    test(`${locale}/${scheme}: mobile accessibility and enlarged-text reflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(paths[locale as keyof typeof paths]);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(scan.violations).toEqual([]);
      await page.addStyleTag({ content: "html {font-size:200%}" });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page
        .locator("footer")
        .getByLabel(messages.theme, { exact: true })
        .focus();
      await expect(
        page.locator("footer").getByLabel(messages.theme, { exact: true }),
      ).toBeFocused();
    });
  }
}
test("language navigation retains theme and English stays default regardless of browser language", async ({
  page,
  request,
}) => {
  const response = await request.get("/", {
    headers: { "Accept-Language": "nl-NL,nl;q=0.9" },
  });
  expect(new URL(response.url()).pathname).toBe("/");
  expect(await response.text()).toContain('lang="en"');
  await page.goto("/");
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  for (const [locale, name, label] of [
    ["nl", "Nederlands", "Thema"],
    ["fr", "Français", "Thème"],
    ["de", "Deutsch", "Design"],
    ["en", "English", "Theme"],
  ]) {
    await page
      .locator("footer")
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("dark");
  }
  await page.getByLabel("Theme", { exact: true }).selectOption("system");
  await page.reload();
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("system");
});
test("invalid locale and nested paths are 404; explicit English has a single URL", async ({
  request,
}) => {
  for (const path of ["/es", "/nl/missing", "/fr/app", "/de/api/v1"])
    expect((await request.get(path)).status()).toBe(404);
  const english = await request.get("/en");
  expect(english.ok()).toBe(true);
  expect(new URL(english.url()).pathname).toBe("/");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  if (verified)
    for (const path of Object.values(paths))
      expect(sitemap).toContain(new URL(path, "https://vowora.app").href);
  else expect(sitemap).not.toContain("<loc>");
});
