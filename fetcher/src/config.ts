import type { SourceKind } from "../../client/src/types/edition.ts";

export interface FeedConfig {
  name: string;
  url: string;
  kind: SourceKind;
  /** Editorial weight used when ranking the front page (1 = normal). */
  weight: number;
}

// Feed URLs checked October 2026. A feed that fails is skipped and
// reported in edition.sources; it never breaks the build.
export const FEEDS: FeedConfig[] = [
  // ── News desks ──────────────────────────────────────────────────────
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", kind: "news", weight: 1.15 },
  { name: "The Record", url: "https://therecord.media/feed", kind: "news", weight: 1.15 },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", kind: "news", weight: 1 },
  { name: "SecurityWeek", url: "https://www.securityweek.com/feed/", kind: "news", weight: 1 },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", kind: "news", weight: 1 },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", kind: "news", weight: 1.2 },
  { name: "Help Net Security", url: "https://www.helpnetsecurity.com/feed/", kind: "news", weight: 0.9 },
  { name: "Infosecurity Magazine", url: "https://www.infosecurity-magazine.com/rss/news/", kind: "news", weight: 0.95 },
  { name: "The Register", url: "https://www.theregister.com/security/headlines.atom", kind: "news", weight: 1 },
  { name: "CyberScoop", url: "https://cyberscoop.com/feed/", kind: "news", weight: 1 },
  { name: "DataBreaches.net", url: "https://databreaches.net/feed/", kind: "news", weight: 0.9 },

  // ── Research & threat intelligence ──────────────────────────────────
  { name: "Cisco Talos", url: "https://blog.talosintelligence.com/rss/", kind: "research", weight: 1 },
  { name: "Unit 42", url: "https://unit42.paloaltonetworks.com/feed/", kind: "research", weight: 1 },
  { name: "Microsoft Security", url: "https://www.microsoft.com/en-us/security/blog/feed/", kind: "research", weight: 1 },
  { name: "Google Threat Intelligence", url: "https://feeds.feedburner.com/threatintelligence/pvexyqv7v0v", kind: "research", weight: 1.1 },
  { name: "ESET WeLiveSecurity", url: "https://www.welivesecurity.com/en/rss/feed/", kind: "research", weight: 1 },
  { name: "Securelist", url: "https://securelist.com/feed/", kind: "research", weight: 1 },
  { name: "Check Point Research", url: "https://research.checkpoint.com/feed/", kind: "research", weight: 1 },
  { name: "SentinelLabs", url: "https://www.sentinelone.com/labs/feed/", kind: "research", weight: 1 },
  { name: "Project Zero", url: "https://googleprojectzero.blogspot.com/feeds/posts/default", kind: "research", weight: 1.1 },

  // ── Government ──────────────────────────────────────────────────────
  { name: "CISA", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", kind: "gov", weight: 1 },
];

/** SANS ISC handler diaries — shown in the Briefs section rather than ranked as news. */
export const ISC_DIARY_FEED: FeedConfig = { name: "SANS ISC", url: "https://isc.sans.edu/rssfeed_full.xml", kind: "research", weight: 0.9 };

/**
 * Vendor security advisories (PSIRT feeds). Rendered on the Vulnerabilities page,
 * not mixed into news. `vendor` is the display name.
 */
export const ADVISORY_FEEDS: { vendor: string; url: string }[] = [
  { vendor: "Cisco", url: "https://sec.cloudapps.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml" },
  { vendor: "Palo Alto Networks", url: "https://security.paloaltonetworks.com/rss.xml" },
  { vendor: "Fortinet", url: "https://filestore.fortinet.com/fortiguard/rss/ir.xml" },
  { vendor: "CISA ICS", url: "https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml" },
  { vendor: "Google Chrome", url: "https://chromereleases.googleblog.com/feeds/posts/default" },
];

// ── Keys (all optional; a missing key hides that box and is reported in the wire report)
export const KEYS = {
  /** abuse.ch Auth-Key — free at https://auth.abuse.ch/ — ThreatFox, URLhaus (and Feodo if gated). */
  abusech: process.env.ABUSECH_AUTH_KEY?.trim() || "",
  /** ransomware.live PRO key — free at https://my.ransomware.live/ — without it the keyless v2 API is used. */
  ransomwareLive: process.env.RANSOMWARE_LIVE_KEY?.trim() || "",
  /** NVD API key — free at https://nvd.nist.gov/developers/request-an-api-key — only raises rate limits. */
  nvd: process.env.NVD_API_KEY?.trim() || "",
  /** GitHub token — provided automatically in Actions; locally optional (60 req/h without). */
  github: (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim(),
};

export const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";
export const NVD_WINDOW_HOURS = 48;
export const MSRC_API = "https://api.msrc.microsoft.com/cvrf/v3.0";
export const ISC_API = "https://isc.sans.edu/api";
export const THREATFOX_API = "https://threatfox-api.abuse.ch/api/v1/";
export const URLHAUS_RECENT = "https://urlhaus-api.abuse.ch/v1/urls/recent/limit/1000/";
export const FEODO_BLOCKLIST = "https://feodotracker.abuse.ch/downloads/ipblocklist.json";
export const RANSOMWARE_LIVE_FREE = "https://api.ransomware.live/v2/recentvictims";
export const RANSOMWARE_LIVE_PRO = "https://api-pro.ransomware.live/victims/recent";
export const RANSOMWARE_WINDOW_DAYS = 7;
export const GITHUB_API = "https://api.github.com";
export const GITHUB_RAW = "https://raw.githubusercontent.com";

/** Detection-content repos whose releases are listed on the Detection Desk. */
export const DETECTION_REPOS = [
  { repo: "SigmaHQ/sigma", label: "Sigma rules" },
  { repo: "elastic/detection-rules", label: "Elastic detection rules" },
  { repo: "splunk/security_content", label: "Splunk Security Content" },
  { repo: "redcanaryco/atomic-red-team", label: "Atomic Red Team tests" },
  { repo: "mandiant/capa-rules", label: "capa rules" },
  { repo: "Yamato-Security/hayabusa-rules", label: "Hayabusa rules" },
];
export const SIGMA_REPO = "SigmaHQ/sigma";
export const SIGMA_FOLDERS = ["rules", "rules-emerging-threats", "rules-threat-hunting"];
export const SIGMA_WINDOW_DAYS = 7;
export const SIGMA_MAX_RULES = 24;

// CISA KEV: primary is cisa.gov, the GitHub mirror (cisagov/kev-data) is the fallback.
export const KEV_URLS = [
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
  "https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json",
];
// CVE JSON 5 records (CNA CVSS + CISA ADP "Vulnrichment" SSVC) from the CVE Program repo.
export const CVELIST_RAW = "https://raw.githubusercontent.com/CVEProject/cvelistV5/main/cves";
export const EPSS_API = "https://api.first.org/data/v1/epss";
export const KEV_DESK_ROWS = 12;

export const HN_API = "https://hn.algolia.com/api/v1/search_by_date";
export const HN_QUERIES = [
  "security", "vulnerability", "exploit", "breach", "malware", "ransomware",
  "hacked", "CVE", "zero-day", "phishing", "backdoor", "privacy", "spyware",
];
export const HN_MIN_POINTS = 15;
export const HN_WINDOW_HOURS = 48;

export const SUBREDDITS = ["netsec", "cybersecurity", "blueteamsec", "AskNetsec", "Malware", "ReverseEngineering"];

export const USER_AGENT =
  "Mozilla/5.0 (compatible; TheTimesOfCyber/1.0; +https://github.com/Maw1z/The-Times-Of-Cyber)";

export const NEWS_WINDOW_HOURS = 72; // preferred window for section pages
export const NEWS_MAX_AGE_HOURS = 24 * 7; // hard cut-off
export const ARCHIVE_DAYS = 30;
export const ACTOR_WINDOW_DAYS = 30;
export const OG_IMAGE_LOOKUPS = 16; // max article pages fetched to find a lead image

/** How many stories each page tries to carry (layouts clip what doesn't fit). */
export const TARGETS = {
  frontTop: 6,
  section: 12,
};
