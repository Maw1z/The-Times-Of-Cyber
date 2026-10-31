import type { ReactNode } from "react";
import type { ActivityLevel, ActorRow, Advisory, Edition, Ghsa, Ioc, KevEntry, NvdCve, SigmaRule, TopicRow, Trend, Victim } from "../types/edition";
import { Badge, Cve, ExtLink, SeverityBadge, type BadgeTone } from "../components/Primitives";
import { CommunityItem } from "../components/CommunityItem";
import { PAGES, type SectionId } from "../pages/registry";
import { ago, compact, countryName, daysUntil, editionName, editionNumber, longDate, pct, plural, shortDate, timeUTC, titleCase } from "../lib/format";
import { Flow, type Item } from "./flow";
import { GAP, banner, bars, block, boxTitle, card, clip, empty, image, list, note, para, table, useNav, Byline, StoryLine, type Col } from "./kit";

/** Build the whole paper as one flow of items at content width `cw`. */
export function buildFlow(e: Edition, now: number, cw: number): Item[] {
  const f = new Flow(cw, now);
  front(f, e);
  vulns(f, e);
  detection(f, e);
  iocs(f, e);
  ransomware(f, e);
  threats(f, e);
  briefs(f, e);
  return f.items;
}

// ═════════════════════════════ A1 · FRONT PAGE ═════════════════════════════

const INFOCON: Record<string, string> = { green: "Green", yellow: "Yellow", orange: "Orange", red: "Red" };

function Masthead({ e, cw }: { e: Edition; cw: number }) {
  const infocon = e.community.isc.infocon;
  return (
    <header>
      <div className="border-t-[4px] border-[var(--ink)] pt-1.5 flex justify-between gap-3 font-Libre text-[11px] leading-[1.35] text-[var(--ink-2)]">
        <span className="italic">“All the News That’s Fit to Print”</span>
        <span className="text-right">
          ISC InfoCon: <strong className="uppercase">{infocon ? (INFOCON[infocon] ?? infocon) : "n/a"}</strong> · {e.stats.sourcesOk}/{e.stats.sourcesTotal} sources live
        </span>
      </div>
      <h1 className="ink-xl font-Aktura font-normal leading-none m-0 pt-3 pb-1 text-center whitespace-nowrap" style={{ fontSize: Math.round(Math.min(64, cw * 0.106)) }}>
        The Times of Cyber
      </h1>
      <div className="mt-2 border-t border-[var(--rule)] border-b-[4px] border-b-[var(--ink)] [border-bottom-style:double] py-1 flex flex-wrap justify-between gap-x-3 font-Libre text-[10.5px] uppercase tracking-[0.05em] text-[var(--ink-2)]">
        <span>Vol. I · No. {editionNumber(e.generatedAt)}</span>
        <span>{longDate(e.generatedAt)}</span>
        <span>
          {editionName(e.generatedAt)} · {timeUTC(e.generatedAt)}
        </span>
      </div>
    </header>
  );
}

/** "Inside today" — section index with page numbers; tapping one turns to it. */
function InsideIndex({ cw }: { cw: number }) {
  const nav = useNav();
  return (
    <nav aria-label="Sections">
      <p className="kicker m-0 mb-1 text-[var(--ink)]">Inside today</p>
      <div className="grid gap-x-6" style={{ gridTemplateColumns: cw >= 420 ? "1fr 1fr" : "1fr" }}>
        {PAGES.slice(1).map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            onClick={(ev) => {
              ev.preventDefault();
              nav.goTo(p.id);
            }}
            className="flex items-baseline gap-1.5 font-Libre text-[13px] leading-[22px] border-b border-dotted border-[var(--rule)] cursor-pointer"
          >
            <strong className="font-[family-name:var(--font-label)] text-[11px] tracking-[0.06em]">{p.code}</strong>
            <span className="truncate min-w-0">{p.title}</span>
            {nav.mode === "book" && <span className="ml-auto shrink-0 whitespace-nowrap meta tabular-nums">p. {nav.secPage[p.id] ?? "00"}</span>}
          </a>
        ))}
      </div>
    </nav>
  );
}

function front(f: Flow, e: Edition) {
  f.section("a1");
  const { lead, top } = e.front;
  const { actNow, vulns: v, ransomware: rw, iocs: io, community } = e;
  block(f, "masthead", <Masthead e={e} cw={f.cw} />, { gap: 0 });
  block(f, "index", <InsideIndex cw={f.cw} />, { gap: 14 });

  block(
    f,
    "actnow",
    <div className="border-y-[3px] border-double border-[var(--ink)] py-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
      <h2 className="ink-display m-0 font-Libre font-bold uppercase text-[24px] leading-none tracking-[-0.01em]">Act now</h2>
      <span className="meta">What needs attention this shift · last 72 hours</span>
    </div>,
    { gap: 20, keep: true },
  );

  const kc = boxTitle(f, "kev", "Added to CISA KEV", v.kev ? `${v.kev.addedLast7d} this week` : undefined, 12);
  if (actNow.kev.length)
    list(
      f,
      "kev",
      actNow.kev.slice(0, 6),
      (k) => {
        const due = daysUntil(k.dueDate, f.now);
        return (
          <>
            <Cve id={k.cve} /> {k.ransomware && <Badge tone="solid">Ransomware</Badge>}
            <span className="font-Libre text-[13.5px]">
              {" "}
              {k.vendor} {k.product}
            </span>
            <div className="meta">
              {k.cvss ? `CVSS ${k.cvss.score.toFixed(1)} · ` : ""}Patch by {shortDate(k.dueDate)}{" "}
              <strong className="text-[var(--ink)]">({due < 0 ? `${-due}d overdue` : `${due}d left`})</strong>
            </div>
          </>
        );
      },
      kc,
      (k) => k.cve,
    );
  else empty(f, "kev", "No additions to the KEV catalogue in the last 72 hours.");

  const xc = boxTitle(f, "exploited", "Exploited in the wild");
  if (actNow.exploited.length)
    list(
      f,
      "exploited",
      actNow.exploited,
      (s) => (
        <>
          <ExtLink href={s.link} className="font-Libre font-bold text-[14.5px] leading-[1.35]">
            {s.title}
          </ExtLink>
          <div className="meta">
            {s.source} · {ago(s.published, f.now)}
            {s.cves?.length ? ` · ${s.cves.slice(0, 2).join(", ")}` : ""}
          </div>
        </>
      ),
      xc,
      (s) => s.id,
    );
  else empty(f, "exploited", "No zero-day or in-the-wild exploitation reporting in the feeds.");

  const ac = boxTitle(f, "crit", "Critical vendor advisories");
  if (actNow.criticalAdvisories.length) list(f, "crit", actNow.criticalAdvisories, (a) => <AdvisoryLine a={a} now={f.now} />, ac, (a) => a.id);
  else empty(f, "crit", "No critical-rated advisories from tracked vendors in the last 72 hours.");

  // Lead story
  if (lead) {
    f.add({
      key: "a1-lead-head",
      gap: GAP.section,
      keep: true,
      node: (
        <div className="rule-double pt-3">
          <p className="kicker m-0 mb-1">Lead story</p>
          <h3 className="font-Libre font-bold text-[30px] leading-[1.1] tracking-[-0.01em] m-0 mb-1.5" style={{ textWrap: "balance" }}>
            <ExtLink href={lead.link}>{lead.title}</ExtLink>
          </h3>
          <Byline story={lead} now={f.now} />
        </div>
      ),
    });
    if (lead.image) image(f, "lead-img", lead.image.src, lead.image.alt, `Image: ${lead.source}`, { min: 200, pref: 270, max: 360 });
    lead.body.forEach((p, i) => para(f, `lead-p${i}`, p, { dropcap: i === 0, gap: i === 0 ? 12 : GAP.para }));
    block(
      f,
      "lead-more",
      <div>
        <p className="meta m-0">
          <ExtLink href={lead.link} className="font-bold text-[var(--ink)]">
            Read the full story at {lead.domain} →
          </ExtLink>
        </p>
        <AlsoAndTags story={lead} />
      </div>,
      { gap: 4 },
    );
  } else empty(f, "lead", "No news feed returned stories for this edition.");

  // At a glance
  const pt = v.patchTuesday;
  const tf = io.threatfox;
  const glance = [
    <Glance key="pt" title="Patch Tuesday" right={pt?.id}>
      {pt ? (
        <>
          <strong className="text-[22px]">{pt.total}</strong> CVEs · <strong>{pt.critical}</strong> critical · <strong>{pt.exploited.length}</strong> exploited
          {pt.exploited[0] && (
            <div className="meta mt-1 clamp-2">
              <Cve id={pt.exploited[0].cve} /> {pt.exploited[0].title}
            </div>
          )}
        </>
      ) : (
        <i>MSRC data unavailable.</i>
      )}
    </Glance>,
    <Glance key="scan" title="Internet scanning" right="SANS ISC · 24h">
      {community.isc.topPorts.length ? (
        community.isc.topPorts.slice(0, 4).map((p, i) => (
          <div key={p.port} className="flex justify-between border-b border-dotted border-[var(--rule-light)] text-[13px]">
            <span>
              {i + 1}. Port <strong>{p.port}</strong>
            </span>
            <span className="text-[var(--ink-3)]">{compact(p.records)}</span>
          </div>
        ))
      ) : (
        <i>DShield port data unavailable.</i>
      )}
    </Glance>,
    <Glance key="rw" title="Ransomware" right={rw.desk ? `${rw.desk.windowDays} days` : undefined}>
      {rw.desk ? (
        <>
          <strong className="text-[22px]">{rw.desk.total}</strong> victims posted to leak sites.
          {rw.desk.byGroup[0] && (
            <>
              {" "}
              Most active: <strong className="capitalize">{rw.desk.byGroup[0].name}</strong> ({rw.desk.byGroup[0].count}).
            </>
          )}
        </>
      ) : (
        <i>ransomware.live unavailable.</i>
      )}
    </Glance>,
    <Glance key="ioc" title="IOC wire" right="ThreatFox · 24h">
      {tf ? (
        <>
          <strong className="text-[22px]">{tf.total}</strong> new indicators.
          {tf.families[0] && (
            <>
              {" "}
              Top family: <strong>{tf.families[0].name}</strong> ({tf.families[0].count}).
            </>
          )}
        </>
      ) : (
        <i>{io.missingKey ? "Needs a free abuse.ch Auth-Key." : "ThreatFox unavailable."}</i>
      )}
    </Glance>,
  ];
  block(f, "glance-title", <p className="kicker m-0 text-[var(--ink)] rule-double pt-2">At a glance</p>, { gap: GAP.section, keep: true });
  const perRow = f.cw >= 420 ? 2 : 1;
  for (let i = 0; i < glance.length; i += perRow)
    block(
      f,
      `glance-${i}`,
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0,1fr))` }}>
        {glance.slice(i, i + perRow)}
      </div>,
      { gap: i === 0 ? 8 : 16 },
    );

  boxTitle(f, "top", "Top stories");
  top.forEach((s, i) => card(f, s, { size: i === 0 ? "md" : "sm", first: i === 0, image: i === 0 && !!s.image }));
}

function Glance({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between border-b-2 border-[var(--ink)] pb-0.5 mb-1.5">
        <span className="font-[family-name:var(--font-label)] text-[11.5px] font-bold uppercase tracking-[0.12em]">{title}</span>
        {right && <span className="meta">{right}</span>}
      </div>
      <div className="font-Libre text-[13.5px] leading-[1.4]">{children}</div>
    </div>
  );
}

function AlsoAndTags({ story }: { story: Edition["front"]["top"][number] }) {
  const also = story.alsoReportedBy ?? [];
  const tags = [...(story.actors ?? []).slice(0, 3), ...(story.cves ?? []).slice(0, 3), ...(story.techniques ?? []).slice(0, 4)];
  return (
    <>
      {also.length > 0 && (
        <p className="meta m-0 mt-1">
          Also reported by {also.slice(0, 4).map((a) => a.source).join(", ")}
          {also.length > 4 && ` and ${also.length - 4} more`}
        </p>
      )}
      {tags.length > 0 && (
        <div className="mt-1">
          {tags.map((t) => (
            <Badge key={t} tone="outline">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}

function AdvisoryLine({ a, now }: { a: Advisory; now: number }) {
  return (
    <>
      <span className="kicker text-[var(--ink)]">{a.vendor}</span> <SeverityBadge level={a.severity} />
      <div>
        <ExtLink href={a.link} className="font-Libre font-bold text-[14.5px] leading-[1.35]">
          {a.title}
        </ExtLink>
      </div>
      <div className="meta">
        {ago(a.published, now)}
        {a.cves.length > 0 && (
          <>
            {" "}
            · {a.cves.slice(0, 3).join(", ")}
            {a.cves.length > 3 ? ` +${a.cves.length - 3}` : ""}
          </>
        )}
      </div>
    </>
  );
}

// ═════════════════════════ A2 · VULNERABILITIES & PATCHES ═════════════════════

const cvss = (c?: { score: number; version: string }) =>
  c ? (
    <span className="font-bold" title={`CVSS v${c.version}`}>
      {c.score.toFixed(1)}
    </span>
  ) : (
    <span className="text-[var(--ink-3)]">—</span>
  );
const epss = (e?: { score: number; percentile: number }) => (e ? <span title={`Percentile ${pct(e.percentile, 0)}`}>{pct(e.score)}</span> : <span className="text-[var(--ink-3)]">—</span>);

function vulns(f: Flow, e: Edition) {
  f.section("a2");
  const { kev, nvd, advisories, patchTuesday: pt, ghsa, stories, nvdWindowHours } = e.vulns;
  banner(
    f,
    kev
      ? `${kev.addedLast7d} added to CISA's exploited list this week · ${nvd.length} new critical CVEs · ${advisories.length} vendor advisories`
      : `${nvd.length} new critical CVEs · ${advisories.length} vendor advisories`,
  );

  boxTitle(f, "kev", "Known exploited — newest in CISA KEV", kev ? `${kev.catalogCount.toLocaleString("en-US")} in catalogue` : undefined, 18);
  if (kev) {
    const cols: Col<KevEntry>[] = [
      { h: "CVE", w: 112, cell: (k) => <Cve id={k.cve} /> },
      {
        h: "Vulnerability",
        cell: (k) => (
          <>
            <strong>
              {k.vendor} {k.product}
            </strong>{" "}
            {k.ransomware && <Badge tone="solid">Ransomware</Badge>}
            {k.ssvc?.automatable === "yes" && <Badge tone="outline">Automatable</Badge>}
            <div className="text-[12.5px] text-[var(--ink-2)] clamp-2">{k.description}</div>
          </>
        ),
      },
      {
        h: "Due",
        w: 62,
        cell: (k) => {
          const d = daysUntil(k.dueDate, f.now);
          return (
            <>
              {shortDate(k.dueDate)}
              <div className="meta">{d < 0 ? `${-d}d late` : `${d}d left`}</div>
            </>
          );
        },
      },
      { h: "CVSS", w: 38, align: "right", cell: (k) => cvss(k.cvss) },
      { h: "EPSS", w: 48, align: "right", cell: (k) => epss(k.epss), min: 440 },
    ];
    table(f, "kev", cols, kev.entries, (k) => k.cve);
    note(f, "kev", `CVSS from the CVE record; EPSS = chance of exploitation in the next 30 days (FIRST). Due = CISA's federal deadline. ${kev.ransomwareLinkedLast30d} ransomware-linked additions in 30 days.`);
  } else empty(f, "kev", "The KEV catalogue could not be fetched.");

  boxTitle(f, "pt", "Microsoft Patch Tuesday", pt ? <ExtLink href={pt.url}>{pt.id} notes →</ExtLink> : undefined);
  if (pt) {
    block(
      f,
      "pt-stats",
      <div className="grid grid-cols-4 gap-2 text-center">
        {(
          [
            [pt.total, "CVEs"],
            [pt.critical, "Critical"],
            [pt.exploited.length, "Exploited"],
            [pt.moreLikely, "More likely"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="border border-[var(--rule)] py-1.5">
            <div className="font-Libre font-bold text-[22px] leading-none">{n}</div>
            <div className="kicker mt-1 text-[9.5px]">{l}</div>
          </div>
        ))}
      </div>,
      { gap: 8 },
    );
    if (pt.exploited.length) {
      block(f, "pt-x-k", <p className="kicker m-0 text-[var(--ink)]">Exploited zero-days</p>, { keep: true, gap: 12 });
      list(f, "pt-x", pt.exploited, (x) => <span className="font-Libre text-[13.5px]"><Cve id={x.cve} /> — {x.title}</span>, undefined, (x) => x.cve);
    }
    if (pt.topCritical.length) {
      block(f, "pt-c-k", <p className="kicker m-0 text-[var(--ink)]">Critical</p>, { keep: true, gap: 12 });
      list(
        f,
        "pt-c",
        pt.topCritical,
        (x) => (
          <span className="font-Libre text-[13.5px]">
            <Cve id={x.cve} /> — {x.title}
            {x.cvss ? <span className="meta"> · CVSS {x.cvss.toFixed(1)}</span> : null}
          </span>
        ),
        undefined,
        (x) => x.cve,
      );
    }
    note(f, "pt", `By impact: ${pt.byImpact.map((b) => `${b.impact} ${b.count}`).join(" · ")}`);
  } else empty(f, "pt", "Microsoft's MSRC API could not be reached.");

  const advc = boxTitle(f, "adv", "Vendor security advisories", "10 days · critical first");
  if (advisories.length) list(f, "adv", advisories.slice(0, 12), (a) => <AdvisoryLine a={a} now={f.now} />, advc, (a) => a.id);
  else empty(f, "adv", "No advisories from Cisco, Palo Alto, Fortinet, CISA ICS or Chrome in the last 10 days.");

  boxTitle(f, "nvd", `New critical CVEs · ${nvdWindowHours} hours`, "NVD · CVSS ≥ 9 or KEV");
  if (nvd.length) {
    const cols: Col<NvdCve>[] = [
      { h: "CVE", w: 112, cell: (c) => <Cve id={c.cve} /> },
      {
        h: "Description",
        cell: (c) => (
          <>
            {c.kev && <Badge tone="solid">KEV</Badge>}
            {c.vendorProducts.length > 0 && <strong className="capitalize">{c.vendorProducts.slice(0, 2).join(", ")} — </strong>}
            <span className="text-[12.5px]">{clip(c.description, 170)}</span>
          </>
        ),
      },
      { h: "CWE", w: 70, cell: (c) => <span className="mono">{c.cwes[0] ?? "—"}</span>, min: 520 },
      { h: "CVSS", w: 38, align: "right", cell: (c) => cvss(c.cvss) },
      { h: "EPSS", w: 48, align: "right", cell: (c) => epss(c.epss), min: 440 },
    ];
    table(f, "nvd", cols, nvd.slice(0, 15), (c) => c.cve);
    note(f, "nvd", "NVD's own scoring often lags; where it's missing the CNA's score is shown.");
  } else empty(f, "nvd", "No critical CVEs published in this window (or NVD was unreachable).");

  boxTitle(f, "news", "Exploitation & patch news");
  if (stories.length) stories.slice(0, 10).forEach((s, i) => card(f, s, { size: i < 2 ? "md" : "sm", image: i === 0, first: i === 0 }));
  else empty(f, "news", "No vulnerability or exploitation reporting in the feeds.");

  const gc = boxTitle(f, "ghsa", "Supply chain — open-source packages", "GitHub · critical · 7 days");
  if (ghsa.length)
    list(
      f,
      "ghsa",
      ghsa.slice(0, 10),
      (g: Ghsa) => (
        <>
          <ExtLink href={g.link} className="font-Libre font-bold text-[14px] leading-[1.35]">
            {g.summary}
          </ExtLink>
          <div className="meta">
            {g.ecosystems.join(", ")} · {g.packages.join(", ")}
            {g.cvss ? ` · CVSS ${g.cvss.toFixed(1)}` : ""} · {g.cve ?? g.id}
          </div>
        </>
      ),
      gc,
      (g) => g.id,
    );
  else empty(f, "ghsa", "No critical reviewed advisories for open-source packages this week.");
}

// ═════════════════════════════ A3 · DETECTION DESK ═════════════════════════════

const tactic = (t: string) => titleCase(t.replace(/-/g, " "));
const techLink = (id: string) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}`;

function detection(f: Flow, e: Edition) {
  f.section("a3");
  const { sigma, sigmaWindowDays, releases, techniques, techniqueOfWeek: t, attackVersion } = e.detection;
  banner(f, `${sigma.length} new Sigma rules · ${techniques.length} ATT&CK techniques in the news · ${releases.length} content releases`);

  if (t) {
    f.add({
      key: "a3-tow-head",
      gap: 18,
      keep: true,
      node: (
        <div>
          <p className="kicker m-0">Technique of the week</p>
          <h3 className="font-Libre font-bold text-[30px] leading-[1.08] m-0 mt-1 mb-1" style={{ textWrap: "balance" }}>
            <ExtLink href={t.url}>{t.name}</ExtLink>
          </h3>
          <p className="meta m-0">
            <span className="mono font-bold text-[var(--ink)]">{t.id}</span> · {t.tactics.map(tactic).join(", ")} · {t.platforms.slice(0, 4).join(", ")}
            {t.platforms.length > 4 ? "…" : ""} · used by {plural(t.groups, "tracked group")}
          </p>
          <p className="meta italic m-0 mt-0.5">{t.why}</p>
        </div>
      ),
    });
    t.description
      .split(/\n+/)
      .filter(Boolean)
      .forEach((p, i) => para(f, `tow-p${i}`, p, { gap: i === 0 ? 10 : GAP.para }));

    if (t.detection.length) {
      block(f, "tow-detect", <p className="kicker m-0 text-[var(--ink)]">How to detect it</p>, { keep: true, gap: 18 });
      t.detection.slice(0, 2).forEach((d, di) => {
        block(f, `tow-d${di}`, <p className="font-Libre font-bold text-[15px] leading-[1.35] m-0">{d.name}</p>, { keep: true, gap: di ? 14 : 6 });
        d.analytics.slice(0, 3).forEach((a, ai) =>
          block(
            f,
            `tow-d${di}-a${ai}`,
            <div className="tint border border-[var(--rule-light)]">
              <div className="bg-[var(--paper)] m-[5px] p-3">
                <p className="kicker m-0 mb-1">{a.platforms.join(", ") || "Any platform"}</p>
                <p className="font-Libre text-[13.5px] leading-[1.55] m-0">{a.text}</p>
                {a.logSources.length > 0 && (
                  <p className="m-0 mt-1.5 text-[12.5px]">
                    <span className="kicker">Log sources </span>
                    {a.logSources.slice(0, 6).map((l) => (
                      <span key={l} className="mono inline-block mr-3">
                        {l}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>,
            { gap: 8 },
          ),
        );
      });
    }
    if (t.mitigations.length) {
      const mc = boxTitle(f, "mit", "Mitigations");
      list(f, "mit", t.mitigations, (m) => <span className="font-Libre text-[13.5px]">{m}</span>, mc, (m) => m);
    }
    note(
      f,
      "tow",
      <>
        Source: MITRE ATT&CK v{attackVersion} detection strategies.{" "}
        <ExtLink href={t.url} className="underline">
          Full entry →
        </ExtLink>
      </>,
    );
  } else empty(f, "tow", "ATT&CK data unavailable.");

  boxTitle(f, "sigma", `New Sigma rules · last ${sigmaWindowDays} days`, <ExtLink href="https://github.com/SigmaHQ/sigma">SigmaHQ →</ExtLink>);
  if (sigma.length) {
    const cols: Col<SigmaRule>[] = [
      {
        h: "Rule",
        cell: (r) => (
          <>
            <ExtLink href={r.link} className="font-bold">
              {r.title}
            </ExtLink>
            <div className="meta">
              <span className="mono">{r.logsource}</span>
              {r.folder !== "rules" && <> · {titleCase(r.folder.replace("rules-", "").replace(/-/g, " "))}</>}
            </div>
            {r.techniques.length > 0 && (
              <div className="mt-0.5">
                {r.techniques.slice(0, 4).map((x) => (
                  <a key={x} href={techLink(x)} target="_blank" rel="noopener noreferrer">
                    <Badge tone="faint">{x}</Badge>
                  </a>
                ))}
              </div>
            )}
          </>
        ),
      },
      { h: "Level", w: 70, cell: (r) => <SeverityBadge level={r.level} /> },
    ];
    table(f, "sigma", cols, sigma, (r) => r.link);
    note(f, "sigma", "Convert Sigma to your SIEM's language with sigma-cli / pySigma backends (KQL, SPL, ES|QL…).");
  } else empty(f, "sigma", "No rule files were added to SigmaHQ in this window (or GitHub was unreachable).");

  const tc = boxTitle(f, "tech", "ATT&CK techniques in the news", "mentions · 7 days");
  if (techniques.length)
    bars(
      f,
      "tech",
      techniques.slice(0, 10).map((m) => ({ name: m.id, count: m.mentions })),
      (id) => {
        const m = techniques.find((x) => x.id === id)!;
        return (
          <ExtLink href={m.url}>
            <span className="mono font-bold">{m.id}</span> {m.name}
          </ExtLink>
        );
      },
      tc,
    );
  else empty(f, "tech", "No ATT&CK technique IDs were cited in this week's feeds.");

  const rc = boxTitle(f, "rel", "Detection content releases", "last 45 days");
  if (releases.length)
    list(
      f,
      "rel",
      releases,
      (r) => (
        <>
          <span className="kicker text-[var(--ink)]">{r.label}</span>{" "}
          <ExtLink href={r.link} className="font-Libre font-bold text-[14px]">
            {r.name}
          </ExtLink>{" "}
          <span className="meta">· {ago(r.published, f.now)}</span>
          {r.summary && <div className="font-Libre text-[13px] text-[var(--ink-2)] clamp-2">{r.summary}</div>}
        </>
      ),
      rc,
      (r) => r.repo,
    );
  else empty(f, "rel", "No releases from tracked detection repos in the last 45 days.");
}

// ═════════════════════════════════ A4 · IOC WIRE ═════════════════════════════════

const iocCols = (f: Flow, conf: boolean): Col<Ioc>[] => [
  {
    h: "Indicator (defanged)",
    cell: (i) => (
      <span className="mono break-all" title="Defanged — re-fang deliberately before use in tooling">
        {i.value}
      </span>
    ),
  },
  { h: "Malware", w: 112, cell: (i) => <strong className="break-words">{i.malware}</strong> },
  ...(conf ? [{ h: "Conf.", w: 42, align: "right" as const, cell: (i: Ioc) => (i.confidence != null ? `${i.confidence}%` : "—"), min: 440 }] : []),
  { h: "Seen", w: 58, cell: (i) => ago(i.firstSeen, f.now), min: 500 },
];

function iocs(f: Flow, e: Edition) {
  f.section("a4");
  const { threatfox, urlhaus, feodo, missingKey } = e.iocs;
  banner(
    f,
    threatfox
      ? `${threatfox.total} fresh indicators in 24 hours · ${threatfox.families.length} malware families${feodo ? ` · ${feodo.online} botnet C2s online` : ""}`
      : "Fresh indicators from abuse.ch",
  );
  block(
    f,
    "warn",
    <p className="font-Libre italic text-[13.5px] leading-[1.5] text-[var(--ink-2)] m-0 border-l-4 border-[var(--ink)] pl-3">
      Every indicator is <strong>defanged</strong> (<span className="mono">hxxp</span>, <span className="mono">[.]</span>). Community feeds carry false positives — check context and
      confidence before blocking, and hunt in your own telemetry first.
    </p>,
    { gap: 18 },
  );
  if (missingKey)
    block(
      f,
      "key",
      <div className="tint border border-[var(--ink)]">
        <div className="bg-[var(--paper)] m-[6px] p-3 font-Libre text-[13.5px] leading-[1.5]">
          <strong>ThreatFox and URLhaus need a free abuse.ch Auth-Key.</strong> Sign up at{" "}
          <ExtLink href="https://auth.abuse.ch/" className="underline">
            auth.abuse.ch
          </ExtLink>
          , then set <span className="mono">ABUSECH_AUTH_KEY</span> and re-run the fetch.
        </div>
      </div>,
      { gap: 14 },
    );

  const fc = boxTitle(f, "fam", "ThreatFox · malware families", "IOCs · 24h");
  if (threatfox) bars(f, "fam", threatfox.families.slice(0, 10), undefined, fc);
  else empty(f, "fam", missingKey ? "Waiting for an Auth-Key." : "ThreatFox could not be reached.");
  if (threatfox?.samples.length) {
    boxTitle(f, "tf", "ThreatFox · one high-confidence indicator per family");
    table(f, "tf", iocCols(f, true), threatfox.samples, (i) => i.value);
  }

  boxTitle(f, "feodo", "Botnet C2 servers", "Feodo Tracker");
  if (feodo) {
    block(
      f,
      "feodo-n",
      <p className="font-Libre text-[14px] m-0">
        <strong className="text-[22px]">{feodo.online}</strong> C2 servers currently online.
      </p>,
      { gap: 6 },
    );
    bars(f, "feodo", feodo.byMalware);
    if (feodo.samples.length) table(f, "feodo", iocCols(f, false), feodo.samples, (i) => i.value);
  } else empty(f, "feodo", `Feodo Tracker could not be reached${missingKey ? " (it may also require the Auth-Key)" : ""}.`);

  boxTitle(f, "uh", "Malware distribution URLs", "URLhaus · latest 1,000");
  if (urlhaus) {
    block(
      f,
      "uh-n",
      <div>
        <p className="font-Libre text-[14px] m-0 mb-1.5">
          <strong className="text-[22px]">{urlhaus.online}</strong> of {urlhaus.total} recently reported URLs still online.
        </p>
        <span className="kicker">Top tags </span>
        {urlhaus.tags.map((t) => (
          <Badge key={t.name} tone="outline">
            {t.name} · {t.count}
          </Badge>
        ))}
      </div>,
      { gap: 6 },
    );
    if (urlhaus.samples.length) table(f, "uh", iocCols(f, false), urlhaus.samples, (i) => i.value);
  } else empty(f, "uh", missingKey ? "Waiting for an Auth-Key." : "URLhaus could not be reached.");
}

// ═════════════════════════════ A5 · RANSOMWARE TRACKER ═════════════════════════════

const groupLink = (g: string) => `https://www.ransomware.live/group/${encodeURIComponent(g)}`;

function ransomware(f: Flow, e: Edition) {
  f.section("a5");
  const { desk, stories } = e.ransomware;
  banner(f, desk ? `${desk.total} leak-site victims in ${desk.windowDays} days · ${desk.byGroup.length}+ active groups · ${stories.length} reports` : `${stories.length} reports`);
  if (desk) {
    const gc = boxTitle(f, "groups", "Most active groups", `${desk.windowDays} days`, 18);
    bars(
      f,
      "groups",
      desk.byGroup,
      (g) => (
        <ExtLink href={groupLink(g)} className="capitalize">
          {g}
        </ExtLink>
      ),
      gc,
    );
    const sc = boxTitle(f, "sectors", "Sectors hit");
    if (desk.bySector.length) bars(f, "sectors", desk.bySector, undefined, sc);
    else empty(f, "sectors", "No sector data in this window.");
    const cc = boxTitle(f, "countries", "Countries");
    if (desk.byCountry.length) bars(f, "countries", desk.byCountry, (c) => countryName(c), cc);
    else empty(f, "countries", "No country data.");

    boxTitle(f, "posts", "Latest leak-site posts", <ExtLink href="https://www.ransomware.live/">ransomware.live ({desk.mode === "free" ? "free" : "PRO"} API) →</ExtLink>);
    const cols: Col<Victim>[] = [
      {
        h: "Organisation (as posted)",
        cell: (v) => (
          <>
            <strong className="break-words">{v.name}</strong>
            {v.sector && <div className="meta">{v.sector}</div>}
          </>
        ),
      },
      {
        h: "Group",
        w: 96,
        cell: (v) => (
          <ExtLink href={groupLink(v.group)} className="capitalize break-words">
            {v.group}
          </ExtLink>
        ),
      },
      { h: "Country", w: 90, cell: (v) => countryName(v.country), min: 420 },
      { h: "Posted", w: 58, cell: (v) => ago(v.date, f.now) },
    ];
    table(f, "posts", cols, desk.victims.slice(0, 25), (v) => `${v.group}-${v.name}-${v.date}`);
    note(f, "posts", "Claims posted by extortion groups; not independently verified. Useful for checking whether clients or their suppliers appear.");
  } else empty(f, "desk", "ransomware.live could not be reached for this edition.");

  boxTitle(f, "news", "Ransomware reporting");
  if (stories.length) stories.slice(0, 9).forEach((s, i) => card(f, s, { size: i < 2 ? "md" : "sm", image: i === 0, first: i === 0 }));
  else empty(f, "news", "No ransomware reporting in the feeds.");
}

// ═══════════════════════════ A6 · THREAT ACTORS & CAMPAIGNS ═══════════════════════════

const ACTIVITY: Record<ActivityLevel, { label: string; tone: BadgeTone }> = {
  high: { label: "High", tone: "solid" },
  moderate: { label: "Moderate", tone: "dark" },
  low: { label: "Low", tone: "outline" },
  dormant: { label: "Quiet", tone: "faint" },
};

function threats(f: Flow, e: Edition) {
  f.section("a6");
  const { actors, stories } = e.threats;
  const days = Math.min(actors.windowDays, Math.max(1, Math.round(actors.historyDays)));
  banner(f, `${plural(actors.rows.length, "tracked group")} named in the last ${plural(days, "day")} · ${stories.length} research reports`);

  boxTitle(f, "actors", "Actor registry — ranked by mentions", "High ≥6 · Moderate 3–5 · Low 1–2", 18);
  if (actors.rows.length) {
    const cols: Col<ActorRow>[] = [
      {
        h: "Group",
        cell: (a) => (
          <>
            <strong className="uppercase tracking-[0.02em]">{a.name}</strong> <span className="meta">{[a.attribution, a.category].filter(Boolean).join(" · ")}</span>
            {a.aliases.length > 0 && <div className="meta clamp-2">aka {a.aliases.slice(0, 5).join(" · ")}</div>}
            {a.latestHeadline && (
              <div className="text-[12.5px] clamp-2 mt-0.5">
                <ExtLink href={a.latestHeadline.link} className="italic">
                  “{a.latestHeadline.title}”
                </ExtLink>{" "}
                <span className="meta">— {a.latestHeadline.source}</span>
              </div>
            )}
          </>
        ),
      },
      { h: "Activity", w: 78, cell: (a) => <Badge tone={ACTIVITY[a.activity].tone}>{ACTIVITY[a.activity].label}</Badge> },
      { h: "Ment.", w: 44, align: "right", cell: (a) => <strong>{a.mentions}</strong> },
      { h: "Last seen", w: 62, cell: (a) => (a.lastSeen ? ago(a.lastSeen, f.now) : "—"), min: 440 },
    ];
    table(f, "actors", cols, actors.rows, (a) => a.id);
  } else empty(f, "actors", `None of the ${actors.tracked} tracked groups were named in the archive window.`);
  note(
    f,
    "actors",
    actors.historyDays < actors.windowDays
      ? `The archive holds ${actors.historyDays} of ${actors.windowDays} days so far; counts fill in as editions accumulate.`
      : `Mentions across news, research blogs, HN and Reddit over ${actors.windowDays} days; ${actors.tracked} groups tracked.`,
  );

  boxTitle(f, "news", "Research & campaign reporting");
  if (stories.length) stories.slice(0, 12).forEach((s, i) => card(f, s, { size: i < 2 ? "md" : "sm", image: i < 2, first: i === 0 }));
  else empty(f, "news", "No threat-intelligence reporting in the feeds.");
}

// ═══════════════════════════════ A7 · BRIEFS & COMMUNITY ═══════════════════════════════

const TREND: Record<Trend, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "solid" },
  rising: { label: "Rising", tone: "dark" },
  steady: { label: "Steady", tone: "outline" },
  cooling: { label: "Cooling", tone: "faint" },
  unknown: { label: "—", tone: "faint" },
};

function briefs(f: Flow, e: Edition) {
  f.section("a7");
  const { breaches, policy, general } = e.briefs;
  const { hn, reddit, topics, diaries } = e.community;
  banner(f, `${breaches.length} breaches · ${policy.length} policy & law-enforcement · ${hn.length + reddit.length} community threads`);

  const lists: [string, string, typeof breaches, string][] = [
    ["breaches", "Breaches & incidents", breaches, "No breach reporting in the feeds."],
    ["policy", "Policy & law enforcement", policy, "No arrests, takedowns or regulatory news in the feeds."],
    ["general", "Also today", general, "Nothing else in the last 72 hours."],
  ];
  lists.forEach(([k, title, rows, none], n) => {
    const c = boxTitle(f, k, title, undefined, n === 0 ? 18 : GAP.box);
    if (rows.length) list(f, k, rows.slice(0, 10), (s) => <StoryLine story={s} now={f.now} />, c, (s) => s.id);
    else empty(f, k, none);
  });

  const tc = boxTitle(f, "topics", "Signal board — topics, last 24h", `prior = 24h before · ${e.community.topicHistoryHours}h history`);
  if (topics.length) {
    const cols: Col<TopicRow>[] = [
      { h: "Topic", cell: (t) => <strong>{t.label}</strong> },
      { h: "24h", w: 36, align: "right", cell: (t) => <strong>{t.mentions}</strong> },
      { h: "Prior", w: 40, align: "right", cell: (t) => t.previous ?? "—" },
      { h: "Trend", w: 66, cell: (t) => <Badge tone={TREND[t.trend].tone}>{TREND[t.trend].label}</Badge> },
      { h: "News·HN·Reddit", w: 104, cell: (t) => `${t.bySource.news} · ${t.bySource.hn} · ${t.bySource.reddit}`, min: 480 },
    ];
    table(f, "topics", cols, topics.slice(0, 10), (t) => t.id);
  } else empty(f, "topics", "No items from the last 24 hours to rank yet.");
  void tc;

  const hc = boxTitle(f, "hn", "Hacker News", "security · 48h");
  if (hn.length) list(f, "hn", hn.slice(0, 10), (p, i) => <CommunityItem post={p} rank={i + 1} now={f.now} />, hc, (p) => p.id);
  else empty(f, "hn", "No security stories above the points threshold.");
  const rc = boxTitle(f, "reddit", "Reddit", "top of the day");
  if (reddit.length) list(f, "reddit", reddit.slice(0, 10), (p, i) => <CommunityItem post={p} rank={i + 1} now={f.now} />, rc, (p) => p.id);
  else empty(f, "reddit", "Reddit returned nothing (it often blocks anonymous CI requests — see the README).");
  const dc = boxTitle(f, "isc", "SANS ISC handler diaries");
  if (diaries.length)
    list(
      f,
      "isc",
      diaries,
      (d) => (
        <>
          <ExtLink href={d.link} className="font-Libre font-bold text-[14.5px] leading-[1.35]">
            {d.title}
          </ExtLink>
          <div className="meta">{ago(d.published, f.now)}</div>
        </>
      ),
      dc,
      (d) => d.id,
    );
  else empty(f, "isc", "ISC diary feed unavailable.");

  // Wire report: every source and whether it answered.
  const wc = boxTitle(f, "wire", "Wire report — sources for this edition", `${e.stats.sourcesOk} of ${e.stats.sourcesTotal} live`);
  const perRow = f.cw >= 420 ? 2 : 1;
  const group = "a7-wire";
  for (let i = 0; i < e.sources.length; i += perRow) {
    const row = e.sources.slice(i, i + perRow);
    f.add({
      key: `${group}-${i}`,
      group,
      cont: wc,
      gap: i === 0 ? 4 : 0,
      node: (
        <div className="grid gap-x-6" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0,1fr))` }}>
          {row.map((s) => (
            <div key={s.name + s.url} className="flex justify-between gap-2 border-b border-dotted border-[var(--rule-light)] font-Libre text-[12px] leading-[19px]" title={s.error}>
              <span className={`truncate ${s.ok ? "" : "line-through text-[var(--ink-3)]"}`}>{s.name}</span>
              <span className="text-[var(--ink-3)] whitespace-nowrap">{s.ok ? compact(s.items) : "down"}</span>
            </div>
          ))}
        </div>
      ),
    });
  }
  note(f, "wire", "Struck-through sources failed for this edition; hover for the error. Links go to the original reporting.");
}

export type { SectionId };
