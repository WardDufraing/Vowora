import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("private notes and immediate-exit consequences are localized and accessible", async ({
  page,
}) => {
  await page.route("**/handover?mode=immediate", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessId: "019a2f36-0eb9-7000-8000-000000000005",
          weddingId: "019a2f36-0eb9-7000-8000-000000000004",
          activeAssignmentCount: 2,
          leadAssigned: true,
          pendingInvitationCount: 1,
          unresolvedResponsibilityCount: null,
          sharedDataRetained: true,
          privateNotesRetainedByOrganization: true,
        },
      }),
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/planner-private-review?locale=fr");

  await expect(
    page.getByRole("heading", { name: "Notes privées de l’organisation" }),
  ).toBeVisible();
  await expect(page.getByText(/jamais partagées avec le couple/)).toBeVisible();
  await expect(
    page.getByLabel("Identifiant du mariage (facultatif)"),
  ).toBeVisible();

  await page.getByLabel("Quitter immédiatement").check();
  await page
    .getByRole("button", { name: "Examiner le transfert actuel" })
    .click();
  const finish = page.getByRole("button", {
    name: "Mettre fin à l’accès",
  });
  await expect(finish).toBeDisabled();
  await expect(
    page.getByText(/Tous les accès de l’organisation et du personnel/),
  ).toBeVisible();
  await expect(
    page.getByText(
      /couple conserve toutes les données et l’historique partagés/,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/notes privées restent dans l’organisation/),
  ).toBeVisible();
  await page.getByLabel("J’ai examiné ces conséquences").check();
  await expect(finish).toBeEnabled();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
