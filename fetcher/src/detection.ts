import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DETECTION_REPOS, GITHUB_RAW, SIGMA_FOLDERS, SIGMA_MAX_RULES, SIGMA_REPO, SIGMA_WINDOW_DAYS } from "./config.ts";
import { errMsg, mapLimit } from "./http.ts";
import { gh, ghRaw } from "./github.ts";
import { clean } from "./text.ts";
import type { RawItem } from "./rss.ts";
import type { DetectionRelease, SigmaRule, SourceStatus, TechniqueDetail, TechniqueMention } from "../../client/src/types/edition.ts";

const DAY = 86_400_000;

// ── ATT&CK dictionary (fetcher/data/attack.json, built by scripts/update-attack.ts) ──
interface AttackTechnique {
  name: string;
  tactics: string[];
  platforms: string[];
  url: string;
  description: string;
  detection: TechniqueDetail["detection"];
  mitigations: string[];
  groups: number;
}
const attackFile = join(dirname(fileURLToPath(import.meta.url)), "../data/attack.json");
export const ATTACK = JSON.parse(readFileSync(attackFile, "utf8")) as { version: string; techniques: Record<string, AttackTechnique> };

const TECH_RE = /\bT1\d{3}(?:\.\d{3})?\b/g;
export function techniquesIn(text: string): string[] {
  return [...new Set(text.match(TECH_RE) ?? [])].filter((id) => ATTACK.techniques[id]);
}

// ── New Sigma rules (files added recently) ─────────────────────────────
interface Commit {
  sha: string;
  commit: { author: { date: string }; tree: { sha: string } };
}
interface Tree {
  tree: { path: string; type: string }[];
  truncated: boolean;
}

/** Minimal reader for the handful of Sigma YAML fields we print. */
function parseSigma(yaml: string) {
  const field = (k: string) => yaml.match(new RegExp(`^${k}:\\s*['"]?(.+?)['"]?\\s*$`, "m"))?.[1];
  let description = field("description");
  if (description === "|" || description === ">" || description === "|-" || description === ">-") {
    const block = yaml.match(/^description:\s*[|>]-?\s*\n((?:[ \t]+.*\n?)+)/m)?.[1] ?? "";
    description = block.replace(/\s+/g, " ").trim();
  }
  const ls = yaml.match(/^logsource:\s*\n((?:[ \t]+.*\n?)+)/m)?.[1] ?? "";
  const lsField = (k: string) => ls.match(new RegExp(`^\\s+${k}:\\s*(\\S+)`, "m"))?.[1];
  const logsource = [lsField("product"), lsField("category") ?? lsField("service")].filter(Boolean).join(" / ");
  const techniques = [...yaml.matchAll(/-\s*attack\.(t\d{4}(?:\.\d{3})?)/gi)].map((m) => m[1].toUpperCase());
  return { title: field("title"), level: field("level"), status: field("status"), description, logsource, techniques: [...new Set(techniques)] };
}

/**
 * Rule files added to SigmaHQ in the last `days`: diff the repository's file list at the
 * start of the window against today's. 3 API calls (works without a token) and immune
 * to bulk edits — the compare API caps its file list at 300, which SigmaHQ's mass
 * rule updates routinely exceed.
 */
async function sigmaAdded(days: number, now: number): Promise<{ files: string[]; head: string }> {
  const until = new Date(now - days * DAY).toISOString();
  const [base] = await gh<Commit[]>(`/repos/${SIGMA_REPO}/commits?until=${until}&per_page=1`);
  if (!base) return { files: [], head: "master" };
  const isRule = (p: string) => p.endsWith(".yml") && SIGMA_FOLDERS.some((f) => p.startsWith(`${f}/`)) && !p.includes("/deprecated/");
  const [then, nowTree] = await Promise.all([
    gh<Tree>(`/repos/${SIGMA_REPO}/git/trees/${base.commit.tree.sha}?recursive=1`),
    gh<Tree>(`/repos/${SIGMA_REPO}/git/trees/master?recursive=1`),
  ]);
  if (then.truncated || nowTree.truncated) throw new Error("GitHub truncated the SigmaHQ file tree");
  const before = new Set(then.tree.filter((e) => e.type === "blob").map((e) => e.path));
  // Ignore files that merely moved folders (same file name existed before).
  const beforeNames = new Set([...before].map((p) => p.split("/").pop()));
  const files = nowTree.tree
    .filter((e) => e.type === "blob" && isRule(e.path) && !before.has(e.path) && !beforeNames.has(e.path.split("/").pop()))
    .map((e) => e.path);
  return { files, head: "master" };
}

export async function fetchSigma(now: number): Promise<{ rules: SigmaRule[]; windowDays: number; status: SourceStatus }> {
  const url = `https://github.com/${SIGMA_REPO}`;
  try {
    let windowDays = SIGMA_WINDOW_DAYS;
    let found = await sigmaAdded(windowDays, now);
    if (!found.files.length) {
      windowDays = 30; // quiet week — widen so the desk still has something to show
      found = await sigmaAdded(windowDays, now);
    }
    const rules = (
      await mapLimit(found.files.slice(0, SIGMA_MAX_RULES), 8, async (file): Promise<SigmaRule | null> => {
        try {
          const y = parseSigma(await ghRaw(`${GITHUB_RAW}/${SIGMA_REPO}/${found.head}/${file}`));
          if (!y.title) return null;
          return {
            title: clean(y.title),
            level: y.level,
            status: y.status,
            logsource: y.logsource || "—",
            techniques: y.techniques,
            description: y.description ? clean(y.description).slice(0, 260) : undefined,
            link: `https://github.com/${SIGMA_REPO}/blob/master/${file}`,
            folder: file.split("/")[0],
          };
        } catch {
          return null;
        }
      })
    ).filter((r): r is SigmaRule => !!r);
    const lvl = ["critical", "high", "medium", "low", "informational"];
    rules.sort((a, b) => lvl.indexOf(a.level ?? "low") - lvl.indexOf(b.level ?? "low"));
    return {
      rules,
      windowDays,
      status: { name: "SigmaHQ (new rules)", url, kind: "api", ok: true, items: rules.length, error: `${found.files.length} rule files added in ${windowDays} days` },
    };
  } catch (err) {
    return { rules: [], windowDays: SIGMA_WINDOW_DAYS, status: { name: "SigmaHQ (new rules)", url, kind: "api", ok: false, items: 0, error: errMsg(err).slice(0, 160) } };
  }
}

// ── Detection-content releases ─────────────────────────────────────────
interface Release {
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string;
  body: string | null;
  draft: boolean;
}

function releaseSummary(repo: string, body: string): string | undefined {
  if (!body) return undefined;
  if (repo === "SigmaHQ/sigma") {
    const n = (p: string) => (body.match(new RegExp(`^\\s*-\\s*${p}:`, "gim")) ?? []).length;
    const parts = [n("new") && `${n("new")} new`, n("update") && `${n("update")} updated`, n("fix") && `${n("fix")} fixed`].filter(Boolean);
    if (parts.length) return `${parts.join(" · ")} rules`;
  }
  const line = body
    .split("\n")
    .map((l) => l.replace(/[#*_`>[\]]|\(http[^)]*\)/g, "").replace(/^\s*[-•]\s*/, "").trim())
    .find((l) => l.length > 25 && !/^(what's changed|full changelog|release notes?|changelog)/i.test(l));
  return line ? line.slice(0, 200) : undefined;
}

export async function fetchReleases(now: number): Promise<{ releases: DetectionRelease[]; status: SourceStatus }> {
  let ok = 0;
  let lastErr = "";
  const releases: DetectionRelease[] = [];
  await mapLimit(DETECTION_REPOS, 4, async ({ repo, label }) => {
    try {
      const rs = (await gh<Release[]>(`/repos/${repo}/releases?per_page=3`)).filter((r) => !r.draft);
      ok++;
      const r = rs[0];
      if (r && now - Date.parse(r.published_at) <= 45 * DAY) {
        releases.push({ repo, label, name: r.name || r.tag_name, link: r.html_url, published: r.published_at, summary: releaseSummary(repo, r.body ?? "") });
      }
    } catch (err) {
      lastErr = errMsg(err);
    }
  });
  releases.sort((a, b) => b.published.localeCompare(a.published));
  return {
    releases,
    status: { name: "Detection content releases (GitHub)", url: "https://github.com", kind: "api", ok: ok > 0, items: releases.length, error: ok ? undefined : lastErr.slice(0, 160) },
  };
}

// ── ATT&CK techniques in this week's reporting ─────────────────────────
/** Rotation used when no report cites a technique ID: common, high-value SOC techniques. */
const ROTATION = [
  "T1059.001", "T1566.001", "T1078", "T1003.001", "T1021.001", "T1486", "T1190", "T1105", "T1047", "T1053.005",
  "T1218.011", "T1110.003", "T1556", "T1567.002", "T1071.001", "T1548.002", "T1136.001", "T1070.001", "T1562.001", "T1098",
];

export function buildTechniques(
  items: RawItem[],
  sigmaTechniques: string[][],
  now: number,
): { mentions: TechniqueMention[]; detail: TechniqueDetail | null } {
  const recent = items.filter((it) => now - Date.parse(it.published) <= 7 * DAY);
  const counts = new Map<string, { n: number; sources: Set<string> }>();
  const bump = (id: string, src: string) => {
    const e = counts.get(id) ?? { n: 0, sources: new Set<string>() };
    e.n++;
    e.sources.add(src);
    counts.set(id, e);
  };
  for (const it of recent) for (const id of techniquesIn(`${it.title} ${it.paragraphs.join(" ")}`)) bump(id, it.source);
  for (const ts of sigmaTechniques) for (const id of ts) if (ATTACK.techniques[id]) bump(id, "SigmaHQ");

  const mentions: TechniqueMention[] = [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n || b[1].sources.size - a[1].sources.size)
    .slice(0, 14)
    .map(([id, c]) => {
      const t = ATTACK.techniques[id];
      return { id, name: t.name, tactics: t.tactics, mentions: c.n, sources: c.sources.size, url: t.url };
    });

  const featured = mentions.find((m) => ATTACK.techniques[m.id].detection.length);
  const week = Math.floor((now - Date.UTC(2026, 0, 5)) / (7 * DAY));
  const id = featured?.id ?? ROTATION[((week % ROTATION.length) + ROTATION.length) % ROTATION.length];
  const t = ATTACK.techniques[id];
  const detail: TechniqueDetail | null = t
    ? {
        id,
        ...t,
        why: featured
          ? `Most-cited technique in this week's reporting and new detections: ${featured.mentions} mention${featured.mentions === 1 ? "" : "s"} across ${featured.sources} source${featured.sources === 1 ? "" : "s"}.`
          : "Rotating pick — no ATT&CK technique IDs were cited in this week's feeds.",
      }
    : null;
  return { mentions, detail };
}
