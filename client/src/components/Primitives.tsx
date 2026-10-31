import type { ReactNode } from "react";
import type { Edition } from "../types/edition";
import { longDate, timeUTC } from "../lib/format";

/**
 * One section of the paper: a sheet with a running head, a letterpress banner and
 * a deck line. Sheets grow with their content — nothing is clipped.
 */
export function Sheet({
  id,
  folio,
  title,
  deck,
  edition,
  children,
}: {
  id: string;
  folio: string;
  title: string;
  deck?: ReactNode;
  edition: Edition;
  children: ReactNode;
}) {
  return (
    <section id={id} className="sheet w-full max-w-[1240px] px-5 py-6 sm:px-10 sm:py-9" style={{ scrollMarginTop: 60 }}>
      <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-1.5">
        <span className="kicker">{folio}</span>
        <span className="font-Aktura text-[22px] leading-none hidden sm:block">The Times of Cyber</span>
        <span className="kicker text-right">{longDate(edition.generatedAt)}</span>
      </div>
      <h2
        className="ink-display font-Libre font-bold uppercase text-center leading-[1.02] tracking-[-0.01em] mt-4 mb-1.5 [overflow-wrap:anywhere]"
        style={{ fontSize: "clamp(24px, 6.8vw, 52px)" }}
      >
        {title}
      </h2>
      {deck && <p className="text-center font-Libre font-bold uppercase tracking-[0.06em] text-[12px] sm:text-[13px] text-[var(--ink-2)] m-0 mb-4">{deck}</p>}
      <div className="rule-double pt-6">{children}</div>
      <div className="mt-8 border-t-2 border-[var(--ink)] pt-1.5 flex justify-between meta">
        <span>The Times of Cyber · {folio}</span>
        <span>Compiled {timeUTC(edition.generatedAt)} · links go to the original reporting</span>
      </div>
    </section>
  );
}

/** Titled panel within a sheet. */
export function Box({ title, right, children, className = "", note }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string; note?: ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-[var(--ink)] pb-1 mb-3">
        <h3 className="m-0 font-[family-name:var(--font-label)] text-[12.5px] font-bold uppercase tracking-[0.12em]">{title}</h3>
        {right && <span className="meta text-right">{right}</span>}
      </div>
      {children}
      {note && <p className="meta italic mt-2 mb-0">{note}</p>}
    </div>
  );
}

export type BadgeTone = "solid" | "dark" | "outline" | "faint";

const TONES: Record<BadgeTone, string> = {
  solid: "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]",
  dark: "bg-[#4a453e] text-[var(--paper)] border-[#4a453e]",
  outline: "border-[var(--ink-2)] text-[var(--ink-2)]",
  faint: "border-[var(--rule)] text-[var(--ink-3)]",
};

export function Badge({ children, tone = "solid", title }: { children: ReactNode; tone?: BadgeTone; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-block border font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.08em] leading-none px-[5px] py-[3px] mr-1 mb-0.5 whitespace-nowrap align-middle ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const SEV_TONE: Record<string, BadgeTone> = { critical: "solid", high: "dark", medium: "outline", low: "faint", info: "faint", informational: "faint" };
export function SeverityBadge({ level }: { level?: string }) {
  if (!level) return null;
  const l = level.toLowerCase();
  return <Badge tone={SEV_TONE[l] ?? "faint"}>{l === "informational" ? "info" : l}</Badge>;
}

/** Says what was checked when a box has nothing to show. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="font-Libre italic text-[14px] text-[var(--ink-3)] my-2">{children}</p>;
}

/** Horizontal bar list; the bars are halftone tints. */
export function Bars({ rows, label = (n) => n, max }: { rows: { name: string; count: number }[]; label?: (name: string) => ReactNode; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.name} className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(90px, 38%) 1fr 34px" }}>
          <span className="font-Libre text-[13.5px] truncate" title={r.name}>
            {label(r.name)}
          </span>
          <span className="h-[11px] border border-[var(--rule-light)]">
            <span className="tint-bar block h-full" style={{ width: `${Math.max(3, (r.count / top) * 100)}%` }} />
          </span>
          <span className="font-Libre font-bold text-[13.5px] text-right">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: ReactNode; sub?: ReactNode }) {
  return (
    <div className="border-b border-dotted border-[var(--rule)] py-2">
      <div className="font-Libre font-bold text-[28px] leading-none">{value}</div>
      <div className="font-Libre text-[13px] text-[var(--ink-2)] mt-1 leading-snug">{label}</div>
      {sub && <div className="meta mt-0.5">{sub}</div>}
    </div>
  );
}

export function ExtLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** CVE id linking to NVD. */
export function Cve({ id }: { id: string }) {
  return (
    <ExtLink href={`https://nvd.nist.gov/vuln/detail/${id}`} className="mono font-bold whitespace-nowrap">
      {id}
    </ExtLink>
  );
}
