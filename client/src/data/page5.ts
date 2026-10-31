// Exploitability states (used for ranking + visual badge)
// 'kev'        = CISA Known Exploited Vulnerability — highest priority
// 'active'     = Confirmed active exploitation observed in the wild
// 'poc'        = Public proof-of-concept exists, not yet weaponized
// 'theoretical'= No known exploitation

export const threatDeskStories = {
  // ── CVE TABLE ENTRIES ──────────────────────────────────────────────
  cves: [
    {
      id: "CVE-2026-1147",
      product: "Fortinet FortiOS",
      category: "Network",
      cvss: 9.8,
      exploitability: "kev",
      summary:
        "Heap overflow in SSL-VPN portal allows unauthenticated RCE via crafted HTTP request. Actively used in ransomware pre-positioning campaigns.",
      affected: "FortiOS 7.0–7.4, FortiProxy 7.0–7.2",
      patch: "7.4.4 / 7.2.8",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-0883",
      product: "Microsoft Exchange",
      category: "Email",
      cvss: 9.1,
      exploitability: "kev",
      summary:
        "Server-side request forgery in EWS endpoint enables privilege escalation to SYSTEM without authentication.",
      affected: "Exchange 2019 CU13 and earlier",
      patch: "KB5035233",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-2201",
      product: "Linux Kernel",
      category: "OS",
      cvss: 8.7,
      exploitability: "active",
      summary:
        "Use-after-free in io_uring subsystem allows local privilege escalation to root. Observed in container escape chains.",
      affected: "Kernel 6.1–6.8",
      patch: "6.8.4",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-3304",
      product: "Cisco IOS XE",
      category: "Network",
      cvss: 8.6,
      exploitability: "active",
      summary:
        "Authentication bypass in web UI management interface. Exploitation grants full device control on internet-exposed routers.",
      affected: "IOS XE 17.x prior to 17.12.1",
      patch: "17.12.1",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-4412",
      product: "VMware vCenter",
      category: "Virtualisation",
      cvss: 8.2,
      exploitability: "poc",
      summary:
        "Deserialization flaw in vCenter Server DCERPC service. PoC published; mass exploitation considered imminent by researchers.",
      affected: "vCenter 8.0 prior to U2b",
      patch: "8.0 U2b",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-5571",
      product: "Apache Tomcat",
      category: "Web",
      cvss: 7.8,
      exploitability: "poc",
      summary:
        "Partial PUT request handling flaw enables remote code execution under non-default configuration. PoC circulating on GitHub.",
      affected: "Tomcat 10.1.0–10.1.19",
      patch: "10.1.20",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-6634",
      product: "OpenSSH",
      category: "Remote Access",
      cvss: 7.5,
      exploitability: "poc",
      summary:
        "Race condition in sshd privilege separation handler. Theoretical pre-auth RCE; no confirmed in-the-wild exploitation.",
      affected: "OpenSSH < 9.8",
      patch: "9.8p1",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-7790",
      product: "Ivanti Connect Secure",
      category: "VPN",
      cvss: 7.2,
      exploitability: "theoretical",
      summary:
        "Stack buffer overflow in SAML assertion parser. No exploitation observed; requires authenticated session.",
      affected: "ICS 22.x prior to 22.7R2",
      patch: "22.7R2",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-8801",
      product: "Google Chrome",
      category: "Browser",
      cvss: 6.9,
      exploitability: "theoretical",
      summary:
        "Type confusion in V8 engine accessible via crafted JavaScript. Sandboxed; exploitation requires chained escape.",
      affected: "Chrome < 124.0.6367.91",
      patch: "124.0.6367.91",
      patchStatus: "available",
    },
    {
      id: "CVE-2026-9103",
      product: "Palo Alto PAN-OS",
      category: "Network",
      cvss: 6.5,
      exploitability: "theoretical",
      summary:
        "XML external entity injection in management web interface. Requires administrative credentials; low exploitation probability.",
      affected: "PAN-OS 11.0 prior to 11.0.3",
      patch: "11.0.3",
      patchStatus: "pending",
    },
  ],

  // ── SURROUNDING STORY COLUMNS ──────────────────────────────────────
  stories: [
    {
      id: "td1",
      size: "secondary",
      headline: "KEV Catalogue Grows by 34 Entries in Two Weeks",
      byline: "PRIYA ANAND",
      body: [
        "CISA's Known Exploited Vulnerabilities catalogue has expanded at an accelerated rate following confirmation of active campaigns targeting network edge devices and VPN concentrators. The additions reflect a pattern of threat actors prioritising perimeter infrastructure as initial access vectors, capitalising on delayed patch cycles in enterprise environments.",
        "Security operations teams are being advised to treat KEV additions as de-facto emergency patch directives rather than advisory guidance, given the compressed timeline between listing and mass exploitation observed in recent quarters.",
        "The catalogue now includes 1,247 entries spanning 387 distinct vendors, with network infrastructure and remote access products representing the highest concentration of newly added vulnerabilities.",
      ],
    },
    {
      id: "td2",
      size: "secondary",
      headline: "CVSS Scores Disputed as Inadequate Risk Signal",
      byline: "STAFF",
      body: [
        "Security practitioners are raising concerns that CVSS base scores increasingly fail to reflect real-world exploitation risk, as scores are calculated against theoretical worst-case conditions rather than observed attacker behaviour in production environments.",
        "Several high-profile incidents have involved vulnerabilities rated below 7.0 that were nonetheless widely exploited due to their presence in ubiquitous software and ease of weaponization, while higher-rated flaws requiring complex preconditions remain unaddressed.",
        "Efforts to supplement CVSS with exploitability enrichment layers, including EPSS probability scores and KEV correlation, are gaining traction as a more operationally relevant prioritisation framework.",
      ],
    },
    {
      id: "td3",
      size: "brief",
      headline: "Edge Device Flaws Dominate Q1 Exploitation Data",
      byline: "STAFF",
      body: [
        "Quarterly telemetry from multiple threat intelligence platforms confirms that network edge devices — including VPN appliances, firewalls and load balancers — accounted for over 60% of confirmed initial access vectors in tracked intrusion campaigns.",
        "The concentration reflects both the privileged network position of these devices and the historically slow patch adoption rates in operational technology and network infrastructure teams.",
      ],
    },
    {
      id: "td4",
      size: "brief",
      headline: "Patch Tuesday Backlog Reaches Record High",
      byline: "STAFF",
      body: [
        "Enterprise patch management teams report an unprecedented backlog of unaddressed critical and high-severity advisories, with average remediation timelines for critical vulnerabilities now exceeding 21 days across surveyed organisations.",
        "Resource constraints, testing overhead and change management friction are cited as primary contributors, with security teams consistently unable to sustain pace with monthly vendor release cycles.",
      ],
    },
    {
      id: "td5",
      size: "brief",
      headline: "PoC Publication Accelerates Exploitation Windows",
      byline: "STAFF",
      body: [
        "Analysis of exploitation timelines reveals that public release of proof-of-concept code reduces median time-to-exploitation from weeks to under 72 hours, fundamentally altering the risk calculus for unpatched systems.",
        "Researchers and vendors are reassessing coordinated disclosure norms in light of this acceleration, with some advocating for delayed PoC publication windows tied to patch adoption metrics.",
      ],
    },
  ],
};
