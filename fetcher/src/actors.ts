/**
 * Reference registry of well-documented threat actors.
 *
 * Only identity fields live here (name, common aliases, public attribution,
 * category). Everything shown as activity on the Threat Actor page — mention
 * counts, last seen, latest headline — is computed from the feeds at build time.
 *
 * `match` lists the strings searched for in headlines/summaries. Ambiguous
 * single words (e.g. "Play", "Snake", "Agenda") are deliberately qualified or
 * left out to avoid false matches.
 */
export interface ActorRef {
  id: string;
  name: string;
  aliases: string[];
  attribution: string;
  category: "Nation-state" | "Cybercrime" | "Ransomware" | "Hacktivist";
  match: string[];
}

export const ACTORS: ActorRef[] = [
  // People's Republic of China
  { id: "volt-typhoon", name: "Volt Typhoon", aliases: ["Bronze Silhouette", "Vanguard Panda"], attribution: "PRC", category: "Nation-state", match: ["Volt Typhoon", "Bronze Silhouette", "Vanguard Panda"] },
  { id: "salt-typhoon", name: "Salt Typhoon", aliases: ["GhostEmperor", "FamousSparrow", "Earth Estries"], attribution: "PRC", category: "Nation-state", match: ["Salt Typhoon", "GhostEmperor", "FamousSparrow", "Earth Estries"] },
  { id: "silk-typhoon", name: "Silk Typhoon", aliases: ["Hafnium"], attribution: "PRC", category: "Nation-state", match: ["Silk Typhoon", "Hafnium"] },
  { id: "apt41", name: "APT41", aliases: ["Wicked Panda", "Brass Typhoon", "Barium"], attribution: "PRC", category: "Nation-state", match: ["APT41", "APT 41", "Wicked Panda", "Brass Typhoon"] },
  { id: "apt40", name: "APT40", aliases: ["Leviathan", "Gingham Typhoon"], attribution: "PRC", category: "Nation-state", match: ["APT40", "APT 40", "Gingham Typhoon"] },
  { id: "mustang-panda", name: "Mustang Panda", aliases: ["Earth Preta", "TA416"], attribution: "PRC", category: "Nation-state", match: ["Mustang Panda", "Earth Preta", "TA416"] },
  { id: "unc3886", name: "UNC3886", aliases: [], attribution: "PRC", category: "Nation-state", match: ["UNC3886"] },
  // Russia
  { id: "sandworm", name: "Sandworm", aliases: ["APT44", "Seashell Blizzard", "Voodoo Bear"], attribution: "RUS", category: "Nation-state", match: ["Sandworm", "APT44", "Seashell Blizzard", "Voodoo Bear"] },
  { id: "apt28", name: "APT28", aliases: ["Fancy Bear", "Forest Blizzard", "Sofacy"], attribution: "RUS", category: "Nation-state", match: ["APT28", "APT 28", "Fancy Bear", "Forest Blizzard", "Sofacy"] },
  { id: "apt29", name: "APT29", aliases: ["Cozy Bear", "Midnight Blizzard", "Nobelium"], attribution: "RUS", category: "Nation-state", match: ["APT29", "APT 29", "Cozy Bear", "Midnight Blizzard", "Nobelium"] },
  { id: "turla", name: "Turla", aliases: ["Secret Blizzard", "Venomous Bear"], attribution: "RUS", category: "Nation-state", match: ["Turla", "Secret Blizzard", "Venomous Bear"] },
  { id: "gamaredon", name: "Gamaredon", aliases: ["Aqua Blizzard", "Primitive Bear"], attribution: "RUS", category: "Nation-state", match: ["Gamaredon", "Aqua Blizzard", "Primitive Bear"] },
  { id: "star-blizzard", name: "Star Blizzard", aliases: ["ColdRiver", "Callisto"], attribution: "RUS", category: "Nation-state", match: ["Star Blizzard", "ColdRiver", "Cold River"] },
  // North Korea
  { id: "lazarus", name: "Lazarus Group", aliases: ["Hidden Cobra", "Diamond Sleet"], attribution: "PRK", category: "Nation-state", match: ["Lazarus", "Hidden Cobra", "Diamond Sleet"] },
  { id: "kimsuky", name: "Kimsuky", aliases: ["APT43", "Emerald Sleet", "Velvet Chollima"], attribution: "PRK", category: "Nation-state", match: ["Kimsuky", "APT43", "Emerald Sleet", "Velvet Chollima"] },
  { id: "apt37", name: "APT37", aliases: ["ScarCruft", "Reaper"], attribution: "PRK", category: "Nation-state", match: ["APT37", "APT 37", "ScarCruft"] },
  { id: "andariel", name: "Andariel", aliases: ["Onyx Sleet"], attribution: "PRK", category: "Nation-state", match: ["Andariel", "Onyx Sleet"] },
  { id: "tradertraitor", name: "TraderTraitor", aliases: ["Jade Sleet", "UNC4899"], attribution: "PRK", category: "Nation-state", match: ["TraderTraitor", "Jade Sleet", "UNC4899"] },
  // Iran
  { id: "apt33", name: "APT33", aliases: ["Peach Sandstorm", "Elfin"], attribution: "IRN", category: "Nation-state", match: ["APT33", "APT 33", "Peach Sandstorm"] },
  { id: "oilrig", name: "OilRig", aliases: ["APT34", "Hazel Sandstorm", "Helix Kitten"], attribution: "IRN", category: "Nation-state", match: ["OilRig", "APT34", "Hazel Sandstorm", "Helix Kitten"] },
  { id: "muddywater", name: "MuddyWater", aliases: ["Mango Sandstorm", "Static Kitten"], attribution: "IRN", category: "Nation-state", match: ["MuddyWater", "Mango Sandstorm", "Static Kitten"] },
  { id: "charming-kitten", name: "Charming Kitten", aliases: ["APT35", "Mint Sandstorm", "Phosphorus"], attribution: "IRN", category: "Nation-state", match: ["Charming Kitten", "APT35", "Mint Sandstorm"] },
  { id: "cyberav3ngers", name: "CyberAv3ngers", aliases: [], attribution: "IRN", category: "Hacktivist", match: ["CyberAv3ngers", "Cyber Av3ngers"] },
  // Financially motivated
  { id: "scattered-spider", name: "Scattered Spider", aliases: ["UNC3944", "Octo Tempest", "0ktapus"], attribution: "—", category: "Cybercrime", match: ["Scattered Spider", "UNC3944", "Octo Tempest", "0ktapus"] },
  { id: "shinyhunters", name: "ShinyHunters", aliases: [], attribution: "—", category: "Cybercrime", match: ["ShinyHunters", "Shiny Hunters"] },
  { id: "lapsus", name: "LAPSUS$", aliases: ["DEV-0537", "Strawberry Tempest"], attribution: "—", category: "Cybercrime", match: ["LAPSUS$", "Lapsus", "Strawberry Tempest"] },
  { id: "fin7", name: "FIN7", aliases: ["Carbanak", "Sangria Tempest"], attribution: "—", category: "Cybercrime", match: ["FIN7", "Carbanak", "Sangria Tempest"] },
  { id: "ta505", name: "TA505", aliases: [], attribution: "—", category: "Cybercrime", match: ["TA505"] },
  { id: "evil-corp", name: "Evil Corp", aliases: ["Indrik Spider"], attribution: "—", category: "Cybercrime", match: ["Evil Corp", "Indrik Spider"] },
  { id: "noname057", name: "NoName057(16)", aliases: [], attribution: "—", category: "Hacktivist", match: ["NoName057", "NoName 057"] },
  // Ransomware operations
  { id: "lockbit", name: "LockBit", aliases: [], attribution: "—", category: "Ransomware", match: ["LockBit"] },
  { id: "akira", name: "Akira", aliases: [], attribution: "—", category: "Ransomware", match: ["Akira ransomware", "Akira gang", "Akira group", "Akira"] },
  { id: "qilin", name: "Qilin", aliases: [], attribution: "—", category: "Ransomware", match: ["Qilin"] },
  { id: "play", name: "Play", aliases: ["Playcrypt"], attribution: "—", category: "Ransomware", match: ["Play ransomware", "Playcrypt"] },
  { id: "black-basta", name: "Black Basta", aliases: [], attribution: "—", category: "Ransomware", match: ["Black Basta", "BlackBasta"] },
  { id: "clop", name: "Cl0p", aliases: ["Clop"], attribution: "—", category: "Ransomware", match: ["Cl0p", "Clop ransomware", "Clop gang", "Clop"] },
  { id: "ransomhub", name: "RansomHub", aliases: [], attribution: "—", category: "Ransomware", match: ["RansomHub"] },
  { id: "medusa", name: "Medusa", aliases: [], attribution: "—", category: "Ransomware", match: ["Medusa ransomware", "Medusa gang"] },
  { id: "rhysida", name: "Rhysida", aliases: [], attribution: "—", category: "Ransomware", match: ["Rhysida"] },
  { id: "alphv", name: "ALPHV", aliases: ["BlackCat"], attribution: "—", category: "Ransomware", match: ["ALPHV", "BlackCat ransomware"] },
  { id: "inc-ransom", name: "INC Ransom", aliases: [], attribution: "—", category: "Ransomware", match: ["INC Ransom"] },
  { id: "dragonforce", name: "DragonForce", aliases: [], attribution: "—", category: "Ransomware", match: ["DragonForce"] },
  { id: "safepay", name: "SafePay", aliases: [], attribution: "—", category: "Ransomware", match: ["SafePay ransomware", "SafePay gang"] },
  { id: "interlock", name: "Interlock", aliases: [], attribution: "—", category: "Ransomware", match: ["Interlock ransomware", "Interlock gang"] },
  { id: "bianlian", name: "BianLian", aliases: [], attribution: "—", category: "Ransomware", match: ["BianLian"] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const ACTOR_REGEXES = ACTORS.map((a) => ({
  id: a.id,
  // Case-sensitive for short all-caps designations (APT28, FIN7) to avoid noise; insensitive otherwise.
  re: new RegExp(`(?<![\\w-])(${a.match.map(escape).join("|")})(?![\\w-])`, a.match.every((m) => m.length > 5) ? "i" : ""),
}));

export function actorsIn(text: string): string[] {
  return ACTOR_REGEXES.filter(({ re }) => re.test(text)).map(({ id }) => id);
}
