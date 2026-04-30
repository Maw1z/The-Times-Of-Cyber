import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

/**
 * Props:
 *   stories — array of story objects, 5–7 recommended
 *             first story in each column anchors it; remaining stack below an HRule
 *
 * Shape: [col0_lead, col1_lead, col2_lead, col3_lead, col4_lead,
 *          col0_secondary?, col1_secondary?, ...]
 * Simplest: just pass 5 stories, one per column.
 * Or pass columns prop (array of arrays) for full control.
 */
export function LayoutDense5Col({ columns = [] }) {
  // columns: array of 5 arrays of story objects
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 0,
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {columns.slice(0, 5).map((colStories, colIdx) => {
          const isFirst = colIdx === 0;
          const isLast = colIdx === 4;

          if (isFirst) {
            return (
              <ColRule
                key={colIdx}
                style={{ paddingRight: "6px", overflow: "hidden" }}
              >
                {colStories.map((story, i) => (
                  <div key={story.id}>
                    {i > 0 && <HRule />}
                    <StoryBlock story={story} />
                  </div>
                ))}
              </ColRule>
            );
          }

          if (isLast) {
            return (
              <div
                key={colIdx}
                style={{ paddingLeft: "6px", overflow: "hidden" }}
              >
                {colStories.map((story, i) => (
                  <div key={story.id}>
                    {i > 0 && <HRule />}
                    <StoryBlock story={story} />
                  </div>
                ))}
              </div>
            );
          }

          return (
            <ColRule
              key={colIdx}
              style={{ paddingInline: "6px", overflow: "hidden" }}
            >
              {colStories.map((story, i) => (
                <div key={story.id}>
                  {i > 0 && <HRule />}
                  <StoryBlock story={story} />
                </div>
              ))}
            </ColRule>
          );
        })}
      </div>
      <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
    </div>
  );
}
