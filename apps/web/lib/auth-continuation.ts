const fallback = "/account";

/** Accepts only a same-origin relative application path. */
export function safeAuthContinuation(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://app.vowora");
    if (parsed.origin !== "https://app.vowora") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function authContinuationQuery(continuation: string): string {
  return continuation === fallback
    ? ""
    : `?next=${encodeURIComponent(continuation)}`;
}
