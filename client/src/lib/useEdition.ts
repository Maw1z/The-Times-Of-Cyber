import { useEffect, useState } from "react";
import type { Edition } from "../types/edition";

export type EditionState =
  | { status: "loading" }
  | { status: "missing" } // no edition.json published yet
  | { status: "error"; message: string }
  | { status: "ready"; edition: Edition };

export function useEdition(): EditionState {
  const [state, setState] = useState<EditionState>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    // Cache-bust per 10 minutes so a freshly deployed edition shows up promptly.
    const bucket = Math.floor(Date.now() / 600_000);
    fetch(`${import.meta.env.BASE_URL}data/edition.json?v=${bucket}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 404) return setState({ status: "missing" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get("content-type") ?? "";
        // Vite's dev server answers unknown paths with index.html
        if (!type.includes("json")) return setState({ status: "missing" });
        const edition = (await res.json()) as Edition;
        if (edition.version !== 2) throw new Error(`This edition was built by an older fetcher (v${String(edition.version)}) — run npm run fetch again.`);
        setState({ status: "ready", edition });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
