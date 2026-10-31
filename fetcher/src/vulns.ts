import Parser from "rss-parser";
import { ADVISORY_FEEDS, EPSS_API, KEYS, MSRC_API, NVD_API, NVD_WINDOW_HOURS } from "./config.ts";
import { errMsg, fetchJson, fetchText, mapLimit } from "./http.ts";
import { gh } from "./github.ts";
import { clean, findCves, hashId, htmlToParagraphs } from "./text.ts";
import type { Advisory, Cvss, Epss, Ghsa, NvdCve, PatchTuesday, SourceStatus } from "../../client/src/types/edition.ts";

const DAY = 86_400_000;

// ── EPSS ────────────────────────────────────────────────────────────────
/**
 * FIRST EPSS scores. The API answers a whole batch with HTTP 400 if it dislikes any one
 * ID (seen with very new CVEs), so a failing batch is split in half until the bad IDs
 * are isolated — a handful of extra calls instead of losing every score.
 */
export async function epssFor(cves: string[]): Promise<Map<string, Epss>> {
  const out = new Map<string, Epss>();
  let calls = 0;
  let lastErr: unknown = null;
  const run = async (batch: string[]): Promise<void> => {
    if (!batch.length || calls > 40) return;
    calls++;
    try {
      const res = await fetchJson<{ data: { cve: string; epss: string; percentile: string }[] }>(`${EPSS_API}?cve=${batch.join(",")}`);
      for (const d of res.data) out.set(d.cve, { score: Number(d.epss), percentile: Number(d.percentile) });
    } catch (err) {
      lastErr = err;
      if (batch.length === 1) return; // this ID is the problem — skip it
      const mid = Math.ceil(batch.length / 2);
      await run(batch.slice(0, mid));
      await run(batch.slice(mid));
    }
  };
  for (let i = 0; i < cves.length; i += 90) await run(cves.slice(i, i + 90));
  if (!out.size && lastErr) throw lastErr;
  return out;
}

// ── NVD: newly published critical CVEs ─────────────────────────────────
type NvdMetric = { type?: string; cvssData: { baseScore: number; baseSeverity?: string; version: string } };
interface NvdItem {
  cve: {
    id: string;
    published: string;
    descriptions: { lang: string; value: string }[];
    metrics?: Record<string, NvdMetric[] | undefined>;
    weaknesses?: { description: { value: string }[] }[];
    configurations?: { nodes: { cpeMatch?: { criteria: string }[] }[] }[];
    cisaExploitAdd?: string;
  };
}

function bestCvss(metrics: NvdItem["cve"]["metrics"]): Cvss | undefined {
  for (const key of ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30"]) {
    const list = metrics?.[key];
    if (!list?.length) continue;
    // prefer NVD's own (Primary) score, else the CNA's (Secondary)
    const m = list.find((x) => x.type === "Primary") ?? list[0];
    const sev = m.cvssData.baseSeverity ?? (m.cvssData.baseScore >= 9 ? "CRITICAL" : m.cvssData.baseScore >= 7 ? "HIGH" : "MEDIUM");
    return { score: m.cvssData.baseScore, severity: sev.toUpperCase(), version: m.cvssData.version };
  }
  return undefined;
}

/**
 * CVEs published in the last NVD_WINDOW_HOURS with CVSS ≥ 9.0 (any version, NVD or CNA
 * score — NVD's own enrichment often lags) or already in CISA KEV.
 */
export async function fetchNvd(now: number, kevIds: Set<string>): Promise<{ cves: NvdCve[]; status: SourceStatus }> {
  const fmt = (t: number) => new Date(t).toISOString().replace("Z", "");
  const base = `${NVD_API}?pubStartDate=${fmt(now - NVD_WINDOW_HOURS * 3_600_000)}&pubEndDate=${fmt(now)}&resultsPerPage=2000`;
  try {
    const items: NvdItem[] = [];
    let start = 0;
    for (let page = 0; page < 3; page++) {
      const res = await fetchJson<{ vulnerabilities: NvdItem[]; totalResults: number }>(`${base}&startIndex=${start}`, {
        timeoutMs: 45_000,
        headers: KEYS.nvd ? { apiKey: KEYS.nvd } : {},
      });
      items.push(...res.vulnerabilities);
      start += res.vulnerabilities.length;
      if (start >= res.totalResults || !res.vulnerabilities.length) break;
      await new Promise((r) => setTimeout(r, KEYS.nvd ? 700 : 6500)); // NVD: 5 req/30s without a key
    }
    const picked = items
      .map(({ cve }) => {
        const cvss = bestCvss(cve.metrics);
        const cpes = (cve.configurations ?? []).flatMap((c) => c.nodes.flatMap((n) => (n.cpeMatch ?? []).map((m) => m.criteria)));
        const vendorProducts = [...new Set(cpes.map((c) => c.split(":").slice(3, 5).join(" ").replace(/_/g, " ")))].slice(0, 3);
        return {
          cve: cve.id,
          published: new Date(`${cve.published}Z`.replace(/ZZ$/, "Z")).toISOString(),
          description: clean(cve.descriptions.find((d) => d.lang === "en")?.value ?? ""),
          cvss,
          cwes: [...new Set((cve.weaknesses ?? []).flatMap((w) => w.description.map((d) => d.value)).filter((v) => v.startsWith("CWE-")))],
          vendorProducts,
          kev: kevIds.has(cve.id) || !!cve.cisaExploitAdd,
        } satisfies NvdCve;
      })
      .filter((c) => c.kev || (c.cvss?.score ?? 0) >= 9);
    try {
      const epss = await epssFor(picked.map((c) => c.cve));
      for (const c of picked) {
        const e = epss.get(c.cve);
        if (e) (c as NvdCve).epss = e;
      }
    } catch {
      /* EPSS optional */
    }
    picked.sort((a, b) => Number(b.kev) - Number(a.kev) || (b.cvss?.score ?? 0) - (a.cvss?.score ?? 0) || b.published.localeCompare(a.published));
    return { cves: picked.slice(0, 30), status: { name: "NVD", url: NVD_API, kind: "api", ok: true, items: items.length } };
  } catch (err) {
    return { cves: [], status: { name: "NVD", url: NVD_API, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) } };
  }
}

// ── Microsoft Patch Tuesday (MSRC CVRF API, no key) ────────────────────
interface CvrfVuln {
  CVE: string;
  Title?: { Value: string };
  Threats?: { Type: number; Description?: { Value: string } }[];
  CVSSScoreSets?: { BaseScore: number }[];
  /** Type 7 = tag (product), Type 8 = issuing CNA ("Microsoft", "Chrome", "MITRE"…). */
  Notes?: { Title?: string; Type?: number; Value?: string }[];
  RevisionHistory?: { Date?: string; Number?: string }[];
}

/**
 * The monthly CVRF document also carries Azure Linux, Chromium and other third-party
 * CVEs (thousands of them), so Patch Tuesday = CVEs issued by Microsoft's CNA and first
 * published within a day and a half of the release. Each filter is skipped if it would
 * leave nothing (older documents lack these fields).
 */
function patchTuesdaySet(vulns: CvrfVuln[], releasedIso: string): CvrfVuln[] {
  const cna = (v: CvrfVuln) => v.Notes?.find((n) => n.Type === 8)?.Value?.trim();
  const msOnly = vulns.filter((v) => cna(v) === "Microsoft");
  const pool = msOnly.length ? msOnly : vulns;
  const released = Date.parse(releasedIso);
  const firstRev = (v: CvrfVuln) => {
    const dates = (v.RevisionHistory ?? []).map((r) => Date.parse(r.Date ?? "")).filter((t) => !Number.isNaN(t));
    return dates.length ? Math.min(...dates) : NaN;
  };
  const onDay = pool.filter((v) => Math.abs(firstRev(v) - released) <= 36 * 3_600_000);
  return onDay.length ? onDay : pool;
}

export async function fetchPatchTuesday(now: number): Promise<{ pt: PatchTuesday | null; status: SourceStatus }> {
  const headers = { Accept: "application/json" };
  try {
    const list = await fetchJson<{ value: { ID: string; DocumentTitle: string; InitialReleaseDate: string; CvrfUrl: string }[] }>(`${MSRC_API}/updates`, {
      headers,
    });
    const latest = list.value
      .filter((u) => Date.parse(u.InitialReleaseDate) <= now && /^\d{4}-[A-Za-z]{3}$/.test(u.ID))
      .sort((a, b) => b.InitialReleaseDate.localeCompare(a.InitialReleaseDate))[0];
    if (!latest) throw new Error("no released update document");
    const doc = await fetchJson<{ Vulnerability: CvrfVuln[] }>(latest.CvrfUrl, { headers, timeoutMs: 60_000 });
    const all = doc.Vulnerability ?? [];
    const vulns = patchTuesdaySet(all, latest.InitialReleaseDate);
    const threat = (v: CvrfVuln, type: number) => (v.Threats ?? []).filter((t) => t.Type === type).map((t) => t.Description?.Value ?? "");
    const isCritical = (v: CvrfVuln) => threat(v, 3).some((s) => /critical/i.test(s));
    const exploitStr = (v: CvrfVuln) => threat(v, 1).join(";");
    const pick = (v: CvrfVuln) => ({ cve: v.CVE, title: v.Title?.Value ?? v.CVE });
    const impacts = new Map<string, number>();
    for (const v of vulns) {
      const imp = threat(v, 0)[0];
      if (imp) impacts.set(imp, (impacts.get(imp) ?? 0) + 1);
    }
    const pt: PatchTuesday = {
      id: latest.ID,
      title: latest.DocumentTitle,
      released: latest.InitialReleaseDate,
      total: vulns.length,
      critical: vulns.filter(isCritical).length,
      exploited: vulns.filter((v) => /Exploited:Yes/i.test(exploitStr(v))).map(pick),
      publiclyDisclosed: vulns.filter((v) => /Publicly Disclosed:Yes/i.test(exploitStr(v))).map(pick),
      moreLikely: vulns.filter((v) => /Exploitation More Likely/i.test(exploitStr(v))).length,
      byImpact: [...impacts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([impact, count]) => ({ impact, count })),
      topCritical: vulns
        .filter(isCritical)
        .map((v) => ({ ...pick(v), cvss: Math.max(0, ...(v.CVSSScoreSets ?? []).map((s) => s.BaseScore)) || undefined }))
        .sort((a, b) => (b.cvss ?? 0) - (a.cvss ?? 0))
        .slice(0, 6),
      url: `https://msrc.microsoft.com/update-guide/releaseNote/${latest.ID}`,
    };
    return { pt, status: { name: "Microsoft MSRC (CVRF)", url: MSRC_API, kind: "api", ok: true, items: vulns.length, error: `${vulns.length} Patch Tuesday CVEs of ${all.length} in the document` } };
  } catch (err) {
    return { pt: null, status: { name: "Microsoft MSRC (CVRF)", url: MSRC_API, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) } };
  }
}

// ── GitHub Security Advisories: critical, reviewed, last 7 days ─────────
interface GhsaItem {
  ghsa_id: string;
  cve_id: string | null;
  summary: string;
  published_at: string;
  html_url: string;
  cvss?: { score: number | null };
  cvss_severities?: { cvss_v3?: { score: number | null }; cvss_v4?: { score: number | null } };
  vulnerabilities?: { package?: { ecosystem: string; name: string } }[];
}

export async function fetchGhsa(now: number): Promise<{ items: Ghsa[]; status: SourceStatus }> {
  try {
    const res = await gh<GhsaItem[]>("/advisories?type=reviewed&severity=critical&per_page=40&sort=published&direction=desc");
    const items = res
      .filter((a) => now - Date.parse(a.published_at) <= 7 * DAY)
      .map((a) => ({
        id: a.ghsa_id,
        cve: a.cve_id ?? undefined,
        summary: clean(a.summary),
        ecosystems: [...new Set((a.vulnerabilities ?? []).map((v) => v.package?.ecosystem).filter((e): e is string => !!e))],
        packages: [...new Set((a.vulnerabilities ?? []).map((v) => v.package?.name).filter((e): e is string => !!e))].slice(0, 3),
        cvss: a.cvss_severities?.cvss_v4?.score ?? a.cvss_severities?.cvss_v3?.score ?? a.cvss?.score ?? undefined,
        published: a.published_at,
        link: a.html_url,
      }))
      .slice(0, 16);
    return { items, status: { name: "GitHub Advisory Database", url: "https://github.com/advisories", kind: "api", ok: true, items: res.length } };
  } catch (err) {
    return { items: [], status: { name: "GitHub Advisory Database", url: "https://github.com/advisories", kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) } };
  }
}

// ── Vendor PSIRT advisories (RSS) ──────────────────────────────────────
const parser = new Parser();
const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

function severityOf(text: string): Advisory["severity"] {
  const named = text.match(/\b(critical|high|medium|moderate|low|informational)\b/gi)?.map((s) => s.toLowerCase());
  const cvss = Math.max(0, ...[...text.matchAll(/CVSS[^0-9]{0,40}?(\d{1,2}\.\d)/gi)].map((m) => Number(m[1])).filter((n) => n <= 10));
  const fromCvss = cvss >= 9 ? "critical" : cvss >= 7 ? "high" : cvss >= 4 ? "medium" : cvss > 0 ? "low" : undefined;
  const ranked = [...(named ?? []).map((n) => (n === "moderate" ? "medium" : n === "informational" ? "info" : n)), fromCvss].filter(Boolean) as string[];
  return SEVERITIES.find((s) => ranked.includes(s));
}

export async function fetchAdvisories(now: number): Promise<{ items: Advisory[]; statuses: SourceStatus[] }> {
  const statuses: SourceStatus[] = [];
  const all: Advisory[] = [];
  await mapLimit(ADVISORY_FEEDS, 5, async (f) => {
    try {
      const feed = await parser.parseString(await fetchText(f.url));
      let n = 0;
      for (const it of feed.items) {
        const published = it.isoDate ?? (it.pubDate ? new Date(it.pubDate).toISOString() : "");
        if (!it.link || !published || now - Date.parse(published) > 10 * DAY) continue;
        const content = `${it.title ?? ""} ${htmlToParagraphs(it.content ?? it.contentSnippet ?? "").join(" ")}`;
        // Chrome's release blog also carries non-security posts
        if (f.vendor === "Google Chrome" && !/Security Fix|CVE-/i.test(content)) continue;
        all.push({
          id: hashId(it.link),
          vendor: f.vendor,
          title: clean(it.title ?? "").replace(/\s*\(Severity:\s*\w+\)\s*$/i, ""),
          link: it.link,
          published,
          severity: severityOf(content),
          cves: findCves(content).slice(0, 8),
          summary: htmlToParagraphs(it.contentSnippet ?? it.content ?? "")[0]?.slice(0, 280),
        });
        n++;
      }
      statuses.push({ name: `${f.vendor} advisories`, url: f.url, kind: "advisory", ok: true, items: n });
    } catch (err) {
      statuses.push({ name: `${f.vendor} advisories`, url: f.url, kind: "advisory", ok: false, items: 0, error: errMsg(err).slice(0, 160) });
    }
  });
  const rank = (a: Advisory) => SEVERITIES.indexOf(a.severity ?? "info");
  all.sort((a, b) => rank(a) - rank(b) || b.published.localeCompare(a.published));
  return { items: all.slice(0, 30), statuses };
}
