import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("planner organization wedding management is localized and discoverable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/organization-management-review?locale=de");

  const navigation = page.getByRole("navigation", {
    name: "Organisationsverwaltung",
  });
  await expect(
    navigation.getByRole("link", { name: "Mitarbeitende" }),
  ).toHaveAttribute(
    "href",
    "/organizations/019a2f36-0eb9-7000-8000-000000000002/staff?locale=de",
  );
  await expect(
    navigation.getByRole("link", { name: "Hochzeiten" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Hochzeitseinladungen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hochzeitsteam" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Annehmen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ablehnen" })).toBeVisible();
  await expect(page.getByLabel("Aufgaben: Bearbeiten")).toBeVisible();
  await expect(page.getByLabel("Leitende Planung")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zuweisung speichern" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("an employee current lead sees only lead transfer and absence controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/organization-management-review?locale=de&mode=lead");

  await expect(page.getByRole("link", { name: "Mitarbeitende" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Zuweisung speichern" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Entfernen" })).toHaveCount(0);
  await expect(page.getByLabel("Neue leitende Planung")).toHaveValue(
    "019a2f36-0eb9-7000-8000-000000000007",
  );
  await expect(
    page.getByRole("button", { name: "Leitung übertragen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abwesenheit speichern" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
