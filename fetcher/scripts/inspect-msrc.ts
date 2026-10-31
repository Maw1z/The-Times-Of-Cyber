/**
 * Diagnostic: prints how Microsoft's latest monthly CVRF document is structured, so the
 * Patch Tuesday filter can be tuned. Run: npx tsx scripts/inspect-msrc.ts
 */
export {};

const API = "https://api.msrc.microsoft.com/cvrf/v3.0";
const headers = { Accept: "application/json" };

type V = {
  CVE: string;
  Title?: { Value?: string };
  Notes?: { Title?: string; Type?: unknown; Value?: string }[];
  Threats?: { Type?: unknown; Description?: { Value?: string } }[];
  RevisionHistory?: { Date?: string; Number?: string; Description?: { Value?: string } }[];
  CVSSScoreSets?: unknown[];
};

const count = (xs: string[], n = 8) =>
  [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, n);

const list = (await (await fetch(`${API}/updates`, { headers })).json()) as { value: { ID: string; InitialReleaseDate: string; CvrfUrl: string }[] };
const latest = list.value.filter((u) => /^\d{4}-[A-Za-z]{3}$/.test(u.ID) && Date.parse(u.InitialReleaseDate) <= Date.now()).sort((a, b) => b.InitialReleaseDate.localeCompare(a.InitialReleaseDate))[0];
const doc = (await (await fetch(latest.CvrfUrl, { headers })).json()) as { Vulnerability: V[] };
const vs = doc.Vulnerability;
console.log(`doc ${latest.ID} released ${latest.InitialReleaseDate} — ${vs.length} vulnerabilities`);
console.log("note types (type → count):", count(vs.flatMap((v) => (v.Notes ?? []).map((n) => `${String(n.Type)}:${n.Title ?? ""}`)), 14));
console.log("CNA-like values (notes typed 8 or titled 'Issuing CNA'):", count(vs.flatMap((v) => (v.Notes ?? []).filter((n) => String(n.Type) === "8" || /cna/i.test(n.Title ?? "")).map((n) => n.Value ?? "?"))));
console.log("tag values (type 7):", count(vs.flatMap((v) => (v.Notes ?? []).filter((n) => String(n.Type) === "7").map((n) => n.Value ?? "?")), 10));
console.log("threat types:", count(vs.flatMap((v) => (v.Threats ?? []).map((t) => String(t.Type)))));
console.log("severity values (threat type 3):", count(vs.flatMap((v) => (v.Threats ?? []).filter((t) => String(t.Type) === "3").map((t) => t.Description?.Value ?? "?"))));
console.log("first revision day:", count(vs.map((v) => (v.RevisionHistory?.map((r) => r.Date ?? "").sort()[0] ?? "none").slice(0, 10)), 10));
console.log("revision numbers:", count(vs.map((v) => v.RevisionHistory?.map((r) => r.Number ?? "?").join(",") ?? "none")));
console.log("titles ending in 'Vulnerability':", vs.filter((v) => /Vulnerability$/.test(v.Title?.Value ?? "")).length);
console.log("with CVSS:", vs.filter((v) => (v.CVSSScoreSets ?? []).length).length);
const sample = vs.find((v) => !/Vulnerability$/.test(v.Title?.Value ?? "")) ?? vs[0];
console.log("sample non-MS-looking entry:", JSON.stringify({ CVE: sample.CVE, Title: sample.Title, Notes: sample.Notes?.map((n) => ({ ...n, Value: n.Value?.slice(0, 60) })), RevisionHistory: sample.RevisionHistory?.slice(0, 2) }, null, 1).slice(0, 1200));
