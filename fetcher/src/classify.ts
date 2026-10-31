import type { SectionKey } from "../../client/src/types/edition.ts";
import { ACTOR_REGEXES } from "./actors.ts";

type Rule = { re: RegExp; w: number };

// Weighted keyword rules per section. Title hits count 3x body hits.
const RULES: Record<Exclude<SectionKey, "general">, Rule[]> = {
  ransomware: [
    { re: /\bransomware\b/i, w: 3 },
    { re: /\b(extortion|ransom (demand|payment|note)s?|double[- ]extortion|leak site)\b/i, w: 2 },
    { re: /\b(lockbit|akira|qilin|black ?basta|cl0p|clop|rhysida|ransomhub|medusa ransomware|play ransomware|bianlian|dragonforce|inc ransom|safepay|interlock|alphv|blackcat|hunters international)\b/i, w: 3 },
    { re: /\bencrypt(ed|s|ing)? (files|systems|servers|data)\b/i, w: 1 },
  ],
  zeroday: [
    { re: /\b(zero[- ]day|0[- ]day|0day)s?\b/i, w: 3 },
    { re: /\b(actively exploited|exploited in the wild|in[- ]the[- ]wild|under active exploitation|mass[- ]exploit\w*)\b/i, w: 3 },
    { re: /\b(exploit(s|ed|ation)?|proof[- ]of[- ]concept|PoC)\b/i, w: 1.5 },
    { re: /\b(remote code execution|RCE|pre-auth|unauthenticated)\b/i, w: 1 },
  ],
  breaches: [
    { re: /\b(data )?breach(es|ed)?\b/i, w: 3 },
    { re: /\b(data leak|leaked|exposed (data|records|database)|stolen data|data theft|records exposed)\b/i, w: 2.5 },
    { re: /\b(customer|patient|personal|employee) (data|information|records)\b/i, w: 1.5 },
    { re: /\b(class action|notif(y|ies|ied) (customers|users|patients)|compromised accounts)\b/i, w: 1.5 },
    { re: /\b(hack(ed|ers)?|cyberattack|intrusion)\b/i, w: 0.5 },
  ],
  vulns: [
    { re: /\bCVE-\d{4}-\d{4,7}\b/i, w: 2 },
    { re: /\b(vulnerabilit(y|ies)|flaws?|bugs?)\b/i, w: 2 },
    { re: /\b(patch(es|ed)?|security updates?|advisor(y|ies)|patch tuesday|hotfix|fixes)\b/i, w: 2 },
    { re: /\b(CVSS|KEV|privilege escalation|buffer overflow|deserialization|SQL injection|XSS)\b/i, w: 1.5 },
  ],
  actors: [
    { re: /\b(APT ?\d{1,3}|UNC\d{3,5}|threat actors?|state[- ](sponsored|backed)|nation[- ]state|espionage|hacking group|threat group)\b/i, w: 2.5 },
    { re: /\b(campaign|malware|backdoor|infostealer|stealer|botnet|loader|RAT|trojan|implant|spyware|rootkit|wiper)\b/i, w: 1.5 },
    { re: /\b(phishing|spear-?phishing|watering hole|supply[- ]chain attack)\b/i, w: 1 },
  ],
  policy: [
    { re: /\b(arrest(ed|s)?|extradit\w+|sentenced|indicted|charged|pleads? guilty|convicted|takedown|seized|dismantled|sanction(s|ed))\b/i, w: 2.5 },
    { re: /\b(Europol|Interpol|FBI|DOJ|Justice Department|NCA|law enforcement|police)\b/i, w: 1.5 },
    { re: /\b(regulat\w+|legislation|lawmakers|GDPR|NIS ?2|DORA|SEC (rule|disclosure)|executive order|fined?|penalt(y|ies)|compliance)\b/i, w: 2 },
  ],
};

const PRIORITY: Exclude<SectionKey, "general">[] = ["ransomware", "zeroday", "breaches", "policy", "actors", "vulns"];
const MIN_SCORE = 2.5;

export function classify(title: string, body: string): { section: SectionKey; tags: SectionKey[]; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const key of PRIORITY) {
    let s = 0;
    for (const { re, w } of RULES[key]) {
      if (re.test(title)) s += w * 3;
      if (re.test(body)) s += w;
    }
    if (key === "actors" && ACTOR_REGEXES.some(({ re }) => re.test(title) || re.test(body))) s += 4;
    scores[key] = s;
  }
  const tags = PRIORITY.filter((k) => scores[k] >= MIN_SCORE);
  let section: SectionKey = "general";
  let best = 0;
  for (const k of PRIORITY) {
    if (scores[k] >= MIN_SCORE && scores[k] > best) {
      best = scores[k];
      section = k;
    }
  }
  return { section, tags, scores };
}

/** Lexicon for the Community Signal board. Matched against titles (+ short summary). */
export const TOPIC_LEXICON: { id: string; label: string; re: RegExp }[] = [
  { id: "ransomware", label: "Ransomware", re: /\bransomware\b/i },
  { id: "zeroday", label: "Zero-days", re: /\b(zero[- ]day|0[- ]day|0day)s?\b/i },
  { id: "exploited", label: "Active exploitation", re: /\b(actively exploited|exploited in the wild|under active exploitation)\b/i },
  { id: "breach", label: "Data breaches", re: /\b(data breach|breach(ed)?|data leak|leaked data)\b/i },
  { id: "phishing", label: "Phishing", re: /\b(phishing|smishing|vishing)\b/i },
  { id: "supply", label: "Supply chain", re: /\b(supply[- ]chain|malicious (npm|pypi|package)s?|npm|pypi|typosquat\w*)\b/i },
  { id: "ai", label: "AI & LLMs", re: /\b(AI|LLMs?|ChatGPT|OpenAI|Anthropic|Claude|Gemini|Copilot|agentic|prompt injection|deepfakes?)\b/ },
  { id: "infostealer", label: "Infostealers", re: /\b(info-?stealers?|stealer malware|credential theft)\b/i },
  { id: "botnet", label: "Botnets & DDoS", re: /\b(botnets?|DDoS)\b/i },
  { id: "espionage", label: "State espionage", re: /\b(espionage|state[- ](sponsored|backed)|nation[- ]state|APT ?\d+)\b/i },
  { id: "edge", label: "Edge devices & VPNs", re: /\b(Fortinet|FortiGate|FortiOS|Ivanti|Citrix|NetScaler|Palo Alto|PAN-OS|SonicWall|Cisco ASA|Juniper|VPN appliances?|firewalls?)\b/i },
  { id: "browser", label: "Browsers", re: /\b(Chrome|Chromium|Firefox|Safari|WebKit)\b/ },
  { id: "windows", label: "Windows", re: /\bWindows\b/ },
  { id: "linux", label: "Linux", re: /\b(Linux|kernel)\b/i },
  { id: "mobile", label: "Mobile & spyware", re: /\b(iOS|iPhone|Android|spyware|Pegasus)\b/ },
  { id: "cloud", label: "Cloud", re: /\b(AWS|Azure|Google Cloud|GCP|S3 buckets?|Kubernetes|cloud)\b/i },
  { id: "identity", label: "Identity & MFA", re: /\b(MFA|2FA|passkeys?|OAuth|SSO|Okta|Entra|passwords?)\b/i },
  { id: "crypto", label: "Crypto theft", re: /\b(crypto(currency)? (theft|heist|stolen)|DeFi|wallet drainer|bitcoin|ethereum)\b/i },
  { id: "lawenf", label: "Arrests & takedowns", re: /\b(arrest(ed|s)?|extradit\w+|takedown|seized|sentenced|indicted|charged|Europol|FBI|DOJ)\b/i },
  { id: "policy", label: "Policy & regulation", re: /\b(regulat\w+|legislation|GDPR|NIS2|SEC rules?|executive order|CISA director|lawmakers|bill would)\b/i },
  { id: "privacy", label: "Privacy & surveillance", re: /\b(privacy|surveillance|tracking|data brokers?)\b/i },
  { id: "patch", label: "Patch releases", re: /\b(patch tuesday|security updates?|patches|patched)\b/i },
];
