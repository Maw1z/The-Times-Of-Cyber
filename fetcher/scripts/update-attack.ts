/**
 * Builds fetcher/data/attack.json — a trimmed MITRE ATT&CK Enterprise dictionary —
 * from the official STIX bundle (~55 MB). Run when ATT&CK publishes a new version:
 *
 *   npm run update:attack
 *
 * Kept per technique: name, tactics, platforms, a short description, detection
 * strategies → analytics (what to look for + log sources), mitigations, and how many
 * tracked groups use it.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json";

type Obj = Record<string, unknown> & { id: string; type: string; name?: string; description?: string };
type Ref = { source_name?: string; external_id?: string; url?: string };

const clean = (s = "") =>
  s
    .replace(/\(Citation:[^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\(https:\/\/attack\.mitre\.org[^)]*\)/g, "$1")
    .replace(/<code>|<\/code>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const firstParagraph = (s = "", max = 520) => {
  const p = clean(s.split(/\n\s*\n/)[0]);
  return p.length > max ? `${p.slice(0, p.lastIndexOf(" ", max))}…` : p;
};

const res = await fetch(SRC);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const bundle = (await res.json()) as { objects: Obj[] };
const live = bundle.objects.filter((o) => !o.revoked && !o.x_mitre_deprecated);
const byId = new Map(live.map((o) => [o.id, o]));
const rels = live.filter((o) => o.type === "relationship") as (Obj & { relationship_type: string; source_ref: string; target_ref: string })[];
const version = (bundle.objects.find((o) => o.type === "x-mitre-collection")?.x_mitre_version as string) ?? "?";

const techniques: Record<string, unknown> = {};
for (const t of live.filter((o) => o.type === "attack-pattern")) {
  const ref = (t.external_references as Ref[]).find((r) => r.source_name === "mitre-attack");
  if (!ref?.external_id) continue;
  const relsTo = rels.filter((r) => r.target_ref === t.id);
  const strategies = relsTo
    .filter((r) => r.relationship_type === "detects")
    .map((r) => byId.get(r.source_ref))
    .filter((s): s is Obj => !!s && s.type === "x-mitre-detection-strategy")
    .map((s) => ({
      name: s.name,
      analytics: ((s.x_mitre_analytic_refs as string[]) ?? [])
        .map((id) => byId.get(id))
        .filter((a): a is Obj => !!a)
        .slice(0, 4)
        .map((a) => ({
          platforms: (a.x_mitre_platforms as string[]) ?? [],
          text: firstParagraph(a.description, 360),
          logSources: (((a.x_mitre_log_source_references as { name: string; channel?: string }[]) ?? []).slice(0, 4)).map((l) =>
            l.channel && l.channel !== "None" ? `${l.name} (${l.channel})` : l.name,
          ),
        })),
    }));
  const mitigations = relsTo
    .filter((r) => r.relationship_type === "mitigates")
    .map((r) => byId.get(r.source_ref)?.name)
    .filter(Boolean)
    .slice(0, 6);
  const groups = relsTo.filter((r) => r.relationship_type === "uses" && byId.get(r.source_ref)?.type === "intrusion-set").length;
  techniques[ref.external_id] = {
    name: t.name,
    tactics: ((t.kill_chain_phases as { phase_name: string }[]) ?? []).map((k) => k.phase_name),
    platforms: (t.x_mitre_platforms as string[]) ?? [],
    url: ref.url,
    description: firstParagraph(t.description),
    detection: strategies,
    mitigations,
    groups,
  };
}

const out = join(dirname(fileURLToPath(import.meta.url)), "../data/attack.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ version, generated: new Date().toISOString().slice(0, 10), techniques }));
console.log(`ATT&CK v${version}: ${Object.keys(techniques).length} techniques → ${out}`);
