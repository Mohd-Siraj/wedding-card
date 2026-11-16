// Formatting and time zone helpers shared by server and client code.

export const CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "NZD", "MYR",
  "SAR", "QAR", "KWD", "BDT", "PKR", "LKR", "NPR", "ZAR", "JPY", "CHF",
] as const;

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** "Saturday, 12 December 2026" in the venue's time zone. */
export function formatDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

/** "12 Dec 2026" in the venue's time zone. */
export function formatShortDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

/** "6:30 pm" in the venue's time zone, plus the zone abbreviation. */
export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso));
}

function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

/**
 * Converts a wall-clock time at the venue ("2026-12-12T18:30", as produced by
 * <input type="datetime-local">) into a UTC ISO string.
 */
export function zonedLocalToUtc(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle daylight-saving transitions.
  let utc = guess - zoneOffsetMs(guess, timeZone);
  utc = guess - zoneOffsetMs(utc, timeZone);
  return new Date(utc).toISOString();
}

/** Inverse of zonedLocalToUtc, for pre-filling datetime-local inputs. */
export function utcToZonedLocal(iso: string, timeZone: string): string {
  const ms = new Date(iso).getTime();
  const local = new Date(ms + zoneOffsetMs(ms, timeZone));
  return local.toISOString().slice(0, 16);
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function appName() {
  return process.env.NEXT_PUBLIC_APP_NAME || "our app";
}
