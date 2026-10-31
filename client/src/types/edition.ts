// Shared data contract between the fetcher (../../fetcher) and the client.
// The fetcher writes an `Edition` to client/public/data/edition.json.

export type SectionKey = "ransomware" | "zeroday" | "breaches" | "vulns" | "actors" | "policy" | "general";
export type SourceKind = "news" | "research" | "gov" | "advisory";

export interface StoryImage {
  src: string;
  alt?: string;
}

export interface Story {
  id: string;
  title: string;
  link: string;
  source: string; // outlet display name
  domain: string;
  author?: string;
  published: string; // ISO
  /** Plain-text paragraphs (HTML stripped). */
  body: string[];
  image?: StoryImage;
  section: SectionKey;
  tags: SectionKey[];
  alsoReportedBy?: { source: string; link: string }[];
  cves?: string[];
  /** ATT&CK technique IDs cited in the item (e.g. "T1059.001"). */
  techniques?: string[];
  /** Tracked threat actors named in the item (display names). */
  actors?: string[];
}

// ── Vulnerabilities & patches ──────────────────────────────────────────
export interface Cvss {
  score: number;
  severity: string;
  version: string;
}
export interface Epss {
  score: number; // probability 0–1 of exploitation in the next 30 days
  percentile: number;
}

export interface KevEntry {
  cve: string;
  vendor: string;
  product: string;
  name: string;
  description: string;
  dateAdded: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  ransomware: boolean;
  cwes: string[];
  cvss?: Cvss;
  ssvc?: { exploitation?: string; automatable?: string; technicalImpact?: string };
  epss?: Epss;
}

export interface KevDesk {
  entries: KevEntry[]; // newest first
  catalogCount: number;
  catalogVersion: string;
  addedLast7d: number;
  addedLast30d: number;
  ransomwareLinkedLast30d: number;
}

export interface NvdCve {
  cve: string;
  published: string;
  description: string;
  cvss?: Cvss;
  epss?: Epss;
  cwes: string[];
  vendorProducts: string[]; // from CPEs, "vendor product"
  kev: boolean;
}

export interface Advisory {
  id: string;
  vendor: string; // "Cisco", "Palo Alto Networks", …
  title: string;
  link: string;
  published: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  cves: string[];
  summary?: string;
}

export interface PatchTuesday {
  id: string; // "2026-Oct"
  title: string;
  released: string;
  total: number;
  critical: number;
  exploited: { cve: string; title: string }[];
  publiclyDisclosed: { cve: string; title: string }[];
  moreLikely: number; // "Exploitation More Likely"
  byImpact: { impact: string; count: number }[];
  topCritical: { cve: string; title: string; cvss?: number }[];
  url: string;
}

export interface Ghsa {
  id: string;
  cve?: string;
  summary: string;
  ecosystems: string[];
  packages: string[];
  cvss?: number;
  published: string;
  link: string;
}

// ── Detection ──────────────────────────────────────────────────────────
export interface SigmaRule {
  title: string;
  level?: string;
  status?: string;
  logsource: string; // "windows / process_creation"
  techniques: string[];
  description?: string;
  link: string;
  folder: string; // rules | rules-emerging-threats | rules-threat-hunting
}

export interface DetectionRelease {
  repo: string; // "elastic/detection-rules"
  label: string; // "Elastic detection rules"
  name: string;
  link: string;
  published: string;
  summary?: string;
}

export interface TechniqueMention {
  id: string;
  name: string;
  tactics: string[];
  mentions: number;
  sources: number;
  url: string;
}

export interface TechniqueDetail {
  id: string;
  name: string;
  tactics: string[];
  platforms: string[];
  url: string;
  description: string;
  detection: { name: string; analytics: { platforms: string[]; text: string; logSources: string[] }[] }[];
  mitigations: string[];
  groups: number;
  why: string; // why it was picked
}

// ── IOC wire ───────────────────────────────────────────────────────────
export interface Ioc {
  value: string; // defanged
  type: string; // ip:port | domain | url | md5_hash | sha256_hash
  threat: string;
  malware: string;
  confidence?: number;
  firstSeen: string;
  reference?: string;
}

export interface IocWire {
  /** null when the source needs a key that isn't configured. */
  threatfox: { families: { name: string; count: number; types: string[] }[]; total: number; samples: Ioc[] } | null;
  urlhaus: { total: number; online: number; threats: { name: string; count: number }[]; tags: { name: string; count: number }[]; samples: Ioc[] } | null;
  feodo: { online: number; byMalware: { name: string; count: number }[]; samples: Ioc[] } | null;
  missingKey: boolean;
}

// ── Ransomware ─────────────────────────────────────────────────────────
export interface Victim {
  name: string;
  group: string;
  date: string;
  country?: string;
  sector?: string;
  link?: string;
}

export interface RansomwareDesk {
  victims: Victim[]; // newest first
  windowDays: number;
  total: number;
  byGroup: { name: string; count: number }[];
  bySector: { name: string; count: number }[];
  byCountry: { name: string; count: number }[];
  mode: "pro" | "free";
}

// ── Actors, community, signals ─────────────────────────────────────────
export type ActivityLevel = "high" | "moderate" | "low" | "dormant";

export interface ActorRow {
  id: string;
  name: string;
  aliases: string[];
  attribution: string;
  category: string;
  mentions: number;
  outlets: number;
  activity: ActivityLevel;
  lastSeen?: string;
  latestHeadline?: { title: string; link: string; source: string };
}

export interface ActorDesk {
  rows: ActorRow[];
  tracked: number;
  windowDays: number;
  historyDays: number;
}

export interface CommunityPost {
  id: string;
  platform: "hn" | "reddit";
  community: string;
  title: string;
  link: string;
  discussion: string;
  domain?: string;
  author?: string;
  points: number | null;
  comments: number | null;
  created: string;
  text?: string;
  flair?: string;
}

export type Trend = "new" | "rising" | "steady" | "cooling" | "unknown";

export interface TopicRow {
  id: string;
  label: string;
  kind: "topic" | "cve" | "actor";
  mentions: number;
  previous: number | null;
  trend: Trend;
  points: number;
  comments: number;
  bySource: { news: number; hn: number; reddit: number };
  top?: { title: string; link: string; source: string };
}

export interface IscStatus {
  infocon: string | null; // green | yellow | orange | red
  topPorts: { port: number; records: number; targets?: number; sources?: number }[];
}

export interface SourceStatus {
  name: string;
  url: string;
  kind: SourceKind | "api" | "community";
  ok: boolean;
  items: number;
  error?: string;
}

export interface Edition {
  version: 2;
  generatedAt: string;
  front: { lead: Story | null; top: Story[] };
  /** Things to act on this shift. */
  actNow: { kev: KevEntry[]; exploited: Story[]; criticalAdvisories: Advisory[] };
  vulns: {
    kev: KevDesk | null;
    nvd: NvdCve[];
    nvdWindowHours: number;
    advisories: Advisory[];
    patchTuesday: PatchTuesday | null;
    ghsa: Ghsa[];
    stories: Story[];
  };
  detection: {
    sigma: SigmaRule[];
    sigmaWindowDays: number;
    releases: DetectionRelease[];
    techniques: TechniqueMention[];
    techniqueOfWeek: TechniqueDetail | null;
    attackVersion: string;
  };
  iocs: IocWire;
  ransomware: { desk: RansomwareDesk | null; stories: Story[] };
  threats: { actors: ActorDesk; stories: Story[] };
  briefs: { breaches: Story[]; policy: Story[]; zeroday: Story[]; general: Story[] };
  community: { hn: CommunityPost[]; reddit: CommunityPost[]; topics: TopicRow[]; topicHistoryHours: number; isc: IscStatus; diaries: Story[] };
  sources: SourceStatus[];
  stats: { stories: number; outlets: number; sourcesOk: number; sourcesTotal: number };
}
