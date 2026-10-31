import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Edition } from "../types/edition";
import type { SectionId } from "../pages/registry";
import { measurable, natural, type Item } from "./flow";
import { NavContext } from "./kit";
import { buildFlow } from "./sections";
import { paginate, type PageData } from "./paginate";
import { geom, type Geom } from "./Page";
import { Book, ZOOMS, type BookLayout } from "./Book";
import { dropBrokenImages } from "./images";

type Layout = BookLayout | { mode: "scroll"; cw: number };

const NAV_H = 64; // page indicator under the book
const MARGIN = 20;

/** Book on tablets and desktops; a continuous scroll on phones. */
function computeLayout(W: number, H: number): Layout {
  if (W < 700 || H < 520) {
    const sheet = Math.min(W - 16, 720);
    return { mode: "scroll", cw: Math.floor(sheet - 2 * (W < 420 ? 16 : 26)) };
  }
  const ratio = 0.7; // page width : height
  const byHeight = (H - NAV_H - MARGIN) * ratio;
  const spreadW = Math.min(byHeight, (W - 2 * MARGIN) / 2);
  const singleW = Math.min(byHeight, W - 2 * MARGIN);
  const spread = spreadW >= 380 && spreadW >= singleW * 0.78;
  const pageW = Math.floor(spread ? spreadW : singleW);
  return { mode: "book", pageW, pageH: Math.floor(pageW / ratio), spread };
}

function useLayout(): Layout {
  const get = () => computeLayout(window.innerWidth, window.innerHeight);
  const [layout, setLayout] = useState<Layout>(get);
  useEffect(() => {
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const next = get();
        setLayout((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      }, 160);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return layout;
}

export function Paper({ edition, onReady }: { edition: Edition; onReady?: () => void }) {
  const [now] = useState(() => Date.now());
  const [ed, setEd] = useState<Edition | null>(null);
  const layout = useLayout();
  useEffect(() => {
    let live = true;
    dropBrokenImages(edition).then((e) => live && setEd(e));
    return () => {
      live = false;
    };
  }, [edition]);
  if (!ed) return <Typesetting />;
  return layout.mode === "book" ? <BookPaper e={ed} now={now} layout={layout} onReady={onReady} /> : <ScrollPaper e={ed} now={now} cw={layout.cw} />;
}

function Typesetting() {
  return (
    <div className="paper mx-auto mt-10 max-w-[520px] px-8 py-12 text-center shadow-lg">
      <p className="ink-display font-Libre font-bold text-[26px] m-0">Setting type…</p>
      <p className="meta mt-2">Checking photos and laying out today's pages.</p>
    </div>
  );
}

// ── Book ───────────────────────────────────────────────────────────────

const FONT_PROBES = ['15px "Libre Baskerville"', 'bold 15px "Libre Baskerville"', 'italic 15px "Libre Baskerville"', '40px "Aktura"'];

const ZOOM_KEY = "toc-text-size";
function readZoom(): number {
  try {
    const z = Number(localStorage.getItem(ZOOM_KEY));
    if (ZOOMS.includes(z)) return z;
  } catch {
    /* storage unavailable */
  }
  return 0.76; // default: body text ≈ 11.5px on screen, roughly 1.7× the copy of full size
}

interface Typeset {
  n: number;
  g: Geom;
  pages: PageData[];
}

/**
 * Renders every item off-screen at the page's text width, measures them once the
 * fonts are in, and paginates. The previous typesetting stays on screen until the
 * new one is ready, so changing text size or window size doesn't flash.
 */
function useTypeset(items: Item[], g: Geom): { ref: RefObject<HTMLDivElement | null>; result: Typeset | null } {
  const ref = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<Typeset | null>(null);
  useLayoutEffect(() => {
    let live = true;
    const fonts = document.fonts;
    Promise.all(FONT_PROBES.map((f) => fonts.load(f).catch(() => [])))
      .then(() => fonts.ready)
      .then(() => {
        if (!live || !ref.current) return;
        const m = new Map<string, number>();
        for (const el of Array.from(ref.current.children) as HTMLElement[]) m.set(el.dataset.k!, el.getBoundingClientRect().height);
        setResult((prev) => ({ n: (prev?.n ?? 0) + 1, g, pages: paginate(items, m, g.capFor) }));
      });
    return () => {
      live = false;
    };
  }, [items, g]);
  return { ref, result };
}

function BookPaper({ e, now, layout, onReady }: { e: Edition; now: number; layout: BookLayout; onReady?: () => void }) {
  const [zoom, setZoom] = useState(readZoom);
  const g = useMemo(() => geom(Math.round(layout.pageW / zoom), Math.round(layout.pageH / zoom)), [layout.pageW, layout.pageH, zoom]);
  const items = useMemo(() => buildFlow(e, now, g.cw), [e, now, g.cw]);
  const all = useMemo(() => measurable(items), [items]);
  const { ref, result } = useTypeset(items, g);
  const secPage = useMemo(() => {
    const out: Partial<Record<SectionId, number>> = {};
    result?.pages.forEach((p, i) => p.items.forEach((x) => (out[x.it.sec] ??= i + 1)));
    return out;
  }, [result]);
  useEffect(() => {
    if (result) onReady?.();
  }, [result, onReady]);
  const changeZoom = (z: number) => {
    setZoom(z);
    try {
      localStorage.setItem(ZOOM_KEY, String(z));
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <>
      {/* off-screen typesetting pass (same fonts, same width as a page) */}
      <div ref={ref} className="paper measure" style={{ width: g.cw }} aria-hidden="true">
        {all.map((it) => (
          <div key={it.key} data-k={it.key} className="fi">
            {natural(it)}
          </div>
        ))}
      </div>
      {result ? (
        <Book
          key={result.n}
          pages={result.pages}
          edition={e}
          layout={{ ...layout, pageH: Math.round(layout.pageW * (result.g.h / result.g.w)) }}
          g={result.g}
          secPage={secPage}
          zoom={zoom}
          onZoom={changeZoom}
        />
      ) : (
        <Typesetting />
      )}
    </>
  );
}

// ── Phone: one long sheet ─────────────────────────────────────────────────

function ScrollPaper({ e, now, cw }: { e: Edition; now: number; cw: number }) {
  const items = useMemo(() => buildFlow(e, now, cw), [e, now, cw]);
  const nav = useMemo(
    () => ({
      mode: "scroll" as const,
      secPage: {},
      goTo: (sec: SectionId) => document.getElementById(sec)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    }),
    [],
  );
  return (
    <NavContext.Provider value={nav}>
      <main className="scroll-stage">
        <article className="paper scroll-sheet" style={{ width: cw + 2 * (cw < 380 ? 16 : 26), paddingInline: cw < 380 ? 16 : 26 }}>
          {items.map((it, i) => (
            <div key={it.key} id={it.anchor} className="fi" style={{ paddingTop: i === 0 ? 0 : it.gap, scrollMarginTop: 12 }}>
              {natural(it)}
            </div>
          ))}
          <p className="meta text-center mt-8 mb-0 border-t-2 border-[var(--ink)] pt-2">End of edition · The Times of Cyber</p>
        </article>
      </main>
    </NavContext.Provider>
  );
}
