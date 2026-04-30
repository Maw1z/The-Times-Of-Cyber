import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

/**
 * Props:
 *   feature  — story object for the wide center column
 *   left     — array of story objects for the left column (2 recommended)
 *   right    — array of story objects for the right column (2 recommended)
 *
 * Center column gets a double-rule top border to signal editorial weight,
 * matching the double-rule pattern already used in MastheadRule.
 */
export function LayoutDenseWideCenter({ feature, left = [], right = [] }) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.8fr 1.2fr",
          gap: 0,
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Left narrow column */}
        <ColRule style={{ paddingRight: "7px", overflow: "hidden" }}>
          {left.map((story, i) => (
            <div key={story.id}>
              {i > 0 && <HRule />}
              <StoryBlock story={story} />
            </div>
          ))}
        </ColRule>

        {/* Wide center — double rule top signals feature status */}
        <div
          style={{
            paddingLeft: "7px",
            paddingRight: "7px",
            overflow: "hidden",
            borderRight: "1px solid #999",
            borderTop: "3px double #111",
          }}
        >
          <StoryBlock story={feature} />
        </div>

        {/* Right narrow column */}
        <div style={{ paddingLeft: "7px", overflow: "hidden" }}>
          {right.map((story, i) => (
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
