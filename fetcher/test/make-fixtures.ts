/**
 * Generates SYNTHETIC fixture responses for offline testing of the pipeline and
 * layouts (`npm run fetch:fixtures`). Every headline is prefixed "[TEST]" and every
 * outlet is the real feed slot with synthetic content, so fixture output can never
 * be mistaken for a real edition. Images are generated SVGs written to
 * client/public/data/fixtures/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FEEDS, HN_API, KEV_URLS, SUBREDDITS, CVELIST_RAW, EPSS_API, ADVISORY_FEEDS, ISC_DIARY_FEED, NVD_API, MSRC_API, GITHUB_API, GITHUB_RAW, SIGMA_REPO, DETECTION_REPOS, THREATFOX_API, URLHAUS_RECENT, FEODO_BLOCKLIST, RANSOMWARE_LIVE_FREE, ISC_API } from "../src/config.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "fixtures");
const imgDir = join(here, "../../client/public/data/fixtures");
mkdirSync(dir, { recursive: true });
mkdirSync(imgDir, { recursive: true });

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const NOW = Date.parse("2026-10-31T06:00:00Z");

const SUBJECTS = [
  "Ransomware crew claims attack on regional hospital chain",
  "Zero-day in VPN appliance exploited in the wild before patch",
  "Data breach at retailer exposes customer records",
  "State-sponsored espionage group targets telecom providers with new backdoor",
  "Vendor ships security updates for critical remote code execution flaw",
  "Infostealer campaign spreads through malicious npm packages",
  "Police takedown disrupts botnet used for DDoS attacks",
  "Researchers detail phishing kit that bypasses MFA",
  "Lazarus-linked actors pivot to cloud credential theft",
  "Patch Tuesday fixes actively exploited Windows privilege escalation bug",
  "Akira ransomware affiliates abuse SonicWall firewalls",
  "Leaked database of personal data surfaces on criminal forum",
  "Browser vendor patches Chrome zero-day exploited by spyware vendor",
  "Volt Typhoon activity observed on critical infrastructure networks",
  "Qilin ransomware gang posts stolen data from manufacturer",
  "Healthcare provider notifies patients of breach after intrusion",
  "Linux kernel flaw allows local privilege escalation, PoC published",
  "Regulators propose new incident reporting rules for operators",
  "APT28 phishing campaign impersonates government ministries",
  "Exploit released for unauthenticated RCE in file transfer software",
];
const ORGS = ["Contoso", "Fabrikam", "Northwind", "Tailspin", "Wingtip", "Litware", "Adatum", "Proseware", "Woodgrove", "Lucerne", "Margie", "Coho"];
const FILLER = [
  "This paragraph is synthetic fixture text generated to exercise the layout engine and has no factual content.",
  "It varies in length so that columns, clipping and multi-column flow can be checked against realistic copy.",
  "Fixture stories mention keywords such as ransomware, zero-day, breach, vulnerability and espionage so the classifier routes them to every section.",
  "Nothing here describes a real incident, organisation or person; replace it with a live run of npm run fetch.",
  "Additional sentences pad the body so lead stories reach several hundred words, matching what full-text feeds provide.",
  "The quick brown fox jumps over the lazy dog while the layout engine measures line breaks and hyphenation.",
];

function para(n: number) {
  return Array.from({ length: n }, () => pick(FILLER)).join(" ");
}

function svgPhoto(i: number) {
  const cx = 30 + rnd() * 40;
  const cy = 30 + rnd() * 40;
  const shapes = Array.from({ length: 6 }, () => {
    const x = rnd() * 400, y = rnd() * 260, r = 20 + rnd() * 80, g = Math.floor(rnd() * 200);
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="rgb(${g},${g},${g})" opacity="0.7"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
<defs><radialGradient id="g" cx="${cx}%" cy="${cy}%" r="80%"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#202020"/></radialGradient>
<linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="260" fill="url(#g)"/>${shapes}<rect width="400" height="260" fill="url(#l)"/>
<text x="16" y="244" font-family="sans-serif" font-size="14" fill="#fff">TEST IMAGE ${i}</text></svg>`;
}

const index: Record<string, string> = {};
let story = 0;
FEEDS.forEach((feed, fi) => {
  if (fi % 7 === 6) return; // leave a few feeds missing → exercises failure reporting
  const items = Array.from({ length: 6 }, () => {
    story++;
    // Mostly unique headlines, with an occasional verbatim repeat so clustering ("Also reported by") is exercised.
    const subject = rnd() < 0.15 ? SUBJECTS[story % 4] : `${pick(ORGS)} ${pick(SUBJECTS).split(" ").slice(0, 4 + Math.floor(rnd() * 3)).join(" ")} ${pick(["amid probe", "says researcher", "in Europe", "across Asia", "at logistics firm", "for second time", "after warning"])}`;
    const date = new Date(NOW - rnd() * 96 * 3_600_000).toUTCString();
    const hasImg = rnd() > 0.45;
    if (hasImg) writeFileSync(join(imgDir, `img${story}.svg`), svgPhoto(story));
    const body = Array.from({ length: 2 + Math.floor(rnd() * 4) }, () => `<p>${para(2 + Math.floor(rnd() * 3))}</p>`).join("");
    return `<item><title>[TEST] ${subject} (${feed.name} #${story})</title>
<link>https://example.invalid/${fi}/${story}</link><guid>t${story}</guid><pubDate>${date}</pubDate>
<dc:creator>Test Writer ${story % 9}</dc:creator>
${hasImg ? `<enclosure url="http://localhost:5173/data/fixtures/img${story}.svg" type="image/svg+xml"/>` : ""}
<description><![CDATA[<p>${para(2)}</p>]]></description>
<content:encoded><![CDATA[${body}]]></content:encoded></item>`;
  });
  const xml = `<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${feed.name} (fixture)</title>${items.join("\n")}</channel></rss>`;
  const file = `feed-${fi}.xml`;
  writeFileSync(join(dir, file), xml);
  index[feed.url] = file;
});
// KEV catalog
const vendors = [["TestVendor", "Edge Gateway"], ["Example Corp", "File Transfer Server"], ["Sample Systems", "VPN Appliance"], ["Demo Software", "Web Framework"]];
const kev = Array.from({ length: 40 }, (_, i) => {
  const [v, p] = vendors[i % vendors.length];
  const day = new Date(NOW - i * 1.3 * 86_400_000).toISOString().slice(0, 10);
  return {
    cveID: `CVE-2026-9${String(1000 + i)}`,
    vendorProject: v,
    product: p,
    vulnerabilityName: `${v} ${p} Test Vulnerability ${i}`,
    dateAdded: day,
    shortDescription: `[TEST] Synthetic KEV entry ${i}: ${p} contains a fixture vulnerability used to test table layout and wrapping across two lines.`,
    dueDate: new Date(Date.parse(day) + 21 * 86_400_000).toISOString().slice(0, 10),
    knownRansomwareCampaignUse: i % 3 === 0 ? "Known" : "Unknown",
    cwes: ["CWE-79"],
  };
});
writeFileSync(join(dir, "kev.json"), JSON.stringify({ catalogVersion: "test", count: 1500, vulnerabilities: kev.reverse() }));
index[KEV_URLS[0]] = "kev.json";
writeFileSync(
  join(dir, "cve.json"),
  JSON.stringify({ containers: { cna: { metrics: [{ cvssV3_1: { baseScore: 9.1, baseSeverity: "CRITICAL", version: "3.1" } }] }, adp: [{ metrics: [{ other: { type: "ssvc", content: { options: [{ Exploitation: "active" }, { Automatable: "yes" }, { "Technical Impact": "total" }] } } }] }] } }),
);
index[CVELIST_RAW] = "cve.json";
writeFileSync(join(dir, "epss.json"), JSON.stringify({ data: kev.map((k, i) => ({ cve: k.cveID, epss: String((i % 10) / 10 + 0.05), percentile: "0.97" })) }));
index[EPSS_API] = "epss.json";

// HN (same file for every query — dedupe handles it)
const hits = Array.from({ length: 30 }, (_, i) => ({
  objectID: String(40000000 + i),
  title: `[TEST] ${i % 5 === 0 ? "Ask HN: " : ""}${SUBJECTS[(i * 3) % SUBJECTS.length]}`,
  url: i % 5 === 0 ? null : `https://example.invalid/hn/${i}`,
  author: `tester${i}`,
  points: 600 - i * 17,
  num_comments: 300 - i * 9,
  created_at: new Date(NOW - i * 1.5 * 3_600_000).toISOString(),
  story_text: i % 5 === 0 ? `<p>${para(3)}</p>` : null,
}));
writeFileSync(join(dir, "hn.json"), JSON.stringify({ hits }));
index[HN_API] = "hn.json";

// Reddit JSON per subreddit
SUBREDDITS.forEach((sub, si) => {
  const children = Array.from({ length: 8 }, (_, i) => ({
    data: {
      id: `${si}x${i}`,
      title: `[TEST] ${SUBJECTS[(si * 5 + i) % SUBJECTS.length]}`,
      permalink: `/r/${sub}/comments/${si}x${i}/test/`,
      url: i % 2 ? `https://example.invalid/rd/${si}/${i}` : `https://www.reddit.com/r/${sub}/comments/${si}x${i}/test/`,
      score: 900 - si * 90 - i * 60,
      num_comments: 200 - i * 20,
      author: `redditor${i}`,
      created_utc: Math.floor((NOW - i * 2.5 * 3_600_000) / 1000),
      selftext: i % 2 ? "" : para(3),
      is_self: i % 2 === 0,
      domain: i % 2 ? "example.invalid" : `self.${sub}`,
      link_flair_text: i % 3 ? "Discussion" : null,
    },
  }));
  writeFileSync(join(dir, `reddit-${sub}.json`), JSON.stringify({ data: { children } }));
  index[`https://www.reddit.com/r/${sub}/top.json`] = `reddit-${sub}.json`;
});


// ── SOC sources (all synthetic, marked [TEST]) ─────────────────────────
const iso = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const put = (url: string, file: string, data: unknown) => {
  writeFileSync(join(dir, file), typeof data === "string" ? data : JSON.stringify(data));
  index[url] = file;
};

// Vendor advisories (RSS) + ISC diaries
const SEVS = ["Critical", "High", "Medium", "High", "Low"];
ADVISORY_FEEDS.forEach((f, fi) => {
  const items = Array.from({ length: 5 }, (_, i) => {
    const sev = SEVS[(i + fi) % SEVS.length];
    return `<item><title>[TEST] ${f.vendor} product ${["gateway", "firewall", "VPN", "controller", "browser"][i]} advisory ${i + 1} (Severity: ${sev.toUpperCase()})</title>
<link>https://example.invalid/adv/${fi}/${i}</link><pubDate>${new Date(NOW - (i * 19 + fi * 5) * 3_600_000).toUTCString()}</pubDate>
<description><![CDATA[<p>[TEST] Synthetic ${sev} advisory. Security Fixes: CVE-2026-8${fi}${i}01 and CVE-2026-8${fi}${i}02. CVSS v3.1 base score ${sev === "Critical" ? "9.8" : sev === "High" ? "8.1" : "5.3"}.</p>]]></description></item>`;
  });
  put(f.url, `adv-${fi}.xml`, `<?xml version="1.0"?><rss version="2.0"><channel><title>${f.vendor}</title>${items.join("")}</channel></rss>`);
});
put(
  ISC_DIARY_FEED.url,
  "isc-diary.xml",
  `<?xml version="1.0"?><rss version="2.0"><channel><title>ISC</title>${Array.from(
    { length: 4 },
    (_, i) =>
      `<item><title>[TEST] ISC diary ${i + 1}: ${["Odd scans on port 2323", "Phishing with SVG attachments", "Honeypot sees new botnet", "Quick look at a malicious LNK"][i]}</title><link>https://example.invalid/isc/${i}</link><pubDate>${new Date(NOW - i * 20 * 3_600_000).toUTCString()}</pubDate><description><![CDATA[<p>${para(2)}</p>]]></description></item>`,
  ).join("")}</channel></rss>`,
);

// NVD
put(NVD_API, "nvd.json", {
  totalResults: 14,
  vulnerabilities: Array.from({ length: 14 }, (_, i) => ({
    cve: {
      id: `CVE-2026-7${1000 + i}`,
      published: iso(i * 3).replace("Z", ""),
      descriptions: [{ lang: "en", value: `[TEST] Synthetic critical vulnerability ${i} in ${vendors[i % vendors.length].join(" ")} allows unauthenticated remote code execution via crafted requests.` }],
      metrics: { [i % 2 ? "cvssMetricV31" : "cvssMetricV40"]: [{ type: "Secondary", cvssData: { baseScore: [9.8, 9.1, 10, 8.8, 9.3][i % 5], version: i % 2 ? "3.1" : "4.0" } }] },
      weaknesses: [{ description: [{ value: ["CWE-78", "CWE-502", "CWE-287"][i % 3] }] }],
      configurations: [{ nodes: [{ cpeMatch: [{ criteria: `cpe:2.3:a:${vendors[i % vendors.length][0].toLowerCase().replace(/ /g, "_")}:${vendors[i % vendors.length][1].toLowerCase().replace(/ /g, "_")}:*:*:*:*:*:*:*:*` }] }] }],
    },
  })),
});

// MSRC Patch Tuesday
put(`${MSRC_API}/updates`, "msrc-updates.json", {
  value: [{ ID: "2026-Oct", DocumentTitle: "[TEST] October 2026 Security Updates", InitialReleaseDate: "2026-10-13T07:00:00Z", CvrfUrl: `${MSRC_API}/cvrf/2026-Oct` }],
});
const impacts = ["Remote Code Execution", "Elevation of Privilege", "Information Disclosure", "Security Feature Bypass", "Denial of Service", "Spoofing"];
put(`${MSRC_API}/cvrf/`, "msrc-cvrf.json", {
  // 74 Microsoft CVEs released on Patch Tuesday, plus third-party / out-of-band entries
  // that the fetcher must filter out (the real document carries thousands of those).
  Vulnerability: [
    ...Array.from({ length: 40 }, (_, i) => ({
      CVE: `CVE-2026-4${3000 + i}`,
      Title: { Value: `[TEST] Azure Linux upstream package ${i} issue` },
      Notes: [{ Type: 8, Value: i % 2 ? "MITRE" : "Linux" }],
      RevisionHistory: [{ Date: "2026-10-13T07:00:00" }],
      Threats: [{ Type: 1, Description: { Value: "Exploited:Yes" } }],
    })),
    { CVE: "CVE-2026-49999", Title: { Value: "[TEST] Out-of-band Microsoft cloud issue" }, Notes: [{ Type: 8, Value: "Microsoft" }], RevisionHistory: [{ Date: "2026-10-02T07:00:00" }], Threats: [] },
    ...Array.from({ length: 74 }, (_, i) => ({
    CVE: `CVE-2026-6${2000 + i}`,
    Title: { Value: `[TEST] Windows Component ${i} ${impacts[i % impacts.length]} Vulnerability` },
    Threats: [
      { Type: 0, Description: { Value: impacts[i % impacts.length] } },
      { Type: 1, Description: { Value: `Publicly Disclosed:${i === 7 ? "Yes" : "No"};Exploited:${i === 3 || i === 11 ? "Yes" : "No"};Latest Software Release:Exploitation ${i % 6 === 0 ? "More" : "Less"} Likely` } },
      { Type: 3, Description: { Value: i % 9 === 0 ? "Critical" : "Important" } },
    ],
    CVSSScoreSets: [{ BaseScore: i % 9 === 0 ? 9.8 : 7.8 }],
    Notes: [{ Type: 7, Value: "Windows" }, { Type: 8, Value: "Microsoft" }],
    RevisionHistory: [{ Date: "2026-10-13T07:00:00", Number: "1.0" }],
  })),
  ],
});

// GitHub: advisories, Sigma commits, releases
put(`${GITHUB_API}/advisories`, "ghsa.json", Array.from({ length: 6 }, (_, i) => ({
  ghsa_id: `GHSA-test-000${i}-xxxx`,
  cve_id: i % 2 ? `CVE-2026-5${1000 + i}` : null,
  summary: `[TEST] Critical ${["prototype pollution", "RCE via deserialization", "auth bypass", "path traversal", "SSRF", "command injection"][i]} in package-${i}`,
  published_at: iso(i * 20),
  html_url: `https://example.invalid/ghsa/${i}`,
  cvss_severities: { cvss_v3: { score: 9.1 + (i % 3) * 0.3 } },
  vulnerabilities: [{ package: { ecosystem: ["npm", "pip", "maven", "go", "rubygems", "npm"][i], name: `package-${i}` } }],
})));
put(`${GITHUB_API}/repos/${SIGMA_REPO}/commits?`, "sigma-base.json", [{ sha: "fixturebase".padEnd(40, "0"), commit: { author: { date: iso(24 * 7) }, tree: { sha: "basetree" } } }]);
const sigmaRules = [
  ["Suspicious Encoded PowerShell From Office Process", "high", "windows", "process_creation", "t1059.001"],
  ["Possible Kerberoasting Activity Via Rubeus", "high", "windows", "process_creation", "t1558.003"],
  ["Azure Sign-In From Anonymizing Proxy", "medium", "azure", "signinlogs", "t1078.004"],
  ["Linux Reverse Shell Via Bash Dev TCP", "high", "linux", "process_creation", "t1059.004"],
  ["LSASS Memory Access By Unusual Process", "critical", "windows", "process_access", "t1003.001"],
  ["Scheduled Task Created From Temp Folder", "medium", "windows", "process_creation", "t1053.005"],
];
const sigmaFiles = sigmaRules.map((_, i) => `${["rules", "rules-emerging-threats", "rules", "rules", "rules-threat-hunting", "rules"][i]}/windows/test/rule_${i}.yml`);
const oldFiles = ["rules/windows/old/existing_a.yml", "rules/windows/old/existing_b.yml", "rules/windows/moved/renamed_c.yml"];
put(`${GITHUB_API}/repos/${SIGMA_REPO}/git/trees/basetree`, "sigma-tree-base.json", { truncated: false, tree: oldFiles.map((path) => ({ path, type: "blob" })) });
put(`${GITHUB_API}/repos/${SIGMA_REPO}/git/trees/master`, "sigma-tree-head.json", {
  truncated: false,
  // existing files, one moved file (must not count as new), the new rules, and a deprecated one (ignored)
  tree: [...oldFiles.slice(0, 2), "rules/windows/new-home/renamed_c.yml", ...sigmaFiles, "deprecated/windows/old_rule.yml"].map((path) => ({ path, type: "blob" })),
});
sigmaFiles.forEach((file, i) => {
  const [title, level, product, category, tech] = sigmaRules[i];
  put(`${GITHUB_RAW}/${SIGMA_REPO}/master/${file}`, `sigma-rule-${i}.yml`, `title: '[TEST] ${title}'\nid: 00000000-0000-0000-0000-00000000000${i}\nstatus: experimental\ndescription: |\n    Synthetic fixture rule ${i} — detects ${title.toLowerCase()}.\nlogsource:\n    product: ${product}\n    category: ${category}\ntags:\n    - attack.execution\n    - attack.${tech}\nlevel: ${level}\n`);
});
DETECTION_REPOS.forEach((r, i) =>
  put(`${GITHUB_API}/repos/${r.repo}/releases`, `rel-${i}.json`, [
    { name: `[TEST] ${r.label} v${i + 1}.${i}`, tag_name: `v${i}`, html_url: `https://example.invalid/rel/${i}`, published_at: iso(i * 70), draft: false, body: r.repo === SIGMA_REPO ? "### New Rules\n- new: A\n- new: B\n### Updated Rules\n- update: C" : "Synthetic release notes describing new and tuned detections for the fixture." },
  ]),
);

// abuse.ch
const fams = ["Cobalt Strike", "AsyncRAT", "Remcos", "Lumma Stealer", "Mirai", "QakBot", "DarkGate"];
put(THREATFOX_API, "threatfox.json", {
  query_status: "ok",
  data: Array.from({ length: 60 }, (_, i) => ({
    ioc: i % 3 === 0 ? `198.51.100.${i}:${4400 + i}` : i % 3 === 1 ? `bad-${i}.example.test` : `http://evil-${i}.example.test/gate.php`,
    ioc_type: ["ip:port", "domain", "url"][i % 3],
    threat_type: "botnet_cc",
    malware_printable: fams[(i * i) % fams.length],
    confidence_level: [50, 75, 100][i % 3],
    first_seen: new Date(NOW - i * 20 * 60_000).toISOString().replace("T", " ").slice(0, 19) + " UTC",
    reference: null,
  })),
});
put(URLHAUS_RECENT, "urlhaus.json", {
  query_status: "ok",
  urls: Array.from({ length: 80 }, (_, i) => ({ url: `http://203.0.113.${i % 50}/bins/x${i}.sh`, url_status: i % 3 ? "online" : "offline", threat: i % 4 ? "malware_download" : "phishing", tags: [["mirai", "elf"], ["32-bit", "mozi"], ["exe", "AgentTesla"]][i % 3], date_added: new Date(NOW - i * 9 * 60_000).toISOString().replace("T", " ").slice(0, 19) + " UTC" })),
});
put(FEODO_BLOCKLIST, "feodo.json", Array.from({ length: 18 }, (_, i) => ({ ip_address: `192.0.2.${i + 10}`, port: [443, 8080, 2222][i % 3], status: i % 4 ? "online" : "offline", malware: ["QakBot", "Pikabot", "Emotet"][i % 3], first_seen: new Date(NOW - i * 86_400_000).toISOString().replace("T", " ").slice(0, 19), last_online: new Date(NOW - i * 3_600_000).toISOString().slice(0, 10) })));

// ransomware.live (v2 shape)
const groups = ["akira", "qilin", "play", "safepay", "incransom", "lynx", "medusa"];
const sectors = ["Manufacturing", "Healthcare", "Technology", "Business Services", "Construction", "Education"];
const ccs = ["US", "DE", "GB", "CA", "IT", "FR", "AU", "BR"];
put(RANSOMWARE_LIVE_FREE, "ransomware.json", Array.from({ length: 70 }, (_, i) => ({
  victim: `[TEST] Org ${i + 1} ${["Holdings", "GmbH", "Ltd", "Inc", "S.p.A."][i % 5]}`,
  group: groups[(i * 3) % groups.length],
  attackdate: new Date(NOW - i * 2.2 * 3_600_000).toISOString().replace("T", " ").slice(0, 19),
  country: ccs[(i * 5) % ccs.length],
  activity: sectors[(i * 7) % sectors.length],
})));

// SANS ISC API
put(`${ISC_API}/infocon`, "isc-infocon.json", { status: "green" });
put(`${ISC_API}/topports`, "isc-topports.json", Object.fromEntries([23, 22, 445, 80, 8080, 443, 3389, 5555, 2323, 81].map((p, i) => [String(i), { rank: i + 1, targetport: p, records: 900000 - i * 70000, targets: 50000 - i * 3000, sources: 30000 - i * 2000 }])));

writeFileSync(join(dir, "index.json"), JSON.stringify(index, null, 1));
console.log(`fixtures: ${Object.keys(index).length} URLs → ${dir}`);
