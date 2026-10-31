import { existsSync, readFileSync } from "node:fs";
import { ARCHIVE_DAYS } from "./config.ts";
import { errMsg, fetchJson } from "./http.ts";
import type { RawItem } from "./rss.ts";
import type { CommunityPost } from "../../client/src/types/edition.ts";

/**
 * Rolling 30-day log of everything seen, so trends and actor activity can be
 * computed beyond what feeds currently expose. In CI it's seeded from the
 * previously published site (ARCHIVE_URL), so nothing is committed to git.
 */
export interface ArchiveItem {
  k: "news" | "hn" | "reddit";
  id: string;
  t: string; // title
  x: string; // first ~240 chars of summary/self-text
  s: string; // source / community
  l: string; // link
  d: string; // published ISO
  p?: number | null; // points
  c?: number | null; // comments
}

export interface Archive {
  version: 1;
  firstRunAt: string;
  items: ArchiveItem[];
}

export async function loadArchive(localPath: string): Promise<{ archive: Archive | null; note: string }> {
  const remote = process.env.ARCHIVE_URL;
  if (remote) {
    try {
      return { archive: await fetchJson<Archive>(remote, { timeoutMs: 20_000 }), note: `seeded from ${remote}` };
    } catch (err) {
      console.warn(`[archive] could not load ${remote}: ${errMsg(err)}`);
    }
  }
  if (existsSync(localPath)) {
    try {
      return { archive: JSON.parse(readFileSync(localPath, "utf8")) as Archive, note: `seeded from ${localPath}` };
    } catch (err) {
      console.warn(`[archive] unreadable ${localPath}: ${errMsg(err)}`);
    }
  }
  return { archive: null, note: "no previous archive — starting fresh" };
}

export function newsToArchive(it: RawItem): ArchiveItem {
  return { k: "news", id: it.id, t: it.title, x: it.paragraphs.join(" ").slice(0, 240), s: it.source, l: it.link, d: it.published };
}

export function postToArchive(p: CommunityPost): ArchiveItem {
  return { k: p.platform, id: p.id, t: p.title, x: (p.text ?? "").slice(0, 240), s: p.community, l: p.discussion, d: p.created, p: p.points, c: p.comments };
}

export function mergeArchive(prev: Archive | null, fresh: ArchiveItem[], now: number): Archive {
  const cutoff = now - ARCHIVE_DAYS * 86_400_000;
  const map = new Map<string, ArchiveItem>();
  for (const it of prev?.items ?? []) if (Date.parse(it.d) >= cutoff) map.set(it.id, it);
  for (const it of fresh) {
    if (Date.parse(it.d) < cutoff) continue;
    const old = map.get(it.id);
    // keep latest engagement numbers; never overwrite real numbers with nulls
    map.set(it.id, old ? { ...old, ...it, p: it.p ?? old.p, c: it.c ?? old.c } : it);
  }
  return {
    version: 1,
    firstRunAt: prev?.firstRunAt ?? new Date(now).toISOString(),
    items: [...map.values()].sort((a, b) => b.d.localeCompare(a.d)),
  };
}
