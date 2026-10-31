import { CVELIST_RAW, EPSS_API, KEV_DESK_ROWS, KEV_URLS } from "./config.ts";
import { errMsg, fetchJson, mapLimit } from "./http.ts";
import { epssFor } from "./vulns.ts";
import type { KevDesk, KevEntry, SourceStatus } from "../../client/src/types/edition.ts";

interface KevCatalog {
  catalogVersion: string;
  count: number;
  vulnerabilities: {
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    dueDate: string;
    knownRansomwareCampaignUse: string;
    cwes?: string[];
  }[];
}

type CvssBlock = { baseScore?: number; baseSeverity?: string; version?: string };
type Metric = Record<string, unknown> & { other?: { type?: string; content?: { options?: Record<string, string>[] } } };
interface CveRecord {
  containers: {
    cna: { metrics?: Metric[] };
    adp?: { metrics?: Metric[] }[];
  };
}

const CVSS_KEYS = ["cvssV4_0", "cvssV3_1", "cvssV3_0", "cvssV2_0"];

function cvelistPath(cve: string): string {
  const [, year, num] = cve.split("-");
  return `${CVELIST_RAW}/${year}/${Math.floor(Number(num) / 1000)}xxx/${cve}.json`;
}

function extractCvss(metrics: Metric[] | undefined): KevEntry["cvss"] {
  for (const key of CVSS_KEYS) {
    for (const m of metrics ?? []) {
      const block = m[key] as CvssBlock | undefined;
      if (block?.baseScore != null) {
        return { score: block.baseScore, severity: (block.baseSeverity ?? "").toUpperCase(), version: block.version ?? key.replace("cvssV", "").replace("_", ".") };
      }
    }
  }
  return undefined;
}

function extractSsvc(metrics: Metric[] | undefined): KevEntry["ssvc"] {
  for (const m of metrics ?? []) {
    if (m.other?.type === "ssvc") {
      const opts = Object.assign({}, ...(m.other.content?.options ?? [])) as Record<string, string>;
      return { exploitation: opts["Exploitation"], automatable: opts["Automatable"], technicalImpact: opts["Technical Impact"] };
    }
  }
  return undefined;
}

export async function buildKevDesk(now: number): Promise<{ desk: KevDesk | null; statuses: SourceStatus[] }> {
  const statuses: SourceStatus[] = [];
  let catalog: KevCatalog | null = null;
  for (const url of KEV_URLS) {
    try {
      catalog = await fetchJson<KevCatalog>(url);
      statuses.push({ name: "CISA KEV", url, kind: "api", ok: true, items: catalog.count });
      break;
    } catch (err) {
      statuses.push({ name: "CISA KEV", url, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
    }
  }
  // Report KEV as one source: the mirror succeeding means the source is OK.
  const kevOk = statuses.find((s) => s.ok);
  statuses.splice(0, statuses.length, kevOk ? { ...kevOk, error: statuses[0].ok ? undefined : "served from GitHub mirror" } : statuses[statuses.length - 1]);
  if (!catalog) return { desk: null, statuses };

  const vulns = catalog.vulnerabilities
    .map((v, i) => ({ v, i }))
    // newest first; within a day keep catalog order (later = added later)
    .sort((a, b) => b.v.dateAdded.localeCompare(a.v.dateAdded) || b.i - a.i)
    .map(({ v }) => v);

  const dayMs = 86_400_000;
  const since = (days: number) => vulns.filter((v) => now - Date.parse(`${v.dateAdded}T00:00:00Z`) <= days * dayMs);
  const last30 = since(30);

  const top = vulns.slice(0, KEV_DESK_ROWS);
  let cveOk = 0;
  const entries: KevEntry[] = await mapLimit(top, 6, async (v) => {
    const entry: KevEntry = {
      cve: v.cveID,
      vendor: v.vendorProject,
      product: v.product,
      name: v.vulnerabilityName,
      description: v.shortDescription,
      dateAdded: v.dateAdded,
      dueDate: v.dueDate,
      ransomware: v.knownRansomwareCampaignUse === "Known",
      cwes: v.cwes ?? [],
    };
    try {
      const rec = await fetchJson<CveRecord>(cvelistPath(v.cveID), { timeoutMs: 10_000 });
      const adp = (rec.containers.adp ?? []).flatMap((a) => a.metrics ?? []);
      entry.cvss = extractCvss(rec.containers.cna.metrics) ?? extractCvss(adp);
      entry.ssvc = extractSsvc(adp);
      cveOk++;
    } catch {
      /* record not yet published in cvelistV5 — leave CVSS empty */
    }
    return entry;
  });
  statuses.push({ name: "CVE Program (cvelistV5)", url: CVELIST_RAW, kind: "api", ok: cveOk > 0, items: cveOk, error: cveOk ? undefined : "no CVE records resolved" });

  try {
    const map = await epssFor(entries.map((e) => e.cve));
    for (const e of entries) {
      const d = map.get(e.cve);
      if (d) e.epss = d;
    }
    statuses.push({ name: "FIRST EPSS", url: EPSS_API, kind: "api", ok: true, items: map.size });
  } catch (err) {
    statuses.push({ name: "FIRST EPSS", url: EPSS_API, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
  }

  return {
    desk: {
      entries,
      catalogCount: catalog.count,
      catalogVersion: catalog.catalogVersion,
      addedLast7d: since(7).length,
      addedLast30d: last30.length,
      ransomwareLinkedLast30d: last30.filter((v) => v.knownRansomwareCampaignUse === "Known").length,
    },
    statuses,
  };
}
