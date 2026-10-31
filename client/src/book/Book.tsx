import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import type { Edition } from "../types/edition";
import { section, type SectionId } from "../pages/registry";
import { NavContext, type Nav } from "./kit";
import { PageView, type Geom } from "./Page";
import { starts, type PageData } from "./paginate";

export interface BookLayout {
  mode: "book";
  pageW: number;
  pageH: number;
  spread: boolean;
}

/** First item on the page being read — survives re-typesetting (text size, window size). */
let readingAt: string | null = null;

function startPage(pages: PageData[]): number {
  if (readingAt) {
    const i = pages.findIndex((p) => p.items.some((x) => x.it.key === readingAt && starts(x)));
    if (i >= 0) return i;
  }
  const m = /^#p(\d+)$/.exec(window.location.hash);
  return m ? Math.min(pages.length - 1, Math.max(0, Number(m[1]) - 1)) : 0;
}

const firstKey = (p?: PageData) => (p?.items.find(starts) ?? p?.items[0])?.it.key ?? null;

export const ZOOMS = [0.64, 0.7, 0.76, 0.82, 0.9, 1];

/**
 * The paper as a book: StPageFlip turns real DOM pages with a curl and shadow.
 * Pages are plain divs owned by the flip engine; React renders into them through
 * portals. Drag/swipe a corner, click a page edge, use ← →, the wheel, or the
 * buttons underneath.
 */
export function Book({
  pages,
  edition,
  layout,
  g,
  secPage,
  zoom,
  onZoom,
}: {
  pages: PageData[];
  edition: Edition;
  layout: BookLayout;
  g: Geom;
  secPage: Partial<Record<SectionId, number>>;
  zoom: number;
  onZoom: (z: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pf = useRef<PageFlip | null>(null);
  const [cur, setCur] = useState(() => startPage(pages));
  const [touched, setTouched] = useState(false);
  const curRef = useRef(cur);
  useEffect(() => {
    curRef.current = cur;
  }, [cur]);
  const { pageW, pageH, spread } = layout;

  // Page elements belong to the flip engine; React fills them through portals.
  const els = useMemo(() => {
    const stop = (ev: Event) => {
      // let links and buttons on a page work instead of starting a page turn
      if ((ev.target as Element | null)?.closest?.("a,button")) ev.stopPropagation();
    };
    return pages.map(() => {
      const d = document.createElement("div");
      d.className = "book-page";
      d.dataset.density = "soft";
      d.addEventListener("mousedown", stop);
      d.addEventListener("touchstart", stop, { passive: true });
      return d;
    });
  }, [pages]);

  useLayoutEffect(() => {
    const root = document.createElement("div");
    host.current!.appendChild(root);
    for (const d of els) root.appendChild(d);
    const flip = new PageFlip(root, {
      width: pageW,
      height: pageH,
      size: "fixed",
      startPage: curRef.current,
      showCover: false,
      usePortrait: true,
      autoSize: true,
      drawShadow: true,
      maxShadowOpacity: 0.5,
      flippingTime: 750,
      mobileScrollSupport: false,
      showPageCorners: true,
      swipeDistance: 24,
    });
    flip.loadFromHTML(els);
    let settled = false; // the engine reports its start page once; that isn't the reader turning
    flip.on("flip", (e) => {
      const n = Number(e.data);
      setCur(n);
      if (settled || n !== curRef.current) readingAt = firstKey(pages[layout.spread ? n - (n % 2) : n]);
      settled = true;
      setTouched(true);
      try {
        history.replaceState(null, "", `#p${n + 1}`);
      } catch {
        /* ignore */
      }
    });
    pf.current = flip;
    readingAt ??= firstKey(pages[curRef.current]);
    return () => {
      pf.current = null;
      flip.destroy();
    };
  }, [els, pages, pageW, pageH, layout.spread]); // a new typesetting remounts Book (keyed by the parent)

  const next = useCallback(() => pf.current?.flipNext(), []);
  const prev = useCallback(() => pf.current?.flipPrev(), []);
  const go = useCallback((i: number) => {
    const f = pf.current;
    if (!f) return;
    f.flip(Math.max(0, Math.min(pages.length - 1, i))); // one animated turn, however far
  }, [pages.length]);

  // Keyboard and wheel / trackpad paging.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if ((t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowRight", "PageDown", " ", "j"].includes(e.key)) next();
      else if (["ArrowLeft", "PageUp", "k"].includes(e.key)) prev();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(pages.length - 1);
      else return;
      e.preventDefault();
    };
    let acc = 0;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() < lock || pf.current?.getState() !== "read") return;
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(acc) > 60) {
        if (acc > 0) next();
        else prev();
        acc = 0;
        lock = Date.now() + 850;
      }
    };
    const el = host.current!;
    window.addEventListener("keydown", onKey);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("wheel", onWheel);
    };
  }, [next, prev, go, pages.length]);

  const nav: Nav = useMemo(() => ({ mode: "book", secPage, goTo: (sec) => go((secPage[sec] ?? 1) - 1) }), [secPage, go]);

  const total = pages.length;
  const left = spread ? cur - (cur % 2) : cur;
  const shown = spread ? [left, left + 1].filter((n) => n < total) : [cur];
  const label = shown.map((n) => n + 1).join("–");
  const scale = pageW / g.w;
  const zi = ZOOMS.indexOf(zoom);

  return (
    <NavContext.Provider value={nav}>
      <div className="book-stage">
        <div ref={host} className={`book-host ${spread ? "is-spread" : "is-single"}`} style={{ width: spread ? pageW * 2 : pageW, height: pageH }} />
        <nav className="book-nav no-print" aria-label="Pages">
          <button type="button" onClick={prev} disabled={left <= 0} aria-label="Previous page">
            ‹
          </button>
          <span className="book-nav-label">
            <strong>{[...new Set(shown.map((n) => pages[n]?.sec ?? "a1"))].map((sec) => section(sec).title).join(" / ")}</strong>
            <span>
              {" "}
              · page{shown.length > 1 ? "s" : ""} {label} of {total}
            </span>
            {!touched && <span className="book-hint"> · drag a corner, swipe or press → to turn</span>}
          </span>
          <button type="button" onClick={next} disabled={shown[shown.length - 1] >= total - 1} aria-label="Next page">
            ›
          </button>
          <span className="book-zoom" role="group" aria-label="Text size">
            <button type="button" onClick={() => onZoom(ZOOMS[zi - 1])} disabled={zi <= 0} aria-label="Smaller text" title="Smaller text — more on each page">
              <span className="text-[11px]">A</span>
            </button>
            <button type="button" onClick={() => onZoom(ZOOMS[zi + 1])} disabled={zi >= ZOOMS.length - 1} aria-label="Larger text" title="Larger text">
              <span className="text-[16px]">A</span>
            </button>
          </span>
        </nav>
      </div>
      {els.map((el, i) => createPortal(<PageView page={pages[i]} index={i} total={total} edition={edition} g={g} scale={scale} side={spread ? (i % 2 ? "right" : "left") : "single"} />, el, `p${i}`))}
    </NavContext.Provider>
  );
}
