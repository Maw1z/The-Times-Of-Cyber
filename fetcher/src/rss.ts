import Parser from "rss-parser";
import type { FeedConfig } from "./config.ts";
import { fetchText, errMsg } from "./http.ts";
import { clean, decodeEntities, domainOf, hashId, htmlToParagraphs } from "./text.ts";
import type { SourceStatus } from "../../client/src/types/edition.ts";

/** A normalized feed item before classification/placement. */
export interface RawItem {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceKind: FeedConfig["kind"];
  weight: number;
  domain: string;
  author?: string;
  published: string;
  paragraphs: string[];
  image?: string;
}

type MediaNode = { $?: { url?: string; medium?: string; type?: string; width?: string } };
type CustomItem = {
  contentEncoded?: string;
  creator?: unknown;
  author?: unknown;
  mediaContent?: MediaNode[];
  mediaThumbnail?: MediaNode | MediaNode[];
  image?: string | { url?: string };
  enclosure?: { url?: string; type?: string };
  summary?: string;
};

const parser: Parser<object, CustomItem> = new Parser({
  timeout: 15_000,
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      "image",
      "summary",
      "author",
    ],
  },
});

const IMG_RE = /<img[^>]+src=["']([^"']+)["']/i;

function pickImage(item: Parser.Item & CustomItem): string | undefined {
  const candidates: (string | undefined)[] = [];
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image"))) candidates.push(item.enclosure.url);
  for (const m of item.mediaContent ?? []) {
    const t = m.$?.medium ?? m.$?.type ?? "image";
    if (t.startsWith("image")) candidates.push(m.$?.url);
  }
  const thumbs = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : item.mediaThumbnail ? [item.mediaThumbnail] : [];
  for (const t of thumbs) candidates.push(t.$?.url);
  if (typeof item.image === "string") candidates.push(item.image);
  else if (item.image?.url) candidates.push(item.image.url);
  for (const html of [item.contentEncoded, item.content]) {
    const m = html?.match(IMG_RE);
    if (m) candidates.push(m[1]);
  }
  return candidates
    .map((u) => (u ? decodeEntities(u.trim()) : u))
    .find((u) => !!u && /^https?:\/\//.test(u) && !/(feedburner|pixel|gravatar|1x1|spacer|emoji|\.gif(\?|$))/i.test(u));
}

/**
 * Text out of whatever xml2js produced: a string, an array of nodes, or an element
 * object (`{ _: "text" }`, `{ name: ["…"] }`). Some feeds (Google TI) put structured
 * <author> blocks in items, which rss-parser passes through as null-prototype objects.
 */
function textOf(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) {
    const parts = v.map(textOf).filter((x): x is string => !!x);
    return parts.length ? parts.join(", ") : undefined;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return textOf(o._ ?? o.name ?? o["#"]);
  }
  return undefined;
}

function pickAuthor(item: Parser.Item & CustomItem): string | undefined {
  const raw = textOf(item.creator) ?? textOf(item.author);
  if (!raw) return undefined;
  const a = clean(raw).replace(/^by\s+/i, "");
  // Drop e-mail style "noreply@blogger.com (Name)" → Name, and generic staff bylines.
  const paren = a.match(/\(([^)]+)\)/);
  const name = paren ? paren[1] : a;
  if (!name || /@|^(admin|editor|staff|team|unknown)$/i.test(name) || name.length > 60) return undefined;
  return name;
}

export async function fetchFeed(cfg: FeedConfig): Promise<{ items: RawItem[]; status: SourceStatus }> {
  try {
    const xml = await fetchText(cfg.url);
    const feed = await parser.parseString(xml);
    const items: RawItem[] = [];
    for (const it of feed.items) {
      const link = (it.link ?? "").trim();
      const title = clean(it.title ?? "");
      const published = it.isoDate ?? (it.pubDate ? new Date(it.pubDate).toISOString() : undefined);
      if (!link || !title || !published || Number.isNaN(Date.parse(published))) continue;
      // Prefer the full body when the feed carries one; fall back to the summary.
      let paragraphs = htmlToParagraphs(it.contentEncoded ?? it.content);
      if (!paragraphs.length) paragraphs = htmlToParagraphs(it.summary ?? it.contentSnippet);
      if (!paragraphs.length && it.contentSnippet) paragraphs = [clean(it.contentSnippet)];
      items.push({
        id: hashId(link),
        title,
        link,
        source: cfg.name,
        sourceKind: cfg.kind,
        weight: cfg.weight,
        domain: domainOf(link),
        author: pickAuthor(it),
        published,
        paragraphs,
        image: pickImage(it),
      });
    }
    return { items, status: { name: cfg.name, url: cfg.url, kind: cfg.kind, ok: true, items: items.length } };
  } catch (err) {
    if (process.env.DEBUG_FEEDS) console.error(err);
    return { items: [], status: { name: cfg.name, url: cfg.url, kind: cfg.kind, ok: false, items: 0, error: errMsg(err).slice(0, 160) } };
  }
}
