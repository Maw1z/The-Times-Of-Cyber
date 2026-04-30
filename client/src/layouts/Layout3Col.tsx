// Classic NYT-style: lead story (photo + 2-sub-col body) | sidebar col | small stories col
// Props:
//   lead      — story object (size:'lead')
//   sidebar   — array of story objects for middle column
//   briefs    — array of story objects for right column

import {
  ColRule,
  FooterStrip,
  Body,
  Photo,
  Caption,
  JumpLine,
} from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

export function Layout3Col({ lead, sidebar = [], briefs = [] }) {
  const { headline, deck, byline, body, image, jumpLine, dropCap } = lead;

  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px]"
      style={{
        display: "grid",
        gridTemplateColumns: "2.5fr 1.1fr 1.1fr",
        minHeight: 0,
      }}
    >
      {/* ── LEFT: lead story ── */}
      <ColRule
        style={{
          paddingRight: "7px",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: "3px",
        }}
      >
        {/* Banner headline + deck sit above the grid, rendered by the Page wrapper.
            Here we just render photo and body. */}
        {image && (
          <div>
            <Photo src={image.src} height={image.height} />
            {image.caption && <Caption>{image.caption}</Caption>}
          </div>
        )}

        {/* Two-sub-column body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Sub-col A — first half of body paragraphs */}
          <ColRule style={{ paddingRight: "6px" }}>
            {body.slice(0, Math.ceil(body.length / 2)).map((para, i) => (
              <Body key={i} dropCap={dropCap && i === 0}>
                {para}
              </Body>
            ))}
          </ColRule>

          {/* Sub-col B — second half */}
          <div style={{ paddingLeft: "6px" }}>
            {body.slice(Math.ceil(body.length / 2)).map((para, i) => (
              <Body key={i}>{para}</Body>
            ))}
            {jumpLine && (
              <JumpLine>
                By <strong>{byline}</strong> · Continued on {jumpLine}
              </JumpLine>
            )}
          </div>
        </div>
      </ColRule>

      {/* ── MIDDLE: sidebar stories ── */}
      <ColRule
        style={{ paddingLeft: "7px", paddingRight: "7px", overflow: "hidden" }}
      >
        {sidebar.map((story, i) => (
          <StoryBlock
            key={story.id}
            story={story}
            showRule={i < sidebar.length - 1}
          />
        ))}
      </ColRule>

      {/* ── RIGHT: brief stories ── */}
      <div
        style={{
          paddingLeft: "7px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {briefs.map((story, i) => (
          <div
            key={story.id}
            style={
              i < briefs.length - 1
                ? {
                    borderBottom: "1px solid #aaa",
                    paddingBottom: "6px",
                    marginBottom: "6px",
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
