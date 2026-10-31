import { KEYS, RANSOMWARE_LIVE_FREE, RANSOMWARE_LIVE_PRO, RANSOMWARE_WINDOW_DAYS } from "./config.ts";
import { errMsg, fetchJson } from "./http.ts";
import { clean, topCounts } from "./text.ts";
import type { RansomwareDesk, SourceStatus, Victim } from "../../client/src/types/edition.ts";

/**
 * ransomware.live — leak-site victim posts. With RANSOMWARE_LIVE_KEY the free PRO API
 * is used; otherwise the keyless v2 API (1 request/minute, personal use only).
 * Field names differ between API versions, so records are read defensively.
 */
type Rec = Record<string, unknown>;
const str = (r: Rec, ...keys: string[]) => {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
};

function toVictim(r: Rec): Victim | null {
  const name = str(r, "victim", "post_title", "name", "company");
  const group = str(r, "group", "group_name", "gang");
  const rawDate = str(r, "attackdate", "discovered", "published", "date");
  if (!name || !group || !rawDate) return null;
  const t = Date.parse(rawDate.includes("T") ? rawDate : `${rawDate.replace(" ", "T").slice(0, 19)}Z`);
  if (Number.isNaN(t)) return null;
  const sector = str(r, "activity", "sector", "industry");
  return {
    name: clean(name),
    group: group.toLowerCase(),
    date: new Date(t).toISOString(),
    country: str(r, "country")?.toUpperCase(),
    sector: sector && !/^not found$/i.test(sector) ? sector : undefined,
    link: str(r, "url", "permalink", "claim_url"),
  };
}

export async function fetchRansomware(now: number): Promise<{ desk: RansomwareDesk | null; status: SourceStatus }> {
  const attempts: { mode: RansomwareDesk["mode"]; url: string; headers: Record<string, string> }[] = [];
  if (KEYS.ransomwareLive) attempts.push({ mode: "pro", url: RANSOMWARE_LIVE_PRO, headers: { "X-API-KEY": KEYS.ransomwareLive } });
  attempts.push({ mode: "free", url: RANSOMWARE_LIVE_FREE, headers: {} });
  const errors: string[] = [];
  for (const a of attempts) {
    try {
      const res = await fetchJson<Rec[] | { victims?: Rec[]; data?: Rec[] }>(a.url, { headers: a.headers, timeoutMs: 30_000 });
      const list = Array.isArray(res) ? res : (res.victims ?? res.data ?? []);
      const victims = list
        .map(toVictim)
        .filter((v): v is Victim => !!v && now - Date.parse(v.date) <= RANSOMWARE_WINDOW_DAYS * 86_400_000 && Date.parse(v.date) <= now + 86_400_000)
        .sort((x, y) => y.date.localeCompare(x.date));
      return {
        desk: {
          victims: victims.slice(0, 40),
          windowDays: RANSOMWARE_WINDOW_DAYS,
          total: victims.length,
          byGroup: topCounts(victims, (v) => v.group, 10),
          bySector: topCounts(victims, (v) => v.sector, 8),
          byCountry: topCounts(victims, (v) => v.country, 8),
          mode: a.mode,
        },
        status: { name: `ransomware.live (${a.mode})`, url: a.url, kind: "api", ok: true, items: list.length, error: errors.length ? errors.join(" | ").slice(0, 200) : undefined },
      };
    } catch (err) {
      errors.push(`${a.mode}: ${errMsg(err)}`);
    }
  }
  return { desk: null, status: { name: "ransomware.live", url: RANSOMWARE_LIVE_FREE, kind: "api", ok: false, items: 0, error: errors.join(" | ").slice(0, 200) } };
}
