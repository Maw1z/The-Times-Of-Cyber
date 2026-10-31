import type { Edition } from "../types/edition";
import { folio } from "../pages/registry";
import { longDate } from "../lib/format";
import { natural } from "./flow";
import { justify, type PageData, type Placed } from "./paginate";

/** Page furniture in logical px (before scaling to the screen). */
export const PAD = { x: 30, top: 22, bottom: 14, head: 38, foot: 26 };
/** Longest comfortable line; wider pages get wider margins instead. */
const MAX_CW = 660;

/** Logical page geometry: pages are laid out at w × h, then scaled to the screen. */
export interface Geom {
  w: number;
  h: number;
  padX: number;
  cw: number;
  capFor: (page: number) => number;
}

export function geom(w: number, h: number): Geom {
  const padX = Math.max(PAD.x, Math.round((w - MAX_CW) / 2));
  return { w, h, padX, cw: w - 2 * padX, capFor: (i) => h - PAD.top - PAD.bottom - PAD.foot - (i === 0 ? 0 : PAD.head) };
}

export function PlacedView({ p, extra = 0, imgH }: { p: Placed; extra?: number; imgH?: number }) {
  let content;
  if (p.clip != null)
    content = (
      <div style={{ height: p.clip, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${-(p.y0 ?? 0)}px)` }}>{natural(p.it)}</div>
      </div>
    );
  else if (p.it.img) content = p.it.img.render(imgH ?? p.imgH ?? p.it.img.pref);
  else content = p.it.node;
  return (
    <div className="fi" style={{ paddingTop: p.gap + extra }}>
      {content}
    </div>
  );
}

/** One printed page: running head, the placed items, folio line. */
export function PageView({ page, index, total, edition, g, scale, side }: { page: PageData; index: number; total: number; edition: Edition; g: Geom; scale: number; side: "left" | "right" | "single" }) {
  const { extraGap, imgH } = justify(page, index === total - 1);
  const num = index + 1;
  return (
    <div className="page-inner paper" style={{ width: g.w, height: g.h, transform: `scale(${scale})` }}>
      <div className={`gutter gutter-${side}`} aria-hidden="true" />
      <div style={{ padding: `${PAD.top}px ${g.padX}px 0` }}>
        {index > 0 && (
          <div className="running-head" style={{ height: PAD.head - 9, marginBottom: 9 }}>
            <span className={side === "left" ? "order-1" : "order-3 text-right"}>{folio(page.sec)}</span>
            <span className="order-2 font-Aktura text-[15px] normal-case tracking-normal text-[var(--ink)]">The Times of Cyber</span>
            <span className={side === "left" ? "order-3 text-right" : "order-1"}>{longDate(edition.generatedAt)}</span>
          </div>
        )}
        <div style={{ height: page.cap, overflow: "hidden" }}>
          {page.items.map((p, k) => (
            <PlacedView key={`${p.it.key}@${p.y0 ?? 0}`} p={p} extra={extraGap[k]} imgH={imgH[k]} />
          ))}
        </div>
        <div className="page-foot" style={{ height: PAD.foot }}>
          <span className={side === "left" ? "order-1" : "order-3 text-right"}>
            <strong>{num}</strong>
          </span>
          <span className="order-2">The Times of Cyber</span>
          <span className={side === "left" ? "order-3 text-right" : "order-1"}>
            {num < total ? "" : "End of edition"}
          </span>
        </div>
      </div>
    </div>
  );
}
