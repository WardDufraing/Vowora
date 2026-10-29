import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);

function declarations(block: string) {
  return Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function block(pattern: RegExp) {
  const match = css.match(pattern);
  if (!match?.[1]) throw new Error(`Missing CSS block: ${pattern}`);
  return declarations(match[1]);
}

const light = block(/:root\s*\{([\s\S]*?)\n\}/);
const dark = block(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
const systemDark = block(/:root\[data-theme="system"\]\s*\{([\s\S]*?)\n\s*\}/);

function resolve(
  name: string,
  theme: Record<string, string>,
  seen = new Set<string>(),
): string {
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`);
  seen.add(name);
  const value = theme[name] ?? light[name];
  if (!value) throw new Error(`Unknown token: ${name}`);
  const reference = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
  return reference ? resolve(reference, theme, seen) : value;
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .slice(0, 3)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const textPairs = [
  ["--foreground", "--background"],
  ["--card-foreground", "--card"],
  ["--popover-foreground", "--popover"],
  ["--muted-foreground", "--muted"],
  ["--primary-foreground", "--primary"],
  ["--primary-foreground", "--primary-hover"],
  ["--primary-foreground", "--primary-pressed"],
  ["--secondary-foreground", "--secondary"],
  ["--secondary-foreground", "--secondary-hover"],
  ["--secondary-foreground", "--secondary-pressed"],
  ["--accent-foreground", "--accent"],
  ["--link", "--background"],
  ["--link-hover", "--background"],
  ["--selected-foreground", "--selected"],
  ["--disabled-foreground", "--disabled"],
  ["--destructive-surface", "--destructive"],
  ["--success", "--success-surface"],
  ["--warning", "--warning-surface"],
  ["--destructive", "--destructive-surface"],
  ["--information", "--information-surface"],
] as const;

const nonTextPairs = [
  ["--ring", "--background"],
  ["--ring", "--card"],
  ["--control-border", "--card"],
  ["--control-border", "--background"],
  ["--chart-1", "--background"],
  ["--chart-2", "--background"],
  ["--chart-3", "--background"],
] as const;

describe("semantic theme tokens", () => {
  it("preserves the approved FINAL-003 core reference palette", () => {
    expect(resolve("--background", light)).toBe("#f8f8f5");
    expect(resolve("--foreground", light)).toBe("#293c35");
    expect(resolve("--card", light)).toBe("#ffffff");
    expect(resolve("--muted", light)).toBe("#e9ede7");
    expect(resolve("--primary", light)).toBe("#293c35");
    expect(resolve("--ring", light)).toBe("#3b6750");
    expect(resolve("--background", dark)).toBe("#14211b");
    expect(resolve("--foreground", dark)).toBe("#f1f5ef");
    expect(resolve("--card", dark)).toBe("#203128");
    expect(resolve("--muted", dark)).toBe("#2b3d31");
    expect(resolve("--primary", dark)).toBe("#a9c5b0");
    expect(resolve("--ring", dark)).toBe("#b4d7bd");
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)("meets ordinary text contrast in %s", (_name, theme) => {
    for (const [foreground, background] of textPairs) {
      expect(
        contrast(resolve(foreground, theme), resolve(background, theme)),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)("meets meaningful non-text contrast in %s", (_name, theme) => {
    for (const [foreground, background] of nonTextPairs) {
      expect(
        contrast(resolve(foreground, theme), resolve(background, theme)),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps System dark aliases identical to explicit Dark", () => {
    for (const name of Object.keys(dark).filter((name) =>
      name.startsWith("--"),
    )) {
      if (name.startsWith("--shadow")) continue;
      expect(resolve(name, systemDark), name).toBe(resolve(name, dark));
    }
  });
});
