import type { Item } from "./flow";
import type { SectionId } from "../pages/registry";

/** One item (or a slice of it) placed on a page. */
export interface Placed {
  it: Item;
  /** Height on the page, excluding the gap. */
  h: number;
  gap: number;
  /** Slice of a split item: show `clip` px starting `y0` px into it. */
  y0?: number;
  clip?: number;
  /** Photo height chosen for this page. */
  imgH?: number;
  /** A repeated table / list header, not new content. */
  repeat?: boolean;
}

/** Does this placement start its item (rather than continue or repeat one)? */
export const starts = (p: Placed) => !p.repeat && !p.y0;

export interface PageData {
  sec: SectionId;
  items: Placed[];
  used: number;
  cap: number;
}

const MIN_LINES = 2; // no single orphan/widow lines
const MIN_SLICE = 90; // smallest useful slice of an oversize block
const MAX_STRETCH = 36; // most extra space added to one gap when justifying a page

/**
 * Greedy page filler. Paragraphs split at line boundaries (never leaving one line
 * alone), photos shrink to fit, headings stay with what follows, table headers
 * repeat on continuation pages. `capFor(i)` = usable height of page i.
 */
export function paginate(items: Item[], H: Map<string, number>, capFor: (page: number) => number): PageData[] {
  const pages: PageData[] = [];
  const freshCap = Math.min(capFor(0), capFor(1));
  let cur: Placed[] = [];
  let used = 0;
  let cap = capFor(0);
  let lastGroup: string | undefined;

  const h = (it: Item) => H.get(it.key) ?? 0;
  const lines = (it: Item) => (it.lh ? Math.round(h(it) / it.lh) : 0);
  const isText = (it: Item) => !!it.lh && Math.abs(h(it) - lines(it) * it.lh) < 2 && lines(it) > 0;
  const oversize = (it: Item) => !it.lh && !it.img && h(it) > freshCap - 40;

  const flush = () => {
    if (!cur.length) return;
    pages.push({ sec: cur.find((p) => !p.it.dropAtTop)?.it.sec ?? cur[0].it.sec, items: cur, used, cap });
    cur = [];
    used = 0;
    cap = capFor(pages.length);
  };

  /** Smallest height that must fit for item i to start here (its keep-chain included). */
  const need = (i: number, first: boolean, depth = 0): number => {
    const it = items[i];
    if (!it) return 0;
    const g = first && !cur.length ? 0 : (it.gap ?? 0);
    let n: number;
    if (it.keep) n = h(it);
    else if (isText(it)) n = (lines(it) <= MIN_LINES * 2 - 1 ? lines(it) : MIN_LINES) * it.lh!;
    else if (it.img) n = h(it) - it.img.pref + it.img.min;
    else if (oversize(it)) n = MIN_SLICE;
    else n = h(it);
    if (it.keep && depth < 8) {
      // a photo right after a heading may be deferred, so the chain continues past it
      const nextIdx = items[i + 1]?.img && items[i + 2] ? i + 2 : i + 1;
      n += need(nextIdx, false, depth + 1);
    }
    return g + n;
  };

  let i = 0;
  let off = 0; // lines (text) or px (oversize block) of items[i] already placed
  let deferred: Item | null = null; // photo that didn't fit: goes to the top of the next page
  while (i < items.length) {
    if (deferred && !cur.length) {
      const d: Item = deferred;
      deferred = null;
      const ih = Math.min(d.img!.pref, cap - (h(d) - d.img!.pref));
      cur.push({ it: d, h: h(d) - d.img!.pref + ih, gap: 0, imgH: ih });
      used += h(d) - d.img!.pref + ih;
    }
    const it = items[i];
    if (it.dropAtTop && !cur.length) {
      i++;
      continue;
    }
    // A table/list continuing from the previous page gets its header again.
    if (!cur.length && it.cont && it.group && lastGroup === it.group) {
      cur.push({ it: it.cont, h: h(it.cont), gap: 0, repeat: true });
      used += h(it.cont);
    }
    const startHere = off === 0;
    const gap = startHere && cur.length ? (it.gap ?? 0) : 0;
    const onlyHeader = cur.length === 1 && cur[0].it === it.cont;
    if (startHere && cur.length && !onlyHeader && need(i, true) > cap - used) {
      // photos already on the page can give up height before we give up the page
      const short = need(i, true) - (cap - used);
      const slack = cur.reduce((a, p) => a + (p.imgH != null && p.it.img ? p.imgH - p.it.img.min : 0), 0);
      if (short > slack) {
        flush();
        continue;
      }
      let left = short;
      for (const p of cur) {
        if (left <= 0 || p.imgH == null || !p.it.img) continue;
        const give = Math.min(left, p.imgH - p.it.img.min);
        p.imgH -= give;
        p.h -= give;
        used -= give;
        left -= give;
      }
    }
    const room = cap - used - gap;

    if (isText(it)) {
      const lh = it.lh!;
      const left = lines(it) - off;
      const fit = Math.floor((room + 0.5) / lh);
      if (left <= fit) {
        cur.push({ it, h: left * lh, gap, y0: off * lh, clip: off ? left * lh : undefined });
        used += gap + left * lh;
        i++;
        off = 0;
      } else {
        let take = fit;
        if (left - take < MIN_LINES) take = left - MIN_LINES;
        if (take < MIN_LINES && cur.length) {
          flush();
          continue;
        }
        take = Math.max(1, take);
        cur.push({ it, h: take * lh, gap, y0: off * lh, clip: take * lh });
        used += gap + take * lh;
        off += take;
        flush();
      }
    } else if (it.img) {
      const base = h(it) - it.img.pref;
      if (base + it.img.min > room && cur.length && !deferred && items[i + 1] && !items[i + 1].img) {
        // let the text run on and print the photo at the top of the next page
        deferred = it;
        i++;
        continue;
      }
      const ih = Math.max(it.img.min, Math.min(it.img.pref, room - base));
      cur.push({ it, h: base + ih, gap, imgH: ih });
      used += gap + base + ih;
      i++;
    } else if (oversize(it)) {
      const take = Math.min(h(it) - off, room);
      if (take < MIN_SLICE && cur.length && h(it) - off > take) {
        flush();
        continue;
      }
      cur.push({ it, h: take, gap, y0: off, clip: take });
      used += gap + take;
      off += take;
      if (off >= h(it) - 0.5) {
        i++;
        off = 0;
      } else flush();
    } else {
      cur.push({ it, h: h(it), gap });
      used += gap + h(it);
      i++;
    }
    lastGroup = it.group;
  }
  flush();
  if (deferred) {
    const d: Item = deferred;
    cur.push({ it: d, h: h(d), gap: 0, imgH: d.img!.pref });
    used = h(d);
    flush();
  }
  return pages;
}

/**
 * Leftover space on a full page is shared out so the page ends flush with the
 * bottom margin: photos grow first, then the gaps between items widen.
 */
export function justify(page: PageData, isLast: boolean): { extraGap: number[]; imgH: (number | undefined)[] } {
  let extra = isLast ? 0 : Math.max(0, page.cap - page.used);
  const imgH = page.items.map((p) => p.imgH);
  page.items.forEach((p, k) => {
    if (extra <= 0 || p.imgH == null || !p.it.img) return;
    const grow = Math.min(extra, p.it.img.max - p.imgH);
    if (grow > 0) {
      imgH[k] = p.imgH + grow;
      extra -= grow;
    }
  });
  // every boundary widens a little, bigger gaps a little more — no single hole
  const weights = page.items.map((p, k) => (k === 0 ? 0 : 1 + p.gap / 30));
  const total = weights.reduce((a, b) => a + b, 0);
  // …but never more than ~1½ lines per boundary: rivers of white read worse than a short page
  const extraGap = weights.map((w) => (total > 0 ? Math.min(MAX_STRETCH, Math.floor((extra * w) / total)) : 0));
  return { extraGap, imgH };
}
