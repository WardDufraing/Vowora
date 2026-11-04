import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("responsive permission-aware application shell", () => {
  test("renders the approved desktop order and active deep-link state", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app-shell?destination=vendors");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await skipLink.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    const sidebar = page.getByRole("complementary", {
      name: "Wedding workspace sidebar",
    });
    await expect(
      sidebar.getByRole("link", { name: "Vendors" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(sidebar.getByRole("link")).toHaveText([
      "Dashboard",
      "Timeline",
      "Decisions",
      "Vendors",
      "Budget",
      "Guests",
      "Wedding-day schedule",
      "Contacts",
      "Documents & notes",
      "Inspiration",
      "Reports & exports",
      "Workspace settings",
    ]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach("app-shell-desktop", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("uses approved mobile destinations and restores focus from More", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app-shell?destination=guests");
    const navigation = page.getByRole("navigation", {
      name: "Primary wedding navigation",
    });
    await expect(navigation.getByRole("link")).toHaveText([
      "Dashboard",
      "Timeline",
      "Guests",
      "Budget",
    ]);
    await page.goto("/app-shell?destination=vendors");
    const currentMore = page
      .getByRole("navigation", { name: "Primary wedding navigation" })
      .getByRole("button", { name: /More.*workspace navigation/ });
    await expect(currentMore).toHaveAttribute("aria-current", "page");
    await expect(currentMore).toContainText("Current");
    await currentMore.click();
    const dialog = page.getByRole("dialog", { name: "More" });
    await expect(dialog.getByRole("link", { name: "Vendors" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      dialog.getByRole("heading", { name: "Planning" }),
    ).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "People" })).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Reports" }),
    ).toBeVisible();
    const appearance = dialog.getByRole("combobox", { name: "Appearance" });
    await appearance.selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.keyboard.press("Escape");
    await expect(currentMore).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await testInfo.attach("app-shell-mobile", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("shows fewer mobile tabs without substitution and denies unauthorized deep links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app-shell?role=coordinator");
    const navigation = page.getByRole("navigation", {
      name: "Primary wedding navigation",
    });
    await expect(navigation.getByRole("link")).toHaveText([
      "Dashboard",
      "Timeline",
    ]);
    await expect(
      navigation.getByRole("button", { name: "More workspace navigation" }),
    ).toBeVisible();
    const denied = await page.goto(
      "/app-shell?role=coordinator&destination=guests",
    );
    expect(denied?.status()).toBe(404);
  });

  test("searches accessible weddings and keeps the current workspace in place", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app-shell?destination=timeline");
    const switcher = page.locator(
      ".app-shell__sidebar details.workspace-switcher",
    );
    await switcher.locator("summary").click();
    const search = switcher.getByRole("searchbox", {
      name: "Search weddings",
    });
    await search.fill("missing wedding");
    await expect(switcher.getByRole("status")).toContainText(
      "No weddings found",
    );
    await switcher.getByRole("button", { name: "Clear search" }).click();
    await expect(
      switcher.getByRole("link", { name: /Morgan & Riley/ }),
    ).toHaveAttribute(
      "href",
      "/weddings/019a1f5e-70a0-7000-8000-000000000003/dashboard",
    );
    const before = page.url();
    await switcher.getByRole("button", { name: /Jordan & Alex/ }).click();
    await expect(switcher).not.toHaveAttribute("open", "");
    expect(page.url()).toBe(before);
  });

  test("keeps visible wedding identity in collapsed single and multi-workspace rails", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const search of ["", "?single=true"]) {
      await page.goto(`/app-shell${search}`);
      await page.getByRole("button", { name: "Collapse sidebar" }).click();
      const compact = page
        .getByRole("complementary", { name: "Wedding workspace sidebar" })
        .getByTitle("Current workspace: Jordan & Alex");
      await expect(compact).toBeVisible();
      await expect(compact).toHaveAttribute(
        "title",
        "Current workspace: Jordan & Alex",
      );
    }
  });

  test("reflows with long labels, large text, safe targets and both themes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ["light", "dark"] as const) {
      await page.addInitScript(
        (value) => localStorage.setItem("vowora-app-theme", value),
        theme,
      );
      await page.goto("/app-shell");
      await page
        .locator(
          ".workspace-context strong, .workspace-switcher summary strong",
        )
        .first()
        .evaluate((node) => {
          node.textContent =
            "A deliberately long localized wedding workspace name";
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
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
      .locator("a, button, summary")
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const style = getComputedStyle(element);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              element.getClientRects().length > 0
            );
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label:
                element.getAttribute("aria-label") ??
                element.textContent?.trim() ??
                element.tagName,
              width: rect.width,
              height: rect.height,
            };
          }),
      );
    expect(
      targets.filter(({ width, height }) => width < 44 || height < 44),
    ).toEqual([]);
  });
});
