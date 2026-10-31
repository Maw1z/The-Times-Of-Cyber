import { createHash } from "node:crypto";

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»",
  copy: "©", reg: "®", trade: "™", bull: "•", middot: "·", eacute: "é", uuml: "ü", ouml: "ö", auml: "ä",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const BOILERPLATE = [
  /The post .{3,200}? appeared first on .{2,80}?\.?$/i,
  /\s*(Continue reading|Read more|Read the full (story|article))\b.*$/i,
  /\s*\[(…|\.\.\.|&#8230;)\]\s*$/,
  /\s*(…|\.\.\.)\s*$/,
];

/** HTML → array of plain-text paragraphs. */
export function htmlToParagraphs(html: string | undefined): string[] {
  if (!html) return [];
  let s = html
    .replace(/<(script|style|figure|figcaption|iframe|noscript|table)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s).replace(/\r/g, "");
  return s
    .split(/\n\s*\n/)
    .map((p) => clean(p.replace(/\n/g, " ")))
    .map((p) => BOILERPLATE.reduce((acc, re) => acc.replace(re, ""), p).trim())
    .filter((p) => p.length > 30 && !/^(share|tweet|related|tags?):/i.test(p));
}

export function clean(s: string): string {
  return decodeEntities(s).replace(/\s+/g, " ").trim();
}

/** Keep whole paragraphs up to roughly `maxWords`; cut the last one at a sentence boundary. */
export function budgetParagraphs(paragraphs: string[], maxWords: number): string[] {
  const out: string[] = [];
  let used = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    if (used + words.length <= maxWords) {
      out.push(p);
      used += words.length;
      continue;
    }
    const remaining = maxWords - used;
    if (remaining >= 15) {
      const slice = words.slice(0, remaining).join(" ");
      const end = slice.search(/[.!?]["”’)]?\s[^.!?]*$/);
      out.push(end > 40 ? slice.slice(0, end + 1) : `${slice}…`);
    }
    break;
  }
  return out;
}

export function hashId(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 12);
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const STOP = new Set(
  "the a an and or of to in on for with by at from as is are was were be been it its this that these those new after over into amid via how why what who says said report reports than more about against under up out not now can could will would has have had their his her they you your our we us all any but also just one two first".split(
    " ",
  ),
);

export function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[’']s\b/g, "")
      .split(/[^a-z0-9-]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export const CVE_RE = /\bCVE-\d{4}-\d{4,7}\b/gi;
export function findCves(s: string): string[] {
  return [...new Set((s.match(CVE_RE) ?? []).map((c) => c.toUpperCase()))];
}

export function hoursAgo(iso: string, now: number): number {
  return (now - Date.parse(iso)) / 3_600_000;
}

/** Make an indicator safe to display/copy: hxxp://, [.] in hosts and IPs. Hashes are left as-is. */
export function defang(value: string, type = ""): string {
  if (/hash|md5|sha/i.test(type)) return value;
  let v = value.replace(/^http(s?):\/\//i, "hxxp$1://");
  // dots in the host part only (keep paths readable)
  v = v.replace(/^((?:hxxps?:\/\/)?)([^/:?#]+)/i, (_m, scheme: string, host: string) => scheme + host.replace(/\./g, "[.]"));
  return v;
}

export function topCounts<T>(items: T[], key: (t: T) => string | undefined, n = 8): { name: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it)?.trim();
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}
