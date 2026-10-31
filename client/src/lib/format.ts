const DAY = 86_400_000;

/** First edition (the project's first commit). Used for the "No." counter. */
const FIRST_EDITION = Date.UTC(2026, 3, 28);

export function editionNumber(iso: string): number {
  return Math.max(1, Math.floor((Date.parse(iso) - FIRST_EDITION) / DAY) + 1);
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function shortDate(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function timeUTC(iso: string): string {
  return `${new Date(iso).toISOString().slice(11, 16)} UTC`;
}

/** Morning / Afternoon / Late edition by the hour the snapshot was taken (viewer's time zone). */
export function editionName(iso: string): string {
  const h = new Date(iso).getHours();
  return h < 12 ? "Morning Edition" : h < 17 ? "Afternoon Edition" : "Late Edition";
}

export function ago(iso: string, now = Date.now()): string {
  const mins = Math.round((now - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function compact(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function windowLabel(hours: number): string {
  return hours <= 72 ? `last ${hours} hours` : `last ${Math.round(hours / 24)} days`;
}

/** Days from now until an ISO date (negative = overdue). */
export function daysUntil(isoDate: string, now = Date.now()): number {
  return Math.ceil((Date.parse(`${isoDate.slice(0, 10)}T23:59:59Z`) - now) / DAY);
}

export function pct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}

const REGION = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export function countryName(code?: string): string {
  if (!code) return "Unknown";
  try {
    return REGION?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
