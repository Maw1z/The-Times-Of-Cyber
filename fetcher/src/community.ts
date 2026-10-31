import Parser from "rss-parser";
import { HN_API, HN_MIN_POINTS, HN_QUERIES, HN_WINDOW_HOURS, SUBREDDITS, USER_AGENT } from "./config.ts";
import { errMsg, fetchJson, fetchText } from "./http.ts";
import { budgetParagraphs, clean, domainOf, htmlToParagraphs } from "./text.ts";
import type { CommunityPost, SourceStatus } from "../../client/src/types/edition.ts";

// Broad security relevance filter for HN, where keyword search is noisy.
const SECURITY_RE =
  /\b(secur\w*|vulnerab\w*|exploit\w*|breach\w*|malware|ransomware|hack(ed|er|ers|ing)?|CVE-\d+|zero[- ]day|0day|phish\w*|backdoor\w*|privacy|spyware|encrypt\w*|crypto(graphy)?|attack\w*|leak\w*|surveillance|botnet|DDoS|infosec|pentest\w*|password\w*|auth\w*|sandbox|RCE|XSS|CSRF|TLS|SSH|firewall|NSA|CISA|FBI)\b/i;

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
  created_at: string;
  story_text?: string | null;
}

export async function fetchHackerNews(now: number): Promise<{ posts: CommunityPost[]; status: SourceStatus }> {
  const since = Math.floor(now / 1000) - HN_WINDOW_HOURS * 3600;
  const byId = new Map<string, CommunityPost>();
  let okQueries = 0;
  let lastErr = "";
  await Promise.all(
    HN_QUERIES.map(async (q) => {
      const url = `${HN_API}?tags=story&hitsPerPage=100&query=${encodeURIComponent(q)}&numericFilters=${encodeURIComponent(
        `created_at_i>${since},points>=${HN_MIN_POINTS}`,
      )}`;
      try {
        const res = await fetchJson<{ hits: HnHit[] }>(url);
        okQueries++;
        for (const h of res.hits) {
          if (!h.title || byId.has(h.objectID)) continue;
          const text = h.story_text ? budgetParagraphs(htmlToParagraphs(h.story_text), 90).join(" ") : undefined;
          if (!SECURITY_RE.test(h.title) && !(text && SECURITY_RE.test(text))) continue;
          const discussion = `https://news.ycombinator.com/item?id=${h.objectID}`;
          byId.set(h.objectID, {
            id: `hn-${h.objectID}`,
            platform: "hn",
            community: "Hacker News",
            title: clean(h.title),
            link: h.url ?? discussion,
            discussion,
            domain: h.url ? domainOf(h.url) : "news.ycombinator.com",
            author: h.author,
            points: h.points,
            comments: h.num_comments,
            created: h.created_at,
            text,
          });
        }
      } catch (err) {
        lastErr = errMsg(err);
      }
    }),
  );
  const posts = [...byId.values()].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  return {
    posts,
    status: { name: "Hacker News (Algolia)", url: HN_API, kind: "community", ok: okQueries > 0, items: posts.length, error: okQueries ? undefined : lastErr.slice(0, 160) },
  };
}

interface RedditChild {
  data: {
    id: string;
    title: string;
    permalink: string;
    url: string;
    score: number;
    num_comments: number;
    author: string;
    created_utc: number;
    selftext?: string;
    is_self: boolean;
    domain: string;
    link_flair_text?: string | null;
    stickied?: boolean;
  };
}

async function redditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  const res = await fetchJson<{ access_token?: string }>("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
  });
  return res.access_token ?? null;
}

const rssParser = new Parser();

function fromChild(sub: string, c: RedditChild): CommunityPost {
  const d = c.data;
  const discussion = `https://www.reddit.com${d.permalink}`;
  const text = d.selftext ? budgetParagraphs(d.selftext.split(/\n\s*\n/).map(clean).filter((p) => p.length > 20), 90).join(" ") : undefined;
  return {
    id: `rd-${d.id}`,
    platform: "reddit",
    community: `r/${sub}`,
    title: clean(d.title),
    link: d.is_self ? discussion : d.url,
    discussion,
    domain: d.is_self ? `r/${sub}` : d.domain,
    author: d.author,
    points: d.score,
    comments: d.num_comments,
    created: new Date(d.created_utc * 1000).toISOString(),
    text: text || undefined,
    flair: d.link_flair_text ?? undefined,
  };
}

/**
 * Reddit: OAuth (if REDDIT_CLIENT_ID/SECRET are set) → public JSON → RSS fallback.
 * RSS carries no scores, so points/comments are null in that mode (rendered as "—").
 */
export async function fetchReddit(): Promise<{ posts: CommunityPost[]; status: SourceStatus }> {
  let token: string | null = null;
  let tokenErr = "";
  try {
    token = await redditToken();
  } catch (err) {
    tokenErr = errMsg(err);
  }
  const posts: CommunityPost[] = [];
  const subs: { name: string; mode: string }[] = [];
  const errors: string[] = tokenErr ? [`oauth: ${tokenErr}`] : [];

  for (const sub of SUBREDDITS) {
    let mode: "json" | "oauth" | "rss" | "failed" = "failed";
    let list: CommunityPost[] = [];
    const attempts: { mode: "json" | "oauth" | "rss"; run: () => Promise<CommunityPost[]> }[] = [];
    if (token) {
      attempts.push({
        mode: "oauth",
        run: async () =>
          (await fetchJson<{ data: { children: RedditChild[] } }>(`https://oauth.reddit.com/r/${sub}/top?t=day&limit=25&raw_json=1`, {
            headers: { Authorization: `Bearer ${token}` },
          })).data.children.filter((c) => !c.data.stickied).map((c) => fromChild(sub, c)),
      });
    }
    attempts.push({
      mode: "json",
      run: async () =>
        (await fetchJson<{ data: { children: RedditChild[] } }>(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=25&raw_json=1`)).data.children
          .filter((c) => !c.data.stickied)
          .map((c) => fromChild(sub, c)),
    });
    attempts.push({
      mode: "rss",
      run: async () => {
        const feed = await rssParser.parseString(await fetchText(`https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=25`));
        return feed.items.map((it, i) => {
          const discussion = it.link ?? "";
          const external = it.content?.match(/<a href="([^"]+)">\[link\]<\/a>/)?.[1];
          const isSelf = !external || external === discussion;
          return {
            id: `rd-${sub}-${it.id ?? i}`,
            platform: "reddit" as const,
            community: `r/${sub}`,
            title: clean(it.title ?? ""),
            link: isSelf ? discussion : external!,
            discussion,
            domain: isSelf ? `r/${sub}` : domainOf(external!),
            author: (it.author ?? "").replace(/^\/u\//, "") || undefined,
            points: null,
            comments: null,
            created: it.isoDate ?? new Date().toISOString(),
          };
        });
      },
    });
    for (const a of attempts) {
      try {
        list = await a.run();
        mode = a.mode;
        break;
      } catch (err) {
        errors.push(`${sub}/${a.mode}: ${errMsg(err)}`);
      }
    }
    posts.push(...list);
    subs.push({ name: sub, mode });
  }
  const okSubs = subs.filter((s) => s.mode !== "failed").length;
  return {
    posts: posts.sort((a, b) => (b.points ?? 0) - (a.points ?? 0)),
    status: {
      name: "Reddit",
      url: "https://www.reddit.com",
      kind: "community",
      ok: okSubs > 0,
      items: posts.length,
      error: okSubs === SUBREDDITS.length ? undefined : errors.slice(0, 3).join(" | ").slice(0, 200),
    },
  };
}

