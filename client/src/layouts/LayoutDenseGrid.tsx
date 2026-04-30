import { NewspaperColumnEngine } from "../components/NewspaperColumnEngine";
import { FooterStrip } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

export function LayoutDenseGrid({ stories = [] }) {
  const [lead, ...rest] = stories;

  const topRight = rest.slice(0, 2);
  const gridItems = rest.slice(2);

  return (
    <div className="flex-1 px-[8px] pb-[6px] flex flex-col gap-[6px] min-h-0 overflow-hidden">
      {/* Top row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "6px",
          borderBottom: "1px solid #aaa",
          paddingBottom: "6px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            minHeight: 0,
            overflow: "hidden",
            borderRight: "1px solid #aaa",
            paddingRight: "6px",
          }}
        >
          <StoryBlock story={lead} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minHeight: 0,
          }}
        >
          {topRight.map((s, idx) => (
            <div
              key={s.id}
              style={{
                minHeight: 0,
                overflow: "hidden",
                // Add border between stories, not after the last one
                borderBottom:
                  idx < topRight.length - 1 ? "1px solid #aaa " : "none",
                paddingBottom: idx < topRight.length - 1 ? "4px" : "0",
              }}
            >
              <StoryBlock story={s} dense />
            </div>
          ))}
        </div>
      </div>

      {/* Dense grid — FIXED CONSTRAINT MODEL */}
      <NewspaperColumnEngine
        stories={gridItems}
        columns={4}
        renderStory={(s) => <StoryBlock story={s} dense />}
      />
      <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
    </div>
  );
}
