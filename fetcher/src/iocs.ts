import { FEODO_BLOCKLIST, KEYS, THREATFOX_API, URLHAUS_RECENT } from "./config.ts";
import { errMsg, fetchJson } from "./http.ts";
import { defang, topCounts } from "./text.ts";
import type { Ioc, IocWire, SourceStatus } from "../../client/src/types/edition.ts";

/**
 * abuse.ch IOC wire. Since Oct 2026 ThreatFox and URLhaus require a free Auth-Key
 * (https://auth.abuse.ch/). Every indicator is defanged before it reaches the page.
 */

interface TfIoc {
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware_printable: string;
  confidence_level: number;
  first_seen: string;
  reference: string | null;
}
interface UhUrl {
  url: string;
  url_status: string;
  threat: string;
  tags: string[] | null;
  date_added: string;
}
interface FeodoEntry {
  ip_address: string;
  port: number;
  status: string;
  malware: string;
  first_seen: string;
  last_online?: string;
}

const iso = (s: string) => {
  const t = Date.parse(s.includes("T") ? s : `${s.replace(" UTC", "").replace(" ", "T")}Z`);
  return Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
};

export async function fetchIocs(): Promise<{ wire: IocWire; statuses: SourceStatus[] }> {
  const statuses: SourceStatus[] = [];
  const wire: IocWire = { threatfox: null, urlhaus: null, feodo: null, missingKey: !KEYS.abusech };
  const auth: Record<string, string> = KEYS.abusech ? { "Auth-Key": KEYS.abusech } : {};

  if (!KEYS.abusech) {
    statuses.push({ name: "abuse.ch ThreatFox", url: THREATFOX_API, kind: "api", ok: false, items: 0, error: "ABUSECH_AUTH_KEY not set" });
    statuses.push({ name: "abuse.ch URLhaus", url: URLHAUS_RECENT, kind: "api", ok: false, items: 0, error: "ABUSECH_AUTH_KEY not set" });
  } else {
    try {
      const res = await fetchJson<{ query_status: string; data: TfIoc[] | string }>(THREATFOX_API, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "get_iocs", days: 1 }),
      });
      if (res.query_status !== "ok" || !Array.isArray(res.data)) throw new Error(`query_status ${res.query_status}`);
      const data = res.data;
      const fam = new Map<string, { count: number; types: Set<string> }>();
      for (const i of data) {
        const f = fam.get(i.malware_printable) ?? { count: 0, types: new Set<string>() };
        f.count++;
        f.types.add(i.ioc_type);
        fam.set(i.malware_printable, f);
      }
      const toIoc = (i: TfIoc): Ioc => ({
        value: defang(i.ioc, i.ioc_type),
        type: i.ioc_type,
        threat: i.threat_type,
        malware: i.malware_printable,
        confidence: i.confidence_level,
        firstSeen: iso(i.first_seen),
        reference: i.reference ?? undefined,
      });
      // one high-confidence sample per family, biggest families first
      const families = [...fam.entries()].sort((a, b) => b[1].count - a[1].count);
      const samples = families
        .map(([name]) => data.filter((i) => i.malware_printable === name).sort((a, b) => b.confidence_level - a.confidence_level)[0])
        .filter(Boolean)
        .slice(0, 14)
        .map(toIoc);
      wire.threatfox = {
        total: data.length,
        families: families.slice(0, 12).map(([name, f]) => ({ name, count: f.count, types: [...f.types] })),
        samples,
      };
      statuses.push({ name: "abuse.ch ThreatFox", url: THREATFOX_API, kind: "api", ok: true, items: data.length });
    } catch (err) {
      statuses.push({ name: "abuse.ch ThreatFox", url: THREATFOX_API, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
    }

    try {
      const res = await fetchJson<{ query_status: string; urls: UhUrl[] }>(URLHAUS_RECENT, { headers: auth });
      if (res.query_status !== "ok") throw new Error(`query_status ${res.query_status}`);
      const urls = res.urls;
      wire.urlhaus = {
        total: urls.length,
        online: urls.filter((u) => u.url_status === "online").length,
        threats: topCounts(urls, (u) => u.threat, 5),
        tags: topCounts(urls.flatMap((u) => (u.tags ?? []).map((t) => ({ t }))), (x) => x.t, 10),
        samples: urls
          .filter((u) => u.url_status === "online")
          .slice(0, 8)
          .map((u) => ({ value: defang(u.url, "url"), type: "url", threat: u.threat, malware: (u.tags ?? [])[0] ?? "—", firstSeen: iso(u.date_added) })),
      };
      statuses.push({ name: "abuse.ch URLhaus", url: URLHAUS_RECENT, kind: "api", ok: true, items: urls.length });
    } catch (err) {
      statuses.push({ name: "abuse.ch URLhaus", url: URLHAUS_RECENT, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
    }
  }

  // Feodo Tracker (botnet C2 blocklist) — try anonymously, then with the key.
  try {
    let list: FeodoEntry[];
    try {
      list = await fetchJson<FeodoEntry[]>(FEODO_BLOCKLIST);
    } catch (err) {
      if (!KEYS.abusech) throw err;
      list = await fetchJson<FeodoEntry[]>(FEODO_BLOCKLIST, { headers: auth });
    }
    const online = list.filter((e) => e.status === "online");
    wire.feodo = {
      online: online.length,
      byMalware: topCounts(list, (e) => e.malware, 6),
      samples: [...list]
        .sort((a, b) => (b.last_online ?? b.first_seen).localeCompare(a.last_online ?? a.first_seen))
        .slice(0, 8)
        .map((e) => ({ value: defang(`${e.ip_address}:${e.port}`, "ip:port"), type: "ip:port", threat: "botnet_cc", malware: e.malware, firstSeen: iso(e.first_seen) })),
    };
    statuses.push({ name: "abuse.ch Feodo Tracker", url: FEODO_BLOCKLIST, kind: "api", ok: true, items: list.length });
  } catch (err) {
    statuses.push({ name: "abuse.ch Feodo Tracker", url: FEODO_BLOCKLIST, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
  }

  return { wire, statuses };
}
