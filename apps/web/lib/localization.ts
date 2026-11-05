import { createTranslator } from "next-intl";

import { appLocales, appMessages, type AppLocale } from "../i18n/messages";

export class LocalizationInputError extends Error {
  constructor(readonly field: "locale" | "timeZone" | "date" | "instant") {
    super(`Invalid localization input: ${field}`);
    this.name = "LocalizationInputError";
  }
}

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (appLocales as readonly string[]).includes(value)
  );
}

export function parseAppLocale(value: unknown): AppLocale {
  if (!isAppLocale(value)) throw new LocalizationInputError("locale");
  return value;
}

export function resolveAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : "en";
}

export function parseWeddingTimeZone(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^(?:Etc\/[A-Za-z0-9_+\-]+|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/.test(value)
  ) {
    throw new LocalizationInputError("timeZone");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
  } catch {
    throw new LocalizationInputError("timeZone");
  }
  return value;
}

export function parseDateOnly(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new LocalizationInputError("date");
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month! - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new LocalizationInputError("date");
  }
  return value;
}

export function parseInstant(value: unknown): Date {
  if (typeof value !== "string") {
    throw new LocalizationInputError("instant");
  }
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match) throw new LocalizationInputError("instant");
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number);
  const daysInMonth = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const offsetHour = Number(match[8] ?? 0);
  const offsetMinute = Number(match[9] ?? 0);
  if (
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    day! > daysInMonth ||
    hour! > 23 ||
    minute! > 59 ||
    second! > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    throw new LocalizationInputError("instant");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()))
    throw new LocalizationInputError("instant");
  return parsed;
}

export function formatDateOnly(value: unknown, localeInput: unknown): string {
  const locale = parseAppLocale(localeInput);
  const date = parseDateOnly(value);
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
}

export function formatWeddingInstant(
  value: unknown,
  localeInput: unknown,
  timeZoneInput: unknown,
): string {
  const locale = parseAppLocale(localeInput);
  const timeZone = parseWeddingTimeZone(timeZoneInput);
  const instant = parseInstant(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(instant);
}

export function createAppTranslator(localeInput: unknown) {
  const locale = resolveAppLocale(localeInput);
  return createTranslator({ locale, messages: appMessages[locale] });
}
