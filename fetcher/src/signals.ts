import { ACTOR_WINDOW_DAYS } from "./config.ts";
import { ACTORS, ACTOR_REGEXES } from "./actors.ts";
import { TOPIC_LEXICON } from "./classify.ts";
import { findCves } from "./text.ts";
import type { Archive, ArchiveItem } from "./archive.ts";
import type { ActorDesk, ActorRow, TopicRow, Trend } from "../../client/src/types/edition.ts";

const H = 3_600_000;
const D = 24 * H;

function text(it: ArchiveItem) {
  return `${it.t} ${it.x}`;
}

/** Hours of history available in the archive (bounded by the oldest item kept). */
export function historyHours(archive: Archive, now: number): number {
  const oldest = archive.items.reduce((m, it) => Math.min(m, Date.parse(it.d)), now);
  return Math.max(0, (now - oldest) / H);
}

function trendOf(cur: number, prev: number | null): Trend {
  if (prev === null) return "unknown";
  if (prev === 0) return cur > 0 ? "new" : "steady";
  const r = cur / prev;
  if (r >= 1.3) return "rising";
  if (r <= 0.75) return "cooling";
  return "steady";
}

/**
 * Community Signal board: topics ranked by mentions across news, HN and Reddit in
 * the last 24h, compared with the 24h before. Every column is a count — no scoring
 * model or sentiment guesswork.
 */
export function buildTopics(archive: Archive, now: number): { rows: TopicRow[]; history: number } {
  const history = historyHours(archive, now);
  const cur = archive.items.filter((it) => now - Date.parse(it.d) <= D);
  const prev = archive.items.filter((it) => {
    const age = now - Date.parse(it.d);
    return age > D && age <= 2 * D;
  });
  const hasPrev = history >= 47;

  type Def = { id: string; label: string; kind: TopicRow["kind"]; test: (s: string) => boolean };
  const defs: Def[] = TOPIC_LEXICON.map((t) => ({ id: t.id, label: t.label, kind: "topic" as const, test: (s: string) => t.re.test(s) }));

  // Dynamic topics: CVEs and named actors that show up in ≥2 items today.
  const cveCounts = new Map<string, number>();
  for (const it of cur) for (const c of findCves(text(it))) cveCounts.set(c, (cveCounts.get(c) ?? 0) + 1);
  for (const [cve, n] of cveCounts) if (n >= 2) defs.push({ id: cve, label: cve, kind: "cve", test: (s) => s.toUpperCase().includes(cve) });
  for (const a of ACTOR_REGEXES) {
    const n = cur.filter((it) => a.re.test(text(it))).length;
    const ref = ACTORS.find((x) => x.id === a.id)!;
    if (n >= 2) defs.push({ id: `actor-${a.id}`, label: ref.name, kind: "actor", test: (s) => a.re.test(s) });
  }

  const rows: TopicRow[] = defs.map((d) => {
    const hits = cur.filter((it) => d.test(text(it)));
    const prevHits = prev.filter((it) => d.test(text(it))).length;
    const community = hits.filter((h) => h.k !== "news");
    const topCommunity = [...community].sort((a, b) => (b.p ?? 0) - (a.p ?? 0))[0];
    const topNews = hits.filter((h) => h.k === "news").sort((a, b) => b.d.localeCompare(a.d))[0];
    const top = topCommunity ?? topNews;
    return {
      id: d.id,
      label: d.label,
      kind: d.kind,
      mentions: hits.length,
      previous: hasPrev ? prevHits : null,
      trend: trendOf(hits.length, hasPrev ? prevHits : null),
      points: community.reduce((s, h) => s + (h.p ?? 0), 0),
      comments: community.reduce((s, h) => s + (h.c ?? 0), 0),
      bySource: {
        news: hits.filter((h) => h.k === "news").length,
        hn: hits.filter((h) => h.k === "hn").length,
        reddit: hits.filter((h) => h.k === "reddit").length,
      },
      top: top ? { title: top.t, link: top.l, source: top.s } : undefined,
    };
  });
  return {
    rows: rows
      .filter((r) => r.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions || b.points - a.points)
      .slice(0, 12),
    history: Math.min(history, 48),
  };
}

export function buildActors(archive: Archive, now: number): ActorDesk {
  const windowMs = ACTOR_WINDOW_DAYS * D;
  const items = archive.items.filter((it) => now - Date.parse(it.d) <= windowMs);
  const rows: ActorRow[] = ACTORS.map((a) => {
    const re = ACTOR_REGEXES.find((r) => r.id === a.id)!.re;
    const hits = items.filter((it) => re.test(text(it))).sort((x, y) => y.d.localeCompare(x.d));
    const n = hits.length;
    const latest = hits.find((h) => h.k === "news") ?? hits[0];
    return {
      id: a.id,
      name: a.name,
      aliases: a.aliases,
      attribution: a.attribution,
      category: a.category,
      mentions: n,
      outlets: new Set(hits.map((h) => h.s)).size,
      activity: n >= 6 ? "high" : n >= 3 ? "moderate" : n >= 1 ? "low" : "dormant",
      lastSeen: hits[0]?.d,
      latestHeadline: latest ? { title: latest.t, link: latest.l, source: latest.s } : undefined,
    };
  });
  return {
    rows: rows.filter((r) => r.mentions > 0).sort((a, b) => b.mentions - a.mentions || (b.lastSeen ?? "").localeCompare(a.lastSeen ?? "")).slice(0, 14),
    tracked: ACTORS.length,
    windowDays: ACTOR_WINDOW_DAYS,
    historyDays: Math.min(ACTOR_WINDOW_DAYS, Math.round((historyHours(archive, now) / 24) * 10) / 10),
  };
}
