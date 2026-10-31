import type { Story } from "../types/edition";
import { ago } from "../lib/format";
import { Badge, ExtLink } from "./Primitives";

export function Byline({ story, now }: { story: Story; now: number }) {
  return (
    <p className="meta m-0 mb-2">
      {story.author && <span className="italic font-Libre text-[13px] text-[var(--ink-2)]">By {story.author} · </span>}
      <span className="font-bold uppercase tracking-[0.06em] text-[11px] text-[var(--ink-2)]">{story.source}</span> · {ago(story.published, now)}
    </p>
  );
}

/** CVEs, ATT&CK techniques and actors found in the story, as small tags. */
export function StoryTags({ story }: { story: Story }) {
  const cves = story.cves ?? [];
  const techs = story.techniques ?? [];
  const actors = story.actors ?? [];
  if (!cves.length && !techs.length && !actors.length) return null;
  return (
    <div className="mt-1.5">
      {actors.slice(0, 3).map((a) => (
        <Badge key={a} tone="dark">
          {a}
        </Badge>
      ))}
      {cves.slice(0, 3).map((c) => (
        <a key={c} href={`https://nvd.nist.gov/vuln/detail/${c}`} target="_blank" rel="noopener noreferrer">
          <Badge tone="outline">{c}</Badge>
        </a>
      ))}
      {techs.slice(0, 4).map((t) => (
        <a key={t} href={`https://attack.mitre.org/techniques/${t.replace(".", "/")}`} target="_blank" rel="noopener noreferrer">
          <Badge tone="faint">{t}</Badge>
        </a>
      ))}
    </div>
  );
}

export function AlsoReported({ story }: { story: Story }) {
  const also = story.alsoReportedBy ?? [];
  if (!also.length) return null;
  return (
    <p className="meta m-0 mt-1.5">
      Also reported by{" "}
      {also.slice(0, 4).map((a, i) => (
        <span key={a.link}>
          {i > 0 && ", "}
          <ExtLink href={a.link} className="italic">
            {a.source}
          </ExtLink>
        </span>
      ))}
      {also.length > 4 && ` and ${also.length - 4} more`}
    </p>
  );
}
