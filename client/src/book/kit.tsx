import { createContext, useContext, useState, type ReactNode } from "react";
import type { Story } from "../types/edition";
import type { SectionId } from "../pages/registry";
import { section } from "../pages/registry";
import { ago } from "../lib/format";
import { Badge, ExtLink } from "../components/Primitives";
import { AlsoReported, StoryTags } from "../components/StoryBlock";
import type { Flow, Item } from "./flow";

// ── Navigation context (book: flip to a page; scroll: jump to an anchor) ──
export interface Nav {
  mode: "book" | "scroll";
  /** 1-based page number where each section starts (book mode). */
  secPage: Partial<Record<SectionId, number>>;
  goTo: (sec: SectionId) => void;
}
export const NavContext = createContext<Nav>({ mode: "scroll", secPage: {}, goTo: () => {} });
export const useNav = () => useContext(NavContext);

// ── Type scale (fixed line heights so paragraphs can split at line boundaries) ──
export const LH_BODY = 24; // 15px Libre Baskerville
export const LH_CARD = 22; // 14px

export const GAP = { box: 26, item: 0, card: 14, para: 8, section: 30 };

/** Cut text at a word boundary. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,;:.–—-]+$/, "")}…`;
}

// ── Building blocks ──────────────────────────────────────────────────────

/** Section opener: section code, big letterpress title, deck line, double rule. */
export function banner(f: Flow, deck: ReactNode) {
  const s = section(f.sec);
  f.add({
    key: `${f.sec}-banner`,
    anchor: f.sec,
    gap: GAP.section,
    keep: true,
    node: (
      <header className="pt-1">
        <div className="flex items-baseline gap-3 border-t-[3px] border-[var(--ink)] pt-1.5">
          <span className="kicker text-[var(--ink)] shrink-0">Section {s.code}</span>
          <span className="font-Libre italic text-[12px] leading-[1.4] text-[var(--ink-2)] ml-auto text-right">{s.role}</span>
        </div>
        <h2 className="ink-display font-Libre font-bold uppercase text-center leading-[1.04] tracking-[-0.01em] mt-3 mb-1.5 text-[clamp(26px,8vw,38px)]" style={{ textWrap: "balance" }}>
          {s.title}
        </h2>
        {deck && <p className="text-center font-Libre font-bold uppercase tracking-[0.05em] text-[11.5px] leading-[1.5] text-[var(--ink-2)] m-0 mb-3">{deck}</p>}
        <div className="rule-double" />
      </header>
    ),
  });
}

function BoxTitle({ title, right, cont }: { title: ReactNode; right?: ReactNode; cont?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b-2 border-[var(--ink)] pb-1 mb-1">
      <h3 className="m-0 font-[family-name:var(--font-label)] text-[12px] font-bold uppercase tracking-[0.12em]">
        {title}
        {cont && <span className="font-normal text-[var(--ink-3)] normal-case tracking-normal italic"> (continued)</span>}
      </h3>
      {right && !cont && <span className="meta text-right">{right}</span>}
    </div>
  );
}

/** Titled panel heading. Returns the "(continued)" header for lists/tables that follow. */
export function boxTitle(f: Flow, key: string, title: ReactNode, right?: ReactNode, gap = GAP.box): Item {
  f.add({ key: `${f.sec}-${key}-title`, gap, keep: true, node: <BoxTitle title={title} right={right} /> });
  return { key: `${f.sec}-${key}-cont`, sec: f.sec, node: <BoxTitle title={title} cont /> };
}

export function note(f: Flow, key: string, children: ReactNode) {
  f.add({ key: `${f.sec}-${key}-note`, gap: 6, node: <p className="meta italic m-0">{children}</p> });
}

export function empty(f: Flow, key: string, children: ReactNode) {
  f.add({ key: `${f.sec}-${key}-empty`, gap: 4, node: <p className="font-Libre italic text-[14px] leading-[1.5] text-[var(--ink-3)] m-0 py-1">{children}</p> });
}

export function block(f: Flow, key: string, node: ReactNode, opts: Partial<Item> = {}) {
  f.add({ key: `${f.sec}-${key}`, node, gap: 10, ...opts });
}

/** Plain paragraph that may split across pages. */
export function para(f: Flow, key: string, text: ReactNode, opts: { gap?: number; card?: boolean; dropcap?: boolean; className?: string } = {}) {
  const lh = opts.card ? LH_CARD : LH_BODY;
  f.add({
    key: `${f.sec}-${key}`,
    lh,
    gap: opts.gap ?? GAP.para,
    node: (
      <p className={`m-0 font-Libre text-[var(--ink)] ${opts.card ? "text-[14px]" : "text-[15px]"} ${opts.dropcap ? "dropcap-p" : ""} ${opts.className ?? ""}`} style={{ lineHeight: `${lh}px`, hyphens: "auto", textAlign: "justify" }}>
        {text}
      </p>
    ),
  });
}

/** Vertical list: one item per entry, so long lists flow on to the next page. */
export function list<T>(f: Flow, key: string, rows: T[], render: (row: T, i: number) => ReactNode, cont?: Item, rowKey?: (row: T, i: number) => string) {
  const group = `${f.sec}-${key}-list`;
  rows.forEach((r, i) =>
    f.add({
      key: `${group}-${rowKey ? rowKey(r, i) : i}`,
      group,
      cont,
      node: <div className={`py-[7px] ${i < rows.length - 1 ? "border-b border-dotted border-[var(--rule)]" : ""}`}>{render(r, i)}</div>,
    }),
  );
}

/** Horizontal bar chart, one item per bar; bars are halftone tints. */
export function bars(f: Flow, key: string, rows: { name: string; count: number }[], label: (name: string) => ReactNode = (n) => n, cont?: Item) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  const group = `${f.sec}-${key}-bars`;
  rows.forEach((r, i) =>
    f.add({
      key: `${group}-${i}`,
      group,
      cont,
      gap: i === 0 ? 6 : 0,
      node: (
        <div className="grid items-center gap-2 py-[3px]" style={{ gridTemplateColumns: "minmax(80px, 40%) 1fr 34px" }}>
          <span className="font-Libre text-[13px] leading-[18px] truncate" title={r.name}>
            {label(r.name)}
          </span>
          <span className="h-[11px] border border-[var(--rule-light)]">
            <span className="tint-bar block h-full" style={{ width: `${Math.max(3, (r.count / top) * 100)}%` }} />
          </span>
          <span className="font-Libre font-bold text-[13px] leading-[18px] text-right">{r.count}</span>
        </div>
      ),
    }),
  );
}

export interface Col<T> {
  h: string;
  /** Fixed width in px; omit for the flexible column. */
  w?: number;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Drop the column when the content is narrower than this. */
  min?: number;
}

/** Table as a header item plus one item per row (CSS grid, so rows align and can break between pages). */
export function table<T>(f: Flow, key: string, cols: Col<T>[], rows: T[], rowKey: (row: T) => string) {
  const shown = cols.filter((c) => !c.min || f.cw >= c.min);
  const tpl = shown.map((c) => (c.w ? `${c.w}px` : "minmax(0,1fr)")).join(" ");
  const group = `${f.sec}-${key}-table`;
  const head: Item = {
    key: `${group}-head`,
    sec: f.sec,
    node: (
      <div className="tbl-head" style={{ gridTemplateColumns: tpl }}>
        {shown.map((c) => (
          <span key={c.h} style={{ textAlign: c.align }}>
            {c.h}
          </span>
        ))}
      </div>
    ),
  };
  f.add({ ...head, keep: true, gap: 4 });
  rows.forEach((r) =>
    f.add({
      key: `${group}-${rowKey(r)}`,
      group,
      cont: head,
      node: (
        <div className="tbl-row" style={{ gridTemplateColumns: tpl }}>
          {shown.map((c) => (
            <div key={c.h} className="min-w-0" style={{ textAlign: c.align }}>
              {c.cell(r)}
            </div>
          ))}
        </div>
      ),
    }),
  );
}

/** Photo that drops out if it fails to load. */
export function Photo({ src, alt = "", h, caption }: { src: string; alt?: string; h: number; caption?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div style={{ height: h + (caption ? 20 : 0) }} />;
  return (
    <figure className="m-0">
      <div className="photo-frame" style={{ height: h }}>
        <img src={src} alt={alt} loading="eager" decoding="async" referrerPolicy="no-referrer" className="ht-photo block w-full h-full object-cover" onError={() => setFailed(true)} />
      </div>
      {caption && <figcaption className="meta italic mt-1 h-[16px] leading-[16px] truncate">{caption}</figcaption>}
    </figure>
  );
}

export function image(f: Flow, key: string, src: string, alt: string | undefined, caption: string | undefined, size: { min: number; pref: number; max: number }, gap = 10) {
  f.add({
    key: `${f.sec}-${key}`,
    gap,
    keep: false,
    img: { ...size, render: (h) => <Photo src={src} alt={alt} h={h} caption={caption} /> },
    node: null,
  });
}

export function Byline({ story, now }: { story: Story; now: number }) {
  return (
    <p className="meta m-0">
      {story.author && <span className="italic font-Libre text-[12.5px] text-[var(--ink-2)]">By {story.author} · </span>}
      <span className="font-bold uppercase tracking-[0.06em] text-[10.5px] text-[var(--ink-2)]">{story.source}</span> · {ago(story.published, now)}
    </p>
  );
}

/**
 * Story card: headline + byline stay together; the first paragraph may split;
 * tags and "also reported by" close it, then a thin rule.
 */
export function card(f: Flow, s: Story, opts: { size?: "lg" | "md" | "sm"; image?: boolean; words?: number; first?: boolean } = {}) {
  const size = opts.size ?? "sm";
  const hcls = size === "lg" ? "text-[24px] leading-[1.16]" : size === "md" ? "text-[19px] leading-[1.22]" : "text-[16.5px] leading-[1.26]";
  const k = `card-${s.id}`;
  if (!opts.first) f.add({ key: `${f.sec}-${k}-rule`, gap: GAP.card, dropAtTop: true, node: <div className="border-t border-[var(--rule-light)]" /> });
  f.add({
    key: `${f.sec}-${k}-head`,
    gap: opts.first ? 10 : GAP.card,
    keep: true,
    node: (
      <div>
        <h4 className={`font-Libre font-bold m-0 mb-1 ${hcls}`} style={{ textWrap: "pretty" }}>
          <ExtLink href={s.link}>{s.title}</ExtLink>
        </h4>
        <Byline story={s} now={f.now} />
      </div>
    ),
  });
  if (opts.image && s.image) image(f, `${k}-img`, s.image.src, s.image.alt, undefined, { min: 140, pref: 190, max: 260 }, 8);
  const body = s.body[0];
  if (body) para(f, `${k}-body`, clip(body, opts.words ?? (size === "sm" ? 300 : 520)), { card: true, gap: 6 });
  const hasTags = (s.cves?.length ?? 0) + (s.techniques?.length ?? 0) + (s.actors?.length ?? 0) > 0;
  if (hasTags || s.alsoReportedBy?.length)
    f.add({
      key: `${f.sec}-${k}-tags`,
      gap: 4,
      node: (
        <div>
          <AlsoReported story={s} />
          <StoryTags story={s} />
        </div>
      ),
    });
}

/** Compact headline line for dense lists. */
export function StoryLine({ story, now }: { story: Story; now: number }) {
  return (
    <>
      <ExtLink href={story.link} className="font-Libre font-bold text-[14.5px] leading-[1.35]">
        {story.title}
      </ExtLink>
      <div className="meta mt-0.5">
        {story.source} · {ago(story.published, now)}
      </div>
    </>
  );
}

export { Badge };
