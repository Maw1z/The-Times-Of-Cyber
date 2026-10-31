import type { Edition } from "../types/edition";

/**
 * Photos are checked before the paper is typeset, so a dead or tiny image (logos,
 * tracking pixels) never leaves a hole in a finished page.
 */
function probe(src: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    const timer = setTimeout(() => resolve(true), timeoutMs); // slow ≠ broken: keep it
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.naturalWidth >= 240 && img.naturalHeight >= 120 && img.naturalWidth / img.naturalHeight < 4);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = src;
  });
}

type Node = Record<string, unknown>;
function walk(v: unknown, fn: (o: Node) => void) {
  if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
  else if (v && typeof v === "object") {
    fn(v as Node);
    Object.values(v as Node).forEach((x) => walk(x, fn));
  }
}
const imgOf = (o: Node) => {
  const im = o.image as { src?: unknown } | undefined;
  return im && typeof im === "object" && typeof im.src === "string" ? im.src : null;
};

export async function dropBrokenImages(e: Edition, timeoutMs = 3500): Promise<Edition> {
  const srcs = new Set<string>();
  walk(e, (o) => {
    const s = imgOf(o);
    if (s) srcs.add(s);
  });
  const results = await Promise.all([...srcs].map(async (s) => [s, await probe(s, timeoutMs)] as const));
  const bad = new Set(results.filter(([, ok]) => !ok).map(([s]) => s));
  if (!bad.size) return e;
  const copy = structuredClone(e);
  walk(copy, (o) => {
    const s = imgOf(o);
    if (s && bad.has(s)) delete o.image;
  });
  return copy;
}
