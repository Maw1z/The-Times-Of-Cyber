import type { CommunityPost } from "../types/edition";
import { ago, compact } from "../lib/format";
import { ExtLink } from "./Primitives";

/** A Hacker News / Reddit post as a numbered brief. */
export function CommunityItem({ post, rank, now }: { post: CommunityPost; rank: number; now: number }) {
  const meta = [
    post.platform === "reddit" ? post.community : null,
    post.points != null ? `${compact(post.points)} points` : null,
    post.comments != null ? `${compact(post.comments)} comments` : null,
    post.domain?.startsWith("r/") ? null : post.domain,
    ago(post.created, now),
  ].filter(Boolean);
  return (
    <li className="list-none flex gap-3 py-2 border-b border-dotted border-[var(--rule)] last:border-b-0">
      <span className="font-Libre font-bold text-[18px] leading-none text-[var(--ink-3)] w-6 shrink-0 text-right pt-0.5">{rank}</span>
      <div className="min-w-0">
        <ExtLink href={post.link} className="font-Libre font-bold text-[15px] leading-snug">
          {post.title}
        </ExtLink>
        <div className="meta mt-0.5">
          {meta.join(" · ")} ·{" "}
          <ExtLink href={post.discussion} className="underline">
            thread
          </ExtLink>
        </div>
      </div>
    </li>
  );
}
