import {
  ColRule,
  FooterStrip,
  Body,
  Photo,
  Caption,
  JumpLine,
} from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

/**
 * Props:
 *   lead    — story object (size: 'lead')
 *   sidebar — array of story objects for the right column (2–4 recommended)
 */
export function Layout2Col({ lead, sidebar = [] }) {
  const { byline, body, image, jumpLine, dropCap } = lead;

  // Split body across 3 sub-columns inside the lead
  const third = Math.ceil(body.length / 3);
  const cols = [
    body.slice(0, third),
    body.slice(third, third * 2),
    body.slice(third * 2),
  ];

  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px]"
      style={{
        display: "grid",
        gridTemplateColumns: "3fr 1.4fr",
        gap: 0,
        minHeight: 0,
      }}
    >
      {/* ── LEFT: lead story — photo full width, body in 3 sub-cols ── */}
      <ColRule
        style={{
          paddingRight: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          overflow: "hidden",
        }}
      >
        {/* Hero photo */}
        {image && (
          <div className="shrink-0">
            <Photo src={image.src} height="148px" className="w-full" />
            {image.caption && <Caption>{image.caption}</Caption>}
          </div>
        )}

        {/* 3-sub-column body */}
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
          {cols.map((paragraphs, colIdx) => (
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
              {paragraphs.map((para, i) => (
                <Body key={i} dropCap={dropCap && colIdx === 0 && i === 0}>
                  {para}
                </Body>
              ))}

              {/* Byline + jump on last column */}
              {colIdx === 2 && (
                <JumpLine>
                  By <strong>{byline}</strong>
                  {jumpLine ? ` · Continued on ${jumpLine}` : ""}
                </JumpLine>
              )}
            </div>
          ))}
        </div>
      </ColRule>

      {/* ── RIGHT: stacked secondary / brief stories ── */}
      <div
        style={{
          paddingLeft: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {sidebar.map((story, i) => (
          <div
            key={story.id}
            style={
              i < sidebar.length - 1
                ? {
                    borderBottom: "1px solid #aaa",
                    paddingBottom: "5px",
                    marginBottom: "5px",
                  }
                : { flex: 1 }
            }
          >
            <StoryBlock story={story} />
          </div>
        ))}

        <FooterStrip left="timesofcyber.io" right="© 2026 THE TIMES OF CYBER" />
      </div>
    </div>
  );
}
