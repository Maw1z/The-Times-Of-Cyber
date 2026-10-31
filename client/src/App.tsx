import { useState, type ReactNode } from "react";
import { HalftoneDefs } from "./halftone/HalftoneDefs";
import { useEdition } from "./lib/useEdition";
import { Paper } from "./book/Paper";

function readParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

/** Photo screen pitch: a halftone dot needs ~7 device pixels to render cleanly. */
function screenCell(): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.max(2.4, Math.round((7 / dpr) * 10) / 10);
}

export default function App() {
  const state = useEdition();
  const plain = readParam("halftone") === "off";
  const [cell] = useState(screenCell);

  return (
    <div className={plain ? "plain" : ""}>
      <HalftoneDefs cell={cell} />
      {state.status === "loading" && <Notice title="Setting type…">Loading today's edition.</Notice>}
      {state.status === "missing" && (
        <Notice title="No edition has been printed yet">
          Run <code>npm run fetch</code> in <code>client/</code> (or <code>fetcher/</code>) to build <code>public/data/edition.json</code> from the live feeds, then reload. For an
          offline layout test use <code>npm run fetch:fixtures</code>.
        </Notice>
      )}
      {state.status === "error" && <Notice title="The presses jammed">{state.message}</Notice>}
      {state.status === "ready" && <Paper edition={state.edition} />}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="paper mx-auto mt-10 w-[calc(100%-24px)] max-w-[760px] px-8 py-14 text-center shadow-lg">
      <h2 className="ink-display font-Libre font-bold text-[30px] m-0 mb-3">{title}</h2>
      <p className="font-Libre text-[15px] leading-[1.6] text-[var(--ink-2)] m-0 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-black/5 [&_code]:px-1">{children}</p>
    </div>
  );
}
