import { ISC_API } from "./config.ts";
import { errMsg, fetchJson } from "./http.ts";
import type { IscStatus, SourceStatus } from "../../client/src/types/edition.ts";

/** SANS Internet Storm Center: InfoCon level and most-attacked ports (DShield sensors). */
export async function fetchIsc(): Promise<{ isc: IscStatus; status: SourceStatus }> {
  const isc: IscStatus = { infocon: null, topPorts: [] };
  const errors: string[] = [];
  try {
    const r = await fetchJson<{ status?: string }>(`${ISC_API}/infocon?json`);
    isc.infocon = r.status?.toLowerCase() ?? null;
  } catch (err) {
    errors.push(`infocon: ${errMsg(err)}`);
  }
  try {
    const r = await fetchJson<Record<string, unknown> | unknown[]>(`${ISC_API}/topports/records/10?json`);
    const rows = (Array.isArray(r) ? r : Object.values(r)).filter(
      (x): x is Record<string, unknown> => !!x && typeof x === "object" && "targetport" in (x as object),
    );
    isc.topPorts = rows
      .map((x) => ({
        port: Number(x.targetport),
        records: Number(x.records ?? 0),
        targets: x.targets != null ? Number(x.targets) : undefined,
        sources: x.sources != null ? Number(x.sources) : undefined,
      }))
      .filter((x) => Number.isFinite(x.port))
      .slice(0, 10);
  } catch (err) {
    errors.push(`topports: ${errMsg(err)}`);
  }
  const ok = isc.infocon !== null || isc.topPorts.length > 0;
  return { isc, status: { name: "SANS ISC (DShield)", url: ISC_API, kind: "api", ok, items: isc.topPorts.length, error: errors.length ? errors.join(" | ").slice(0, 160) : undefined } };
}
