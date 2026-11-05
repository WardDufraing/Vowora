import { describe, expect, it } from "vitest";

import {
  createAppTranslator,
  formatDateOnly,
  formatWeddingInstant,
  LocalizationInputError,
  parseAppLocale,
  parseDateOnly,
  parseInstant,
  parseWeddingTimeZone,
  resolveAppLocale,
} from "./localization";

describe("application localization foundation", () => {
  it("accepts only the four approved exact locales and uses English for request fallback", () => {
    expect(["en", "nl", "fr", "de"].map(parseAppLocale)).toEqual([
      "en",
      "nl",
      "fr",
      "de",
    ]);
    expect(resolveAppLocale("es")).toBe("en");
    expect(resolveAppLocale(undefined)).toBe("en");
    expect(() => parseAppLocale("en-US")).toThrowError(LocalizationInputError);
  });

  it("provides complete localized messages, plurals and long labels", () => {
    for (const locale of ["en", "nl", "fr", "de"] as const) {
      const translate = createAppTranslator(locale);
      expect(translate("SharedPatterns.title")).not.toContain("SharedPatterns");
      expect(translate("SharedPatterns.selectedCount", { count: 2 })).toContain(
        "2",
      );
      expect(translate("SharedPatterns.longLabel").length).toBeGreaterThan(70);
    }
    expect(createAppTranslator("unknown")("SharedPatterns.task")).toBe("Task");
  });

  it("keeps date-only values on their calendar day in every locale", () => {
    expect(parseDateOnly("2028-02-29")).toBe("2028-02-29");
    expect(formatDateOnly("2027-06-12", "en")).toContain("June");
    expect(formatDateOnly("2027-06-12", "nl")).toContain("juni");
    expect(() => parseDateOnly("2027-02-29")).toThrowError(
      LocalizationInputError,
    );
    expect(() => parseDateOnly("06/12/2027")).toThrowError(
      LocalizationInputError,
    );
  });

  it("formats instants in an explicit IANA wedding timezone across DST", () => {
    expect(parseWeddingTimeZone("Europe/Brussels")).toBe("Europe/Brussels");
    const before = formatWeddingInstant(
      "2026-03-29T00:30:00Z",
      "en",
      "Europe/Brussels",
    );
    const after = formatWeddingInstant(
      "2026-03-29T01:30:00Z",
      "en",
      "Europe/Brussels",
    );
    expect(before).toContain("1:30");
    expect(after).toContain("3:30");
    expect(
      formatWeddingInstant("2026-12-31T23:30:00Z", "de", "Europe/Brussels"),
    ).toContain("2027");
  });

  it("rejects ambiguous or invalid timezone and instant inputs", () => {
    for (const invalid of [
      "UTC",
      "Brussels",
      "../Europe/Brussels",
      "Mars/Base",
    ]) {
      expect(() => parseWeddingTimeZone(invalid)).toThrowError(
        LocalizationInputError,
      );
    }
    expect(parseInstant("2026-03-29T00:30:00+01:00")).toBeInstanceOf(Date);
    for (const invalid of [
      "2026-03-29",
      "03/29/2026 01:30",
      "2026-02-30T00:00:00Z",
      "2026-03-29T24:00:00Z",
      "not-a-date",
    ]) {
      expect(() => parseInstant(invalid)).toThrowError(LocalizationInputError);
    }
  });
});
