import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { USER_AGENT } from "./config.ts";

/**
 * Tiny HTTP layer. In fixture mode (--fixtures <dir>) URLs are served from
 * <dir>/index.json ({ "<url>": "<file>" }) so the pipeline can be tested offline.
 */
let fixtureDir: string | null = null;
let fixtureIndex: Record<string, string> = {};

export function useFixtures(dir: string) {
  fixtureDir = dir;
  fixtureIndex = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface FetchOpts {
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  if (fixtureDir) {
    // longest matching prefix wins, so specific URLs can override general ones
    const key = Object.keys(fixtureIndex)
      .filter((k) => url === k || url.startsWith(k))
      .sort((x, y) => y.length - x.length)[0];
    const file = key ? join(fixtureDir, fixtureIndex[key]) : null;
    if (!file || !existsSync(file)) throw new HttpError(404, `fixture missing for ${url}`);
    return readFileSync(file, "utf8");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15_000);
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      body: opts.body,
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/atom+xml, application/xml, application/json, text/html;q=0.8, */*;q=0.5",
        ...opts.headers,
      },
    });
    if (!res.ok) throw new HttpError(res.status, `HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const msg = (err as Error).name === "AbortError" ? "timeout" : (err as Error).message;
    throw new HttpError(0, `${msg} for ${url}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  return JSON.parse(await fetchText(url, opts)) as T;
}

/** Run async jobs with bounded concurrency, preserving input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
