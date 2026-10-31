import { NEWS_MAX_AGE_HOURS, NEWS_WINDOW_HOURS, OG_IMAGE_LOOKUPS, TARGETS } from "./config.ts";
import { classify } from "./classify.ts";
import { findOgImage } from "./images.ts";
import { budgetParagraphs, findCves, hoursAgo, jaccard, titleTokens } from "./text.ts";
import { techniquesIn } from "./detection.ts";
import { ACTORS, actorsIn } from "./actors.ts";
import type { RawItem } from "./rss.ts";
import type { SectionKey, Story } from "../../client/src/types/edition.ts";

type PageKey = Exclude<SectionKey, "general">;
const SECTION_ORDER: PageKey[] = ["ransomware", "zeroday", "breaches", "policy", "vulns", "actors"];

export interface AssembledNews {
  front: { lead: Story | null; top: Story[] };
  sections: Record<SectionKey, Story[]>;
  placed: Story[];
}

interface Enriched extends RawItem {
  section: SectionKey;
  tags: SectionKey[];
  cves: string[];
  tokens: Set<string>;
}

interface Cluster {
  rep: Enriched;
  members: Enriched[];
  score: number;
  section: SectionKey;
  tags: SectionKey[];
}

function words(it: RawItem) {
  return it.paragraphs.join(" ").split(/\s+/).length;
}

/**
 * Greedy clustering of near-duplicate headlines (same story, different outlets).
 * Each item is compared with a cluster's seed only, so similarity can't chain
 * unrelated stories together the way transitive union-find would.
 */
function clusterItems(items: Enriched[]): Enriched[][] {
  const sorted = [...items].sort((a, b) => b.weight - a.weight || b.published.localeCompare(a.published));
  const clusters: { seed: Enriched; members: Enriched[] }[] = [];
  for (const it of sorted) {
    let best: (typeof clusters)[number] | null = null;
    let bestSim = 0;
    for (const c of clusters) {
      if (c.members.some((m) => m.source === it.source)) continue;
      if (Math.abs(Date.parse(c.seed.published) - Date.parse(it.published)) > 72 * 3_600_000) continue;
      const titleCves = findCves(it.title);
      const sharedCve = titleCves.length > 0 && titleCves.some((x) => findCves(c.seed.title).includes(x));
      let shared = 0;
      for (const t of it.tokens) if (c.seed.tokens.has(t)) shared++;
      const sim = jaccard(it.tokens, c.seed.tokens);
      const score = sharedCve ? 1 : sim >= 0.4 && shared >= 3 ? sim : 0;
      if (score > bestSim) {
        bestSim = score;
        best = c;
      }
    }
    if (best) best.members.push(it);
    else clusters.push({ seed: it, members: [it] });
  }
  return clusters.map((c) => c.members);
}

function toStory(c: Cluster, maxWords: number): Story {
  const { rep } = c;
  const others = c.members.filter((m) => m.source !== rep.source);
  const seen = new Set<string>();
  return {
    id: rep.id,
    title: rep.title,
    link: rep.link,
    source: rep.source,
    domain: rep.domain,
    author: rep.author,
    published: rep.published,
    body: budgetParagraphs(rep.paragraphs, maxWords),
    image: rep.image ? { src: rep.image, alt: rep.title } : undefined,
    section: c.section,
    tags: c.tags,
    alsoReportedBy: others
      .filter((m) => !seen.has(m.source) && seen.add(m.source))
      .map((m) => ({ source: m.source, link: m.link })),
    cves: rep.cves.length ? rep.cves : undefined,
    techniques: (() => {
      const t = techniquesIn(`${rep.title} ${rep.paragraphs.join(" ")}`);
      return t.length ? t.slice(0, 6) : undefined;
    })(),
    actors: (() => {
      const a = actorsIn(`${rep.title} ${rep.paragraphs.slice(0, 4).join(" ")}`).map((id) => ACTORS.find((x) => x.id === id)!.name);
      return a.length ? a : undefined;
    })(),
  };
}

export async function assembleNews(raw: RawItem[], now: number): Promise<AssembledNews> {
  // 1. Age filter + exact-duplicate removal.
  const byId = new Map<string, RawItem>();
  for (const it of raw) {
    if (hoursAgo(it.published, now) > NEWS_MAX_AGE_HOURS || hoursAgo(it.published, now) < -6) continue;
    if (!byId.has(it.id)) byId.set(it.id, it);
  }

  // 2. Classify.
  const items: Enriched[] = [...byId.values()].map((it) => {
    const body = it.paragraphs.slice(0, 3).join(" ");
    const { section, tags } = classify(it.title, body);
    return { ...it, section, tags, cves: findCves(`${it.title} ${body}`), tokens: titleTokens(it.title) };
  });

  // 3. Cluster + score. Score = recency (18h half-life) × cross-outlet coverage × source weight.
  const clusters: Cluster[] = clusterItems(items).map((members) => {
    const rep = [...members].sort(
      (a, b) =>
        b.weight + (b.image ? 0.25 : 0) + Math.min(words(b), 250) / 500 - (a.weight + (a.image ? 0.25 : 0) + Math.min(words(a), 250) / 500),
    )[0];
    const newest = Math.min(...members.map((m) => hoursAgo(m.published, now)));
    const outlets = new Set(members.map((m) => m.source)).size;
    const weight = members.reduce((s, m) => s + m.weight, 0) / members.length;
    const tags = [...new Set(members.flatMap((m) => m.tags))];
    return { rep, members, score: Math.pow(0.5, Math.max(newest, 0) / 18) * (1 + 0.6 * (outlets - 1)) * weight, section: rep.section, tags };
  });
  clusters.sort((a, b) => b.score - a.score);

  // 4. Images: look up og:image for the strongest candidates that lack one.
  let lookups = 0;
  const ensureImage = async (c: Cluster) => {
    if (c.rep.image || lookups >= OG_IMAGE_LOOKUPS) return;
    lookups++;
    const alt = c.members.find((m) => m.image);
    c.rep.image = alt?.image ?? (await findOgImage(c.rep.link));
  };
  await Promise.all(clusters.slice(0, 4).map(ensureImage));

  // 5. Front page: lead = best-scoring cluster (preferring art among near-equals), then
  //    the next best, capped at 2 per section so the front stays varied.
  const placed = new Set<Cluster>();
  const top4 = clusters.slice(0, 4);
  const lead = top4.find((c) => c.rep.image && c.score >= top4[0].score * 0.8) ?? clusters[0];
  if (lead) placed.add(lead);
  const perSection = new Map<SectionKey, number>();
  const frontTop: Cluster[] = [];
  for (const c of clusters) {
    if (frontTop.length >= TARGETS.frontTop) break;
    if (placed.has(c)) continue;
    const n = perSection.get(c.section) ?? 0;
    if (n >= 2) continue;
    perSection.set(c.section, n + 1);
    frontTop.push(c);
    placed.add(c);
  }

  // 6. Sections. Pass 1: own stories (72h, widened to 7 days if thin). Pass 2: round-robin
  //    fill with stories merely tagged for the section. Leftovers go to "general".
  const lists = Object.fromEntries([...SECTION_ORDER, "general"].map((k) => [k, [] as Cluster[]])) as Record<SectionKey, Cluster[]>;
  const fresh = (c: Cluster) => hoursAgo(c.rep.published, now) <= NEWS_WINDOW_HOURS;
  const takeFor = (key: SectionKey, pred: (c: Cluster) => boolean, max = TARGETS.section) => {
    for (const c of clusters) {
      if (lists[key].length >= max) return;
      if (!placed.has(c) && pred(c)) {
        lists[key].push(c);
        placed.add(c);
      }
    }
  };
  for (const key of SECTION_ORDER) {
    takeFor(key, (c) => c.section === key && fresh(c));
    takeFor(key, (c) => c.section === key && hoursAgo(c.rep.published, now) <= NEWS_MAX_AGE_HOURS);
  }
  for (let round = 0; round < TARGETS.section; round++) {
    for (const key of SECTION_ORDER) {
      const n = lists[key].length;
      if (n < TARGETS.section) takeFor(key, (c) => c.tags.includes(key), n + 1);
    }
  }
  takeFor("general", (c) => fresh(c), TARGETS.section);

  await Promise.all(SECTION_ORDER.map((k) => lists[k][0]).filter(Boolean).map(ensureImage));
  if (lead) await ensureImage(lead);

  const sections = Object.fromEntries(
    Object.entries(lists).map(([k, list]) => [k, list.map((c, i) => toStory(c, i === 0 ? 150 : 90))]),
  ) as Record<SectionKey, Story[]>;
  const front = { lead: lead ? toStory(lead, 260) : null, top: frontTop.map((c) => toStory(c, 70)) };
  const placedStories = [front.lead, ...front.top, ...Object.values(sections).flat()].filter((s): s is Story => !!s);
  return { front, sections, placed: placedStories };
}
