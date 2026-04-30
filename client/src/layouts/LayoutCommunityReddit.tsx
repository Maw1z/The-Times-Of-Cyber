import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";
// TopicRow, TopicTable and badge maps are identical — extract to a shared
// file (e.g. components/CommunityTable.jsx) and import in both layouts.
import { TopicTable } from "../components/CommunityTable";

/**
 * Props:
 *   topics — array of topic objects from communitySignalData.topics
 *   col1   — array of story objects (left)
 *   col2   — array of story objects (center)
 *   col3   — array of story objects (right)
 */
export function LayoutCommunityReddit({
  topics = [],
  col1 = [],
  col2 = [],
  col3 = [],
}) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0, gap: "5px" }}
    >
      {/* Signal table — same component */}
      <div
        style={{
          borderBottom: "1px solid #aaa",
          paddingBottom: "5px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "5.5px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#666",
            marginBottom: "2px",
          }}
        >
          Community Signal Board — Ranked by Velocity · Engagement · Sentiment ·
          Source: Hacker News & Reddit
        </p>
        <TopicTable topics={topics} />
      </div>

      {/* 3-column story grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <ColRule style={{ paddingRight: "7px", overflow: "hidden" }}>
          {col1.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} />
            </div>
          ))}
        </ColRule>
        <ColRule
          style={{
            paddingLeft: "7px",
            paddingRight: "7px",
            overflow: "hidden",
          }}
        >
          {col2.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} />
            </div>
          ))}
        </ColRule>
        <div style={{ paddingLeft: "7px", overflow: "hidden" }}>
          {col3.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} />
            </div>
          ))}
        </div>
      </div>

      <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
    </div>
  );
}
