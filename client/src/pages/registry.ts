/** Section order, codes and labels — shared by the front-page index, running heads and the page indicator. */
export const PAGES = [
  { id: "a1", code: "A1", title: "Front Page", short: "Front", role: "The shift briefing: what to act on now, the lead story and the day's numbers." },
  { id: "a2", code: "A2", title: "Vulnerabilities & Patches", short: "Vulns", role: "What to patch first: exploited bugs, Patch Tuesday, vendor advisories, new critical CVEs." },
  { id: "a3", code: "A3", title: "Detection Desk", short: "Detection", role: "What to detect and hunt: a technique explained, new Sigma rules, ATT&CK in the news." },
  { id: "a4", code: "A4", title: "IOC Wire", short: "IOCs", role: "What to block or hunt for: fresh, defanged indicators from abuse.ch." },
  { id: "a5", code: "A5", title: "Ransomware Tracker", short: "Ransomware", role: "Who is being hit: leak-site victims by group, sector and country." },
  { id: "a6", code: "A6", title: "Threat Actors & Campaigns", short: "Actors", role: "Who is active: named groups ranked by mentions, and research on their campaigns." },
  { id: "a7", code: "A7", title: "Briefs & Community", short: "Briefs", role: "Everything else: breaches, policy, what practitioners discuss, and source health." },
] as const;

export type SectionId = (typeof PAGES)[number]["id"];

export function section(id: SectionId) {
  return PAGES.find((x) => x.id === id)!;
}

export function folio(id: SectionId): string {
  const p = section(id);
  return `${p.code} · ${p.title}`;
}
