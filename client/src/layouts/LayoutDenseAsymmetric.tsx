import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

/**
 * Props:
 *   lead    — story object for the wide left column (gets the most space)
 *   midLeft — array of story objects for center-left column (2 recommended)
 *   midRight— array of story objects for center-right column (2 recommended)
 *   briefs  — array of { label: string, text: string } for the digest strip
 *
 * The digest strip is a tinted, tighter column — no StoryBlock, just
 * bold label + text pairs separated by HRules. Good for patch notes,
 * market data, CVEs, or quick-hit items.
 */
export function LayoutDenseAsymmetric({
  lead,
  col1 = [],
  col2 = [],
  col3 = [],
}) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr 1fr 0.85fr",
          gap: 0,
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Wide lead column */}
        <ColRule style={{ paddingRight: "7px", overflow: "hidden" }}>
          <StoryBlock story={lead} />
        </ColRule>

        {/* Center-left */}
        <ColRule
          style={{
            paddingLeft: "7px",
            paddingRight: "7px",
            overflow: "hidden",
          }}
        >
          {col1.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} />
            </div>
          ))}
        </ColRule>

        {/* Center-right */}
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

        {/* Narrow briefs column — same pattern, slightly tighter */}
        <div style={{ paddingLeft: "7px", overflow: "hidden" }}>
          {col3.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} dense />
            </div>
          ))}
        </div>
      </div>

      <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
    </div>
  );
}
