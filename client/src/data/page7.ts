// velocity: posts/mentions per hour over the last 6h window
// trend: 'rising' | 'peak' | 'cooling'
// sentiment: 'alarm' | 'skeptical' | 'analytical' | 'mixed'
// sources: which communities are amplifying

export const communitySignalData = {
  topics: [
    {
      id: "tp1",
      keyword: "GhostWeave SCADA",
      velocity: 94,
      trend: "rising",
      upvotes: 12400,
      comments: 834,
      sentiment: "alarm",
      sources: ["HN", "r/netsec", "r/cybersecurity"],
      topThread:
        "Researcher drops partial IOC list — firmware persistence survives reflash",
      novelty: true,
    },
    {
      id: "tp2",
      keyword: "CVE-2026-1147",
      velocity: 81,
      trend: "rising",
      upvotes: 9800,
      comments: 612,
      sentiment: "alarm",
      sources: ["HN", "r/netsec"],
      topThread: "FortiOS RCE being mass-scanned within hours of KEV listing",
      novelty: false,
    },
    {
      id: "tp3",
      keyword: "io_uring privilege esc",
      velocity: 73,
      trend: "rising",
      upvotes: 8100,
      comments: 541,
      sentiment: "analytical",
      sources: ["HN", "r/netsec"],
      topThread:
        "Deep dive: why io_uring keeps producing LPE bugs and what kernel devs are missing",
      novelty: true,
    },
    {
      id: "tp4",
      keyword: "ransomware insurance gap",
      velocity: 61,
      trend: "peak",
      upvotes: 7300,
      comments: 489,
      sentiment: "mixed",
      sources: ["r/cybersecurity", "r/netsec"],
      topThread:
        "War exclusion clauses are being interpreted more broadly than anyone expected",
      novelty: true,
    },
    {
      id: "tp5",
      keyword: "CVSS reform",
      velocity: 55,
      trend: "peak",
      upvotes: 6200,
      comments: 407,
      sentiment: "skeptical",
      sources: ["HN", "r/netsec"],
      topThread:
        "CVSS 4.0 still doesn't account for exploitability in the wild — practitioners are done with it",
      novelty: false,
    },
    {
      id: "tp6",
      keyword: "vCenter deserialization",
      velocity: 49,
      trend: "peak",
      upvotes: 5400,
      comments: 318,
      sentiment: "alarm",
      sources: ["r/netsec", "r/hacking"],
      topThread:
        "PoC dropped on GitHub, already mirrored 40+ times — expect mass exploitation Monday",
      novelty: false,
    },
    {
      id: "tp7",
      keyword: "MFA fatigue tooling",
      velocity: 38,
      trend: "cooling",
      upvotes: 4100,
      comments: 267,
      sentiment: "analytical",
      sources: ["HN", "r/cybersecurity"],
      topThread:
        "Open-source MFA bombing automation is getting disturbingly polished",
      novelty: false,
    },
    {
      id: "tp8",
      keyword: "supply chain npm",
      velocity: 31,
      trend: "cooling",
      upvotes: 3300,
      comments: 198,
      sentiment: "mixed",
      sources: ["HN", "r/netsec"],
      topThread:
        "Another squatted package with 80k weekly downloads — detection took 11 days",
      novelty: false,
    },
    {
      id: "tp9",
      keyword: "Volt Typhoon LOTL",
      velocity: 27,
      trend: "cooling",
      upvotes: 2900,
      comments: 154,
      sentiment: "analytical",
      sources: ["r/netsec", "r/cybersecurity"],
      topThread:
        "Why living-off-the-land makes attribution almost impossible for blue teams",
      novelty: false,
    },
    {
      id: "tp10",
      keyword: "AI-generated phishing",
      velocity: 22,
      trend: "cooling",
      upvotes: 2100,
      comments: 143,
      sentiment: "mixed",
      sources: ["HN", "r/cybersecurity", "r/hacking"],
      topThread:
        "LLM-crafted spearphish now indistinguishable from executive comms — red team notes",
      novelty: false,
    },
  ],

  // HN-flavoured stories — technical, long-thread energy
  hn: [
    {
      id: "hn1",
      size: "secondary",
      headline:
        "Kernel Developers Debate io_uring Subsystem Future After Serial CVEs",
      byline: "HACKER NEWS · 847 POINTS · 312 COMMENTS",
      body: [
        "A thread initiated by a senior kernel maintainer has reignited debate over whether the io_uring asynchronous I/O subsystem should be restricted in hardened environments following a third privilege escalation vulnerability in 14 months. The discussion has attracted contributions from Google Project Zero researchers, major Linux distribution security teams and container runtime engineers, each presenting conflicting assessments of the subsystem's risk profile relative to its performance benefits.",
        "The highest-voted comment thread argues that io_uring's fundamental design — which requires deep integration with kernel memory management — makes it structurally prone to use-after-free class vulnerabilities regardless of individual patch quality. Several respondents countered that the real issue is insufficient fuzzing coverage and proposed a dedicated security review process before new io_uring features land in stable kernels.",
        "A secondary discussion has emerged around whether major cloud providers should disable io_uring by default in their managed Kubernetes offerings, following Google's earlier decision to restrict it in gVisor sandbox environments.",
      ],
    },
    {
      id: "hn2",
      size: "secondary",
      headline:
        "Ask HN: How Are Teams Actually Handling the CVE Velocity Problem?",
      byline: "HACKER NEWS · 634 POINTS · 271 COMMENTS",
      body: [
        "A practitioner-submitted Ask HN thread soliciting real-world patch prioritisation strategies has generated one of the highest comment-to-upvote ratios seen on the platform this month, suggesting significant unmet need for operational guidance beyond vendor advisories. Respondents range from solo security engineers at startups to CISO-level practitioners at large financial institutions.",
        "The most upvoted responses coalesce around a common theme: CVSS scores are being largely ignored in favour of KEV status combined with internal asset exposure mapping. Several engineers described building internal tooling to automatically cross-reference CVE feeds against their SBOM and network inventory, triggering escalation workflows only when exploitable vulnerabilities intersect with internet-facing assets.",
        "Commenters from regulated industries noted that compliance frameworks are lagging significantly behind practitioner reality, with audit requirements still referencing CVSS thresholds that practitioners consider operationally irrelevant.",
      ],
    },
    {
      id: "hn3",
      size: "brief",
      headline: "Show HN: Open-Source KEV-to-SBOM Correlation Tool",
      byline: "HACKER NEWS · 412 POINTS · 89 COMMENTS",
      body: [
        "A newly open-sourced tool that automatically correlates CISA KEV entries against a supplied software bill of materials has gained rapid traction, accumulating over 1,200 GitHub stars within 48 hours of submission. The tool outputs a prioritised remediation queue sorted by exploitability state and asset exposure score.",
        "Early adopters report that the tool surfaces genuinely exploited vulnerabilities affecting their stack that were previously buried in undifferentiated advisory feeds, reducing triage time significantly.",
      ],
    },
    {
      id: "hn4",
      size: "brief",
      headline: "CVSS 4.0 Adoption Stalls Among Practitioners",
      byline: "HACKER NEWS · 388 POINTS · 147 COMMENTS",
      body: [
        "Discussion of a recent survey showing that fewer than 12% of security teams have meaningfully integrated CVSS 4.0 into their prioritisation workflows has generated strong agreement in comment threads, with practitioners citing the continued absence of real-world exploitability data as the primary barrier to adoption.",
        "Several commenters describe running parallel scoring systems internally, using CVSS 4.0 for compliance reporting while relying on EPSS and KEV correlation for actual operational decisions.",
      ],
    },
  ],

  // Reddit-flavoured stories — broader, more sentiment-driven
  reddit: [
    {
      id: "rd1",
      size: "secondary",
      headline: "r/netsec: Community Flags GhostWeave IOC Gaps in Public Feeds",
      byline: "r/NETSEC · 4,200 UPVOTES · 318 COMMENTS",
      body: [
        "A post compiling discrepancies between publicly released GhostWeave indicators of compromise and privately shared telemetry has become one of the most upvoted submissions in r/netsec this month, with practitioners expressing frustration that official IOC feeds are lagging community-sourced intelligence by 48 to 72 hours. The thread has attracted contributions from incident responders who claim to have observed additional infrastructure not yet reflected in any public advisory.",
        "Commenters have collaboratively assembled a supplementary IOC list in a linked GitHub repository, which has been forked over 600 times in under 24 hours. Participants note that the repository includes C2 infrastructure, file hashes and YARA rules that predate official releases, raising questions about the timeliness of coordinated disclosure processes managed by national cyber agencies.",
        "A significant sub-thread debates whether community-driven IOC sharing at this velocity creates operational risk by potentially alerting threat actors that their infrastructure has been identified, prompting rotation before defenders can act on the intelligence.",
      ],
    },
    {
      id: "rd2",
      size: "secondary",
      headline:
        "r/cybersecurity: Junior Analysts Report Alert Fatigue Reaching Breaking Point",
      byline: "r/CYBERSECURITY · 3,800 UPVOTES · 447 COMMENTS",
      body: [
        "A candid post from a junior SOC analyst describing unsustainable alert volumes and deteriorating triage quality has resonated strongly across r/cybersecurity, accumulating nearly 4,000 upvotes and generating extensive discussion about structural problems in security operations centre staffing models. The post describes shifts where alert queues exceed realistic human review capacity by multiples, leading to systematic de-prioritisation of lower-severity events.",
        "Responses from senior practitioners largely validate the described conditions, with many sharing similar experiences across different organisations and sectors. Several commenters argue that the industry's reliance on volume-based detection models is fundamentally misaligned with human cognitive capacity, and that without AI-assisted triage becoming standard, alert fatigue will continue to create meaningful detection gaps.",
        "The thread has also surfaced concern about turnover rates, with multiple respondents noting that experienced analysts are leaving SOC roles at accelerating rates, concentrating institutional knowledge loss at precisely the moment when threat complexity is increasing.",
      ],
    },
    {
      id: "rd3",
      size: "brief",
      headline:
        "r/hacking: PoC Reproduction Confirmed Across Multiple vCenter Versions",
      byline: "r/HACKING · 2,100 UPVOTES · 203 COMMENTS",
      body: [
        "Community members have independently confirmed reproduction of the CVE-2026-4412 vCenter deserialization proof-of-concept across three distinct version configurations, with one contributor reporting successful exploitation against a default installation with no prior hardening applied.",
        "The thread is being monitored by multiple threat intelligence teams, with several noting that the community confirmation significantly raises the probability of imminent mass exploitation.",
      ],
    },
    {
      id: "rd4",
      size: "brief",
      headline:
        "r/netsec: Emerging Pattern — Attackers Timing Execution to Backup Windows",
      byline: "r/NETSEC · 1,900 UPVOTES · 167 COMMENTS",
      body: [
        "A pattern observed across multiple incident response engagements — where ransomware execution appears deliberately timed to coincide with scheduled backup synchronisation windows — is gaining significant community attention, with practitioners sharing corroborating observations from their own environments.",
        "The implication that attackers have prior visibility into backup schedules suggests either prolonged dwell time with active reconnaissance or access to administrative configuration data, both of which significantly complicate forensic timeline reconstruction.",
      ],
    },
  ],
};
