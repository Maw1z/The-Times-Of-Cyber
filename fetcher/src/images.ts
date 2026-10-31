import { fetchText } from "./http.ts";
import { decodeEntities } from "./text.ts";

const OG_RE = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
];

/** Look up an article's og:image. Returns undefined on any failure. */
export async function findOgImage(articleUrl: string): Promise<string | undefined> {
  try {
    const html = (await fetchText(articleUrl, { timeoutMs: 8_000, headers: { Accept: "text/html" } })).slice(0, 300_000);
    for (const re of OG_RE) {
      const m = html.match(re);
      if (m) {
        const url = new URL(decodeEntities(m[1]), articleUrl).toString();
        if (/^https?:/.test(url) && !/(logo|default|placeholder|favicon)/i.test(url)) return url;
      }
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
