import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const scheme of ["light", "dark"] as const) {
  test(`${scheme}: semantic contrast, keyboard and accessibility`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(page.getByLabel("Theme")).toHaveValue("system");
    const ratios = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const color = (token: string) => styles.getPropertyValue(`--${token}`).trim();
      const luminance = (hex: string) => {
        const raw = hex.replace("#", "");
        const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
        const values = full.match(/.{2}/g)!.slice(0, 3).map((x) => {
          const c = parseInt(x, 16) / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      };
      const pairs: [string, string, number][] = [
        ["foreground", "background", 4.5], ["foreground", "card", 4.5],
        ["foreground", "accent", 4.5], ["muted-foreground", "background", 4.5],
        ["muted-foreground", "card", 4.5], ["muted-foreground", "accent", 4.5],
        ["primary-foreground", "primary", 4.5], ["primary-foreground", "primary-hover", 4.5],
        ["primary-foreground", "primary-active", 4.5], ["link", "background", 4.5],
        ["link", "card", 4.5], ["link-hover", "background", 4.5],
        ["secondary-foreground", "secondary", 4.5], ["selected-foreground", "selected", 4.5],
        ["disabled-foreground", "disabled", 4.5],
        ...["success", "warning", "destructive", "info"].map((s): [string, string, number] => [s, `${s}-surface`, 4.5]),
        ...["ring", "control-border"].flatMap((s) => ["background", "card", "accent"].map((b): [string, string, number] => [s, b, 3])),
        ...["chart-1", "chart-2", "chart-3"].map((s): [string, string, number] => [s, "card", 3]),
      ];
      return pairs.map(([fg, bg, minimum]) => {
        const a = luminance(color(fg)); const b = luminance(color(bg));
        return { fg, bg, minimum, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    });
    for (const pair of ratios) expect(pair.ratio, `${pair.fg}/${pair.bg}`).toBeGreaterThanOrEqual(pair.minimum);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeInViewport();
    const focus = await page.locator(":focus").evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(focus).toBe("3px");
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(scan.violations).toEqual([]);
  });
}

test("theme override persists, System follows live OS changes, and storage denial is safe", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const background = () => page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await background();
  await page.getByLabel("Theme").selectOption("dark");
  expect(await background()).not.toBe(light);
  await page.reload();
  await expect(page.getByLabel("Theme")).toHaveValue("dark");
  await page.getByLabel("Theme").selectOption("system");
  expect(await background()).toBe(light);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await background()).not.toBe(light);
  await page.emulateMedia({ colorScheme: "light" });
  expect(await background()).toBe(light);
  await page.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage denied"); } }); });
  await page.reload();
  await page.getByLabel("Theme").selectOption("dark");
  expect(await background()).not.toBe(light);
});

for (const width of [320, 375, 768, 1440]) {
  test(`reflow at ${width}px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.addStyleTag({ content: "html { font-size: 200% }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByLabel("Theme")).toBeVisible();
  });
}

test("reduced motion, forced colors and control targets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/");
  expect(await page.locator("html").evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe("auto");
  const button = page.getByRole("link", { name: "Explore the vision" });
  expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  for (const control of [button, page.getByLabel("Theme")]) {
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});
