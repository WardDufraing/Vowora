import { describe, expect, it } from "vitest";
import { languageNames, localePath, routing } from "./routing";
import en from "../messages/en.json";
import nl from "../messages/nl.json";
import fr from "../messages/fr.json";
import de from "../messages/de.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value)
    .flatMap(([name, child]) => keys(child, `${prefix}.${name}`))
    .sort();
}

describe("marketing locale contract", () => {
  it.each([
    ["en", "/", "English"],
    ["nl", "/nl", "Nederlands"],
    ["fr", "/fr", "Français"],
    ["de", "/de", "Deutsch"],
  ] as const)(
    "provides a shareable native-name link for %s",
    (locale, path, name) => {
      expect(localePath(locale)).toBe(path);
      expect(languageNames[locale]).toBe(name);
      expect(routing.locales).toContain(locale);
    },
  );
  it("keeps English default stable without browser-language detection", () => {
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localeDetection).toBe(false);
  });
  it.each([
    ["Dutch", nl],
    ["French", fr],
    ["German", de],
  ])("keeps %s message keys complete", (_, messages) => {
    expect(keys(messages)).toEqual(keys(en));
  });
});
