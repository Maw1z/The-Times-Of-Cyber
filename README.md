# The Times of Cyber

A SOC analyst's morning paper. Seven sections, compiled every few hours from free sources and set as a halftone newspaper you page through like a book. Each section answers the same question: *what do I need to act on or know this shift?*

### What each section is for

**A1 · Front Page — the shift briefing.** Read this first. *Act now* lists CVEs added to CISA's Known Exploited Vulnerabilities catalogue in the last 72 hours (with CISA's patch deadline), reporting of in-the-wild exploitation, and critical vendor advisories. Then come the lead story, the day's numbers at a glance (Patch Tuesday, internet scanning, ransomware victims, fresh IOCs) and the top stories. The *Inside today* index jumps to each section.

**A2 · Vulnerabilities & Patches — what to patch first.** The newest KEV entries with CVSS, EPSS (probability of exploitation in the next 30 days), ransomware use and CISA SSVC flags; Microsoft's Patch Tuesday (exploited zero-days, criticals, counts by impact); vendor PSIRT advisories; new critical CVEs from the last 48 hours; critical open-source package advisories; exploitation and patch news.
*Sources: CISA KEV, CVE Program, FIRST EPSS, MSRC CVRF API, NVD, Cisco / Palo Alto / Fortinet / CISA ICS / Chrome feeds, GitHub Advisory DB.*

**A3 · Detection Desk — what to detect and hunt.** A *technique of the week* (the ATT&CK technique most cited in this week's reporting) with MITRE's detection strategies, analytics, log sources and mitigations; Sigma rules added to SigmaHQ in the last 7 days (ready to convert to KQL, SPL or ES|QL); ATT&CK techniques cited in the news; new releases of detection content.
*Sources: MITRE ATT&CK v20, SigmaHQ, Elastic, Splunk, Atomic Red Team, capa, Hayabusa.*

**A4 · IOC Wire — what to block or hunt for.** Malware families with the most fresh indicators, one high-confidence indicator per family, botnet C2 servers that are online now, and malware distribution URLs. Everything is **defanged**; check context before blocking.
*Sources: abuse.ch ThreatFox, URLhaus, Feodo Tracker.*

**A5 · Ransomware Tracker — who is being hit.** Leak-site victims from the last 7 days by group, sector and country, the latest posts (useful for spotting clients or suppliers), and ransomware reporting.
*Sources: ransomware.live, news feeds.*

**A6 · Threat Actors & Campaigns — who is active.** A registry of tracked groups ranked by how often they were named in the last 30 days, with aliases, attribution and the latest headline, followed by vendor research and campaign reporting.
*Sources: vendor research blogs, the 30-day archive.*

**A7 · Briefs & Community — everything else.** Breaches and incidents, policy and law enforcement, other news, a signal board of topics rising in the last 24 hours, what practitioners are discussing (Hacker News, Reddit, SANS ISC handler diaries), and the *wire report*: every source and whether it answered for this edition.
*Sources: news feeds, SANS ISC, HN Algolia, Reddit.*

Every number is a count or a value taken from a source; nothing is estimated. A source that fails or lacks a key is skipped and listed as "down" in the wire report.

## Reading it

- **Desktop and tablet:** the paper is a book. Drag or swipe a page corner to turn it (with a page curl, like Apple Books), click a page's edge, press ← / →, Space, Home / End, or scroll the wheel. Wide screens show a two-page spread; a tablet in portrait shows one page. The bar underneath has previous / next buttons and two **A** buttons for text size: smaller text fits more on each page (the paper is re-typeset and you stay on the story you were reading; your choice is remembered). The URL keeps your page (`#p12`), so a reload opens the same page.
- **Phone:** one continuous scroll. The *Inside today* index jumps to each section.

Pages are typeset, not cropped: every item (heading, paragraph, table row, list entry, photo) is measured and poured into fixed-size pages. Paragraphs break between lines and never leave a single line behind, tables continue with their header repeated, photos shrink to fit or move to the top of the next page, and headings never end a page. Any space left on a page is shared out between its items, so pages end flush with the bottom margin. Photos that fail to load are dropped before typesetting, so they never leave holes.

## Keys (all free, all optional)

| Variable | Unlocks | Get it |
| --- | --- | --- |
| `ABUSECH_AUTH_KEY` | ThreatFox and URLhaus on the IOC Wire. Since Oct 2026 abuse.ch only serves authenticated requests | <https://auth.abuse.ch/> |
| `RANSOMWARE_LIVE_KEY` | ransomware.live PRO API. Without it the keyless v2 API is used, which is limited to 1 request/minute and personal use only | <https://my.ransomware.live/> |
| `NVD_API_KEY` | Higher NVD rate limits (fetches are faster) | <https://nvd.nist.gov/developers/request-an-api-key> |
| `GITHUB_TOKEN` | Sigma rules, detection releases, GitHub advisories. **Provided automatically in Actions**; locally optional (60 requests/hour without) | a fine-grained token with no scopes |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Reliable Reddit from CI | a "script" app at <https://www.reddit.com/prefs/apps> |

Locally: copy `fetcher/.env.example` to `fetcher/.env` (gitignored) and fill it in. For the Action: **Settings → Secrets and variables → Actions → New repository secret**, using the same names.

## Run it locally

```bash
cd fetcher && npm install && npm run fetch     # writes client/public/data/edition.json (~1 min)
cd ../client && npm install && npm run dev     # http://localhost:5173
```

`npm run fetch:fixtures` builds a synthetic edition for working on layouts offline. Every item in it is marked `[TEST]`.

## Deploy (GitHub Pages)

1. Put `print-edition.yml` in `.github/workflows/`.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**. Pages on a private repo needs a paid plan; otherwise make the repo public.
3. Add whichever key secrets you have.
4. Push to `main`, or run **Print edition** from the Actions tab. After that it runs every 3 hours.

Nothing is committed by the workflow. The 30-day archive behind the trends and actor activity is read back from the previously deployed site at the start of each run.

## Layout

```
fetcher/
  src/            one module per desk: vulns, detection, iocs, ransomware, isc, community, kev …
  data/attack.json   trimmed MITRE ATT&CK (techniques + detection analytics); refresh with npm run update:attack
  test/           fixture generator for offline runs
client/           React + Vite + Tailwind paper that renders edition.json
  src/types/edition.ts   the data contract between the two
  src/book/sections.tsx  what goes in each section, as a flow of small items
  src/book/paginate.ts   the typesetter: pours items into pages, splits and justifies
  src/book/Book.tsx      the page-turning book (page-flip / StPageFlip, MIT)
  src/book/Paper.tsx     picks book or scroll layout, measures items
```

Add or remove news and advisory feeds in `fetcher/src/config.ts`. Track more threat actors in `fetcher/src/actors.ts`.

## How stories are chosen

- **Classification:** each section has weighted keyword rules (`fetcher/src/classify.ts`). A hit in the title counts three times as much as a hit in the body.
- **Clustering:** headlines from different outlets about the same story are merged. The best version leads and the rest appear as "Also reported by…".
- **Ranking:** recency (18 h half-life) × number of outlets covering it × source weight.
- **Tagging:** CVEs, ATT&CK technique IDs and tracked actors found in a story are shown on it as tags.

## Print effects

The halftone is cheap enough to turn pages smoothly:

- **Photos** go through a true halftone (`#ht-photo` in `client/src/halftone/HalftoneDefs.tsx`): big dots in the shadows, pin-points in the highlights, soft brown-black ink.
- **Paper speckle and grey shading** are CSS dot patterns (`.paper`, `.tint*` in `index.css`).
- **Type** stays solid black. The nameplate and banners get letterpress edges.

Add `?halftone=off` for a plain rendering.

## Credits

Headlines and excerpts belong to the linked publishers. Every item links to its original. ATT&CK® is a registered trademark of The MITRE Corporation. IOC, ransomware and vulnerability data come from the projects listed above under their own terms.
