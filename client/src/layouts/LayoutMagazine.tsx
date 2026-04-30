// Magazine-style: full-width hero photo, lead body in 2 cols, then 4-col brief grid below.
// Good for visual impact / feature front pages.

import { HalftoneImage } from "../components/HalftoneImage";
import { FooterStrip, Body, Caption, JumpLine } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

export function LayoutMagazine({ lead, briefs = [] }) {
  const { headline, byline, body, image, jumpLine, dropCap } = lead;

  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col gap-[4px]"
      style={{ minHeight: 0 }}
    >
      {/* Full-width hero */}
      {image && (
        <div>
          <HalftoneImage src="https://paper.design/flowers.webp" />
          {/* <Photo src={image.src} height="160px" className="w-full" /> */}
          {image.caption && <Caption>{image.caption}</Caption>}
        </div>
      )}

      {/* Lead body — 3 equal columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          borderBottom: "1px solid #aaa",
          paddingBottom: "6px",
        }}
      >
        {[0, 1, 2].map((colIdx) => {
          const total = body.length;
          const perCol = Math.ceil(total / 3);
          const slice = body.slice(colIdx * perCol, (colIdx + 1) * perCol);
          return (
            <div
              key={colIdx}
              style={
                colIdx < 2
                  ? {
                      borderRight: "1px solid #999",
                      paddingRight: "6px",
                      marginRight: "6px",
                    }
                  : {}
              }
            >
              {slice.map((para, i) => (
                <Body key={i} dropCap={dropCap && colIdx === 0 && i === 0}>
                  {para}
                </Body>
              ))}
              {colIdx === 2 && jumpLine && (
                <JumpLine>
                  By <strong>{byline}</strong> · Continued on {jumpLine}
                </JumpLine>
              )}
            </div>
          );
        })}
      </div>

      {/* 4-col brief grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {briefs.slice(0, 4).map((story, i) => (
          <div
            key={story.id}
            style={
              i < 3
                ? {
                    borderRight: "1px solid #999",
                    paddingRight: "6px",
                    marginRight: "6px",
                  }
                : {}
            }
          >
            <StoryBlock story={story} />
          </div>
        ))}
      </div>

      <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
    </div>
  );
}
