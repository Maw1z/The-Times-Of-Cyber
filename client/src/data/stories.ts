// All story content. Layouts import this and pick what they need.
// Each story has a stable `id` so layouts can reference by id.

export const stories = {
  ransomware: {
    id: "ransomware",
    size: "lead",
    dropCap: true,
    headline: "RANSOMWARE",
    deck: "Global infrastructure attack cripples hospitals, banks and power grids across 34 nations",
    byline: "ALICIA VONG and MARCUS REED",
    jumpLine: "Page A10",
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Server_farm.jpg/1200px-Server_farm.jpg",
      caption:
        "Emergency response teams work through the night at a Tier-3 data center in Frankfurt as coordinated ransomware brings down linked infrastructure across Europe and North America. — REUTERS / M. HOFFMANN",
      height: "130px",
    },
    body: [
      "A sophisticated ransomware operation of unprecedented scale struck critical infrastructure systems across 34 countries on Sunday, disabling hospital networks, disrupting power distribution and freezing interbank settlement systems in what cybersecurity officials are already calling the most destructive coordinated cyberattack in recorded history.",
      "The malware, identified by researchers at Mandiant and CrowdStrike as a new strain dubbed GhostWeave, exploited a previously unknown vulnerability in the firmware of industrial control systems manufactured by a single German supplier whose hardware underpins much of the Western world's managed power and water infrastructure. By the time the attack was detected, the payload had already replicated to more than 220,000 endpoints.",
      '"We have never seen anything move this fast," said Jen Easterly, former director of the Cybersecurity and Infrastructure Security Agency, speaking by telephone from a crisis briefing at the Pentagon. "The lateral movement capabilities alone suggest nation-state resources and months of pre-positioning."',
      "The attack began manifesting at approximately 02:14 UTC Sunday when network operations centers at three major European hospital trusts simultaneously reported that their electronic health record systems had been encrypted and replaced with ransom notices demanding 500 Bitcoin — roughly $47 million — per institution. Within forty minutes, similar notices appeared at power distribution nodes in Poland, the Netherlands and the eastern United States.",
      "Surgeries were cancelled across the National Health Service in Britain. Frankfurt Airport diverted incoming flights. The New York Metropolitan Transit Authority suspended automated signaling on six subway lines. In Seoul, trading on the Korea Exchange was halted for three hours after clearing systems became unreachable.",
      "A senior White House official confirmed that elements of the United States electrical grid were affected, though the official declined to specify which regions or how severely. The National Security Council held an emergency session that lasted through the night.",
      'The ransom demands, analysts noted, are almost certainly theatrical. "Nation-states do not need the Bitcoin," said Thomas Rid, a professor of strategic studies at Johns Hopkins University. "The payment mechanism is designed to create ambiguity — a legal and geopolitical buffer."',
      "Recovery timelines are uncertain. Forensic teams say GhostWeave's encryption routine includes a secondary sabotage component that overwrites firmware on certain network interface cards, meaning affected devices cannot simply be restored from backup — they must be physically replaced.",
    ],
  },

  zeroTrust: {
    id: "zeroTrust",
    size: "secondary",
    headline: "Zero-Trust Mandates Fail to Stop Breach, Investigators Say",
    byline: "DIANA PARK",
    body: [
      "Federal cybersecurity mandates requiring agencies to adopt zero-trust network architectures by the end of last year did not prevent Sunday's intrusions, according to two officials familiar with the preliminary findings, in an early indication that compliance-driven security frameworks may offer less protection than proponents claim when adversaries exploit supply-chain vectors that pre-date policy requirements.",
      'The firmware vulnerability at the center of Sunday\'s attack was introduced into the affected hardware line before the zero-trust requirements applied to procurement. "Zero-trust assumes the software layer is the threat surface," said one official. "This was below the software layer entirely. The attacker owned the hardware before the network ever came online."',
    ],
  },

  cryptoMarkets: {
    id: "cryptoMarkets",
    size: "secondary",
    headline: "Cryptocurrency Markets Seize as Ransom Wallets Draw Scrutiny",
    byline: "FELIX OKAFOR",
    body: [
      "Bitcoin fell nearly 11 percent in early Asian trading on Sunday as blockchain analysts published wallet addresses linked to the ransom demands, prompting several major exchanges to preemptively freeze transfers to those addresses. The episode renewed calls in Brussels and Washington to extend anti-money-laundering obligations to decentralized finance platforms.",
      'Elliptic, a blockchain analytics firm, said the wallets showed no prior transaction history, a hallmark of professionally operated criminal infrastructure. "These wallets were created for this operation," the firm said. "The sophistication is consistent with a well-resourced actor."',
    ],
  },

  aiAlerts: {
    id: "aiAlerts",
    size: "secondary",
    headline:
      "AI Threat Detection Tools Flagged Attack — Alerts Were Dismissed",
    byline: "SONIA MARCHETTI",
    body: [
      "At least three of the affected organizations were running AI-powered anomaly detection systems that flagged unusual firmware polling behavior in the 72 hours before Sunday's attack, according to incident logs reviewed by The Times of Cyber. In each case, the alerts were triaged by automated systems and downgraded to low-priority status before human analysts reviewed them.",
      "The disclosures are likely to intensify debate about the role of human oversight in automated security operations centers, where analysts at large enterprises may receive hundreds of thousands of alerts per day and rely heavily on machine triage to separate signal from noise.",
    ],
  },

  openSource: {
    id: "openSource",
    size: "brief",
    headline: "Open-Source Maintainers Under Pressure as Backdoor Fears Spread",
    byline: "RUTH HELMAN",
    body: [
      "The attack has reignited anxiety across the open-source community after researchers noted that GhostWeave's dropper component leveraged a modified build of an open-source network-monitoring tool silently altered in a pull request accepted eight months ago.",
      "The pull request passed automated CI/CD checks and received approval from two maintainers who reviewed it in under four minutes combined. The change introduced twelve lines of code amid a 900-line refactor.",
      'GitHub has since suspended the account. "This is the attack we have been warning about for three years," said one foundation board member.',
    ],
  },

  insurance: {
    id: "insurance",
    size: "brief",
    headline: "Insurers Brace for Claims; Cyber Policies Tested at Scale",
    byline: "JAMES WHITMORE",
    body: [
      "Shares of the world's largest cyber-insurance underwriters fell sharply in Monday pre-market trading. Analysts at Morgan Stanley estimated aggregate insured losses could approach $15 billion — roughly double the previous record set by the NotPetya attack of 2017.",
      'The critical question is whether insurers will invoke war exclusions. "Every major cyber policy has a war exclusion, and every one of them is going to be tested if attribution comes back to a state actor," said one senior underwriter.',
      "Consumer advocates warned that small-and-medium businesses face an extended period of operational disruption with no financial backstop.",
    ],
  },
};
