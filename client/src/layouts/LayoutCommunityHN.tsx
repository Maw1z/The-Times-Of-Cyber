import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";
import { TopicTable } from "../components/CommunityTable";
/**
 * Props:
 *   topics — array of topic objects from communitySignalData.topics
 *   col1   — array of story objects (HN stories, left column)
 *   col2   — array of story objects (HN stories, right column)
 */
export function LayoutCommunityHN({ topics = [], col1 = [], col2 = [] }) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0, gap: "5px" }}
    >
      {/* Signal table */}
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

      {/* Story columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
        <div style={{ paddingLeft: "7px", overflow: "hidden" }}>
          {col2.map((story, i) => (
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
