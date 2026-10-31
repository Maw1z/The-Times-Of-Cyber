import "./env.ts"; // must stay first: loads fetcher/.env before config.ts reads keys
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FEEDS, ISC_DIARY_FEED, KEYS } from "./config.ts";
import { mapLimit, useFixtures } from "./http.ts";
import { fetchFeed, type RawItem } from "./rss.ts";
import { buildKevDesk } from "./kev.ts";
import { fetchHackerNews, fetchReddit } from "./community.ts";
import { assembleNews } from "./assemble.ts";
import { loadArchive, mergeArchive, newsToArchive, postToArchive } from "./archive.ts";
import { buildActors, buildTopics } from "./signals.ts";
import { fetchAdvisories, fetchGhsa, fetchNvd, fetchPatchTuesday } from "./vulns.ts";
import { ATTACK, buildTechniques, fetchReleases, fetchSigma } from "./detection.ts";
import { fetchIocs } from "./iocs.ts";
import { fetchRansomware } from "./ransomware.ts";
import { fetchIsc } from "./isc.ts";
import { budgetParagraphs } from "./text.ts";
import type { Edition, SourceStatus, Story } from "../../client/src/types/edition.ts";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const outDir = resolve(flag("--out") ?? join(here, "../../client/public/data"));
const fixtures = flag("--fixtures");
if (fixtures) {
  useFixtures(resolve(fixtures));
  console.log(`[fixtures] serving HTTP from ${fixtures}`);
}
// Fixtures are pinned to a fixed clock so test output is reproducible.
const now = fixtures ? Date.parse("2026-10-31T06:00:00Z") : Date.now();
const DAY = 86_400_000;

function diaryStory(it: RawItem): Story {
  return {
    id: it.id,
    title: it.title,
    link: it.link,
    source: it.source,
    domain: it.domain,
    author: it.author,
    published: it.published,
    body: budgetParagraphs(it.paragraphs, 60),
    section: "general",
    tags: [],
  };
}

async function main() {
  const t0 = Date.now();
  console.log(
    `[keys] abuse.ch ${KEYS.abusech ? "✓" : "–"} · ransomware.live PRO ${KEYS.ransomwareLive ? "✓" : "–"} · NVD ${KEYS.nvd ? "✓" : "–"} · GitHub ${KEYS.github ? "✓" : "–"}`,
  );
  const archivePath = join(outDir, "archive.json");

  // Wave 1: everything independent.
  const [feedResults, diaries, kev, hn, reddit, prior, advisories, pt, ghsa, sigma, releases, iocs, ransomware, isc] = await Promise.all([
    mapLimit(FEEDS, 8, fetchFeed),
    fetchFeed(ISC_DIARY_FEED),
    buildKevDesk(now),
    fetchHackerNews(now),
    fetchReddit(),
    loadArchive(archivePath),
    fetchAdvisories(now),
    fetchPatchTuesday(now),
    fetchGhsa(now),
    fetchSigma(now),
    fetchReleases(now),
    fetchIocs(),
    fetchRansomware(now),
    fetchIsc(),
  ]);
  // Wave 2: NVD needs the KEV list (to flag KEV CVEs) and is rate limited, so it runs alone.
  const nvd = await fetchNvd(now, new Set(kev.desk?.entries.map((e) => e.cve) ?? []));
  console.log(`[archive] ${prior.note}`);

  const raw: RawItem[] = feedResults.flatMap((r) => r.items);
  const sources: SourceStatus[] = [
    ...feedResults.map((r) => r.status),
    diaries.status,
    ...advisories.statuses,
    ...kev.statuses,
    nvd.status,
    pt.status,
    ghsa.status,
    sigma.status,
    releases.status,
    ...iocs.statuses,
    ransomware.status,
    isc.status,
    hn.status,
    reddit.status,
  ];
  for (const s of sources) console.log(`${s.ok ? "  ok " : " FAIL"} ${s.name.padEnd(36)} ${String(s.items).padStart(5)}${s.error ? `  ${s.error}` : ""}`);

  const news = await assembleNews(raw, now);
  const archive = mergeArchive(prior.archive, [...raw.map(newsToArchive), ...hn.posts.map(postToArchive), ...reddit.posts.map(postToArchive)], now);
  const topics = buildTopics(archive, now);
  const techniques = buildTechniques(raw, sigma.rules.map((r) => r.techniques), now);
  const s = news.sections;

  const edition: Edition = {
    version: 2,
    generatedAt: new Date(now).toISOString(),
    front: news.front,
    actNow: {
      kev: (kev.desk?.entries ?? []).filter((e) => now - Date.parse(`${e.dateAdded}T00:00:00Z`) <= 3 * DAY),
      exploited: s.zeroday.slice(0, 4),
      criticalAdvisories: advisories.items.filter((a) => a.severity === "critical" && now - Date.parse(a.published) <= 3 * DAY).slice(0, 5),
    },
    vulns: {
      kev: kev.desk,
      nvd: nvd.cves,
      nvdWindowHours: 48,
      advisories: advisories.items,
      patchTuesday: pt.pt,
      ghsa: ghsa.items,
      stories: [...s.zeroday, ...s.vulns],
    },
    detection: {
      sigma: sigma.rules,
      sigmaWindowDays: sigma.windowDays,
      releases: releases.releases,
      techniques: techniques.mentions,
      techniqueOfWeek: techniques.detail,
      attackVersion: ATTACK.version,
    },
    iocs: iocs.wire,
    ransomware: { desk: ransomware.desk, stories: s.ransomware },
    threats: { actors: buildActors(archive, now), stories: s.actors },
    briefs: { breaches: s.breaches, policy: s.policy, zeroday: s.zeroday, general: s.general },
    community: {
      hn: hn.posts.slice(0, 15),
      reddit: reddit.posts.slice(0, 12),
      topics: topics.rows,
      topicHistoryHours: Math.round(topics.history),
      isc: isc.isc,
      diaries: diaries.items.slice(0, 4).map(diaryStory),
    },
    sources,
    stats: {
      stories: news.placed.length,
      outlets: new Set(news.placed.map((x) => x.source)).size,
      sourcesOk: sources.filter((x) => x.ok).length,
      sourcesTotal: sources.length,
    },
  };

  if (!sources.some((x) => x.ok)) {
    console.error("Every source failed — refusing to overwrite the current edition.");
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "edition.json"), JSON.stringify(edition));
  writeFileSync(archivePath, JSON.stringify(archive));
  console.log(
    `\nPrinted edition: ${edition.stats.stories} stories · ${edition.actNow.kev.length} new KEV · ${edition.vulns.nvd.length} critical CVEs · ` +
      `${edition.vulns.advisories.length} advisories · ${edition.detection.sigma.length} new Sigma rules · ${edition.detection.techniques.length} techniques · ` +
      `${edition.iocs.threatfox?.total ?? 0} IOCs · ${edition.ransomware.desk?.total ?? 0} ransomware victims · ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
  console.log(`→ ${join(outDir, "edition.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
