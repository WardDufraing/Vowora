import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("shared forms, data and localization patterns", () => {
  const dialogTitles = {
    en: "Confirm this example",
    nl: "Bevestig dit voorbeeld",
    fr: "Confirmer cet exemple",
    de: "Dieses Beispiel bestätigen",
  } as const;

  for (const locale of ["en", "nl", "fr", "de"] as const) {
    test(`${locale} messages and wedding-local formats render without fallback keys`, async ({
      page,
    }) => {
      await page.goto(`/shared-patterns?locale=${locale}`);
      await expect(page.locator("main")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByText("SharedPatterns", { exact: false }),
      ).toHaveCount(0);
      await expect(page.getByRole("link", { name: "English" })).toBeVisible();
      await expect(page.locator(".long-label-example")).not.toBeEmpty();
      await expect(page.locator(".localized-date-example dd")).toHaveCount(2);
      const trigger = page.getByRole("button", {
        name: dialogTitles[locale],
      });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toHaveAttribute("lang", locale);
      await expect(dialog).toHaveAttribute("dir", "ltr");
      await expect(
        dialog.getByRole("heading", { name: dialogTitles[locale] }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`${theme} patterns pass automated accessibility checks`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript((preference) => {
        localStorage.setItem("vowora-app-theme", preference);
      }, theme);
      await page.goto("/shared-patterns?locale=en");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await testInfo.attach(`shared-patterns-${theme}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    });
  }

  test("validation summary, date input and confirmation dialog preserve focus", async ({
    page,
  }) => {
    await page.goto("/shared-patterns?locale=en");
    await page.getByRole("button", { name: "Review example" }).click();
    const summary = page.getByRole("alert", {
      name: "Check the highlighted fields",
    });
    await expect(summary).toBeFocused();
    await expect(page.getByLabel(/Example title/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel(/Example wedding date/)).toHaveAttribute(
      "type",
      "date",
    );
    await summary
      .getByRole("link", { name: "Enter an example title." })
      .click();
    await expect(page.getByLabel(/Example title/)).toBeFocused();

    const trigger = page.getByRole("button", { name: "Confirm this example" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("sorting, selection and mobile records preserve every displayed fact", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/shared-patterns?locale=en");
    const mobileRecords = page
      .getByRole("list", { name: "Responsive records" })
      .getByRole("listitem");
    await expect(mobileRecords.locator("strong")).toHaveText([
      "Confirm venue details",
      "Review guest list",
    ]);
    await page
      .getByRole("button", { name: /Sort by task, currently ascending/ })
      .click();
    await expect(page.locator('th[aria-sort="descending"]')).toHaveCount(1);
    await expect(mobileRecords.locator("strong")).toHaveText([
      "Review guest list",
      "Confirm venue details",
    ]);
    await page
      .getByRole("checkbox", { name: "Select Review guest list" })
      .first()
      .check();
    await expect(page.getByText("2 records selected")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sort by task/ }),
    ).toBeVisible();

    const tableFacts = await page
      .locator("table tbody tr")
      .evaluateAll((rows) =>
        rows.map((row) => ({
          title: row.querySelector('th[scope="row"]')?.textContent?.trim(),
          owner: row.querySelector("td:nth-of-type(2)")?.textContent?.trim(),
          status: row.querySelector("td:nth-of-type(3)")?.textContent?.trim(),
          selected:
            row.getAttribute("aria-selected") === "true"
              ? "Selected"
              : "Not selected",
        })),
      );
    const mobileFacts = await page
      .getByRole("list", { name: "Responsive records" })
      .getByRole("listitem")
      .evaluateAll((items) =>
        items.map((item) => {
          const facts = Object.fromEntries(
            Array.from(item.querySelectorAll("dl > div")).map((fact) => [
              fact.querySelector("dt")?.textContent?.trim(),
              fact.querySelector("dd")?.textContent?.trim(),
            ]),
          );
          return {
            title: item.querySelector("strong")?.textContent?.trim(),
            owner: facts.Owner,
            status: facts.Status,
            selected: facts.Selection,
          };
        }),
      );
    expect(mobileFacts).toEqual(tableFacts);
    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(page.getByText("No records selected")).toBeVisible();
  });

  test("truthful states, reflow, forced colors and targets remain usable", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/shared-patterns?locale=de");
    await expect(
      page.getByRole("alert", { name: /Datensätze konnten/ }),
    ).toBeVisible();
    await expect(page.getByText(/Zugriff umfasst/)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
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
    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    const targets = await page
      .locator(
        "button:not([disabled]), input:not([type=checkbox]), select, .locale-review-nav a",
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rectangle = element.getBoundingClientRect();
          return { width: rectangle.width, height: rectangle.height };
        }),
      );
    expect(
      targets
        .filter(({ width, height }) => width > 0 && height > 0)
        .every(({ width, height }) => width >= 44 && height >= 44),
    ).toBe(true);
    await testInfo.attach("shared-patterns-mobile-de", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
