import { Headline, Byline, Body, Photo, Caption, HRule } from "./Primitives";

/**
 * story shape:
 * {
 *   headline: string,
 *   deck?: string,
 *   byline: string,
 *   body: string[],
 *   image?: { src, caption, height? },
 *   jumpLine?: string,
 *   size: 'lead' | 'secondary' | 'brief',
 *   dropCap?: boolean,
 *   url?: string,
 * }
 */
export function StoryBlock({ story, dense = false, showRule = false }) {
  const { headline, deck, byline, body = [], image, size, dropCap } = story;

  return (
    <div style={{ minHeight: 0, overflow: "hidden" }}>
      <Headline size={size}>{headline}</Headline>

      {deck && (!dense || size === "lead") && (
        <p
          style={{
            fontSize: "7px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "2px",
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {deck}
        </p>
      )}

      <Byline>
        By <strong>{byline}</strong>
      </Byline>

      {/* Image renders for all sizes — lead gets full width, others get inline */}
      {image && (
        <div style={{ marginBottom: "2px" }}>
          <Photo
            src={image.src}
            height={
              size === "lead"
                ? dense
                  ? "90px"
                  : (image.height ?? "110px")
                : dense
                  ? "50px"
                  : "70px"
            }
            className="w-full"
          />
          {!dense && image.caption && <Caption>{image.caption}</Caption>}
        </div>
      )}

      {/* Body paragraphs — properly mapped */}
      {body.map((para, i) => (
        <Body key={i} dropCap={dropCap && !dense && i === 0}>
          {para}
        </Body>
      ))}

      {showRule && <HRule />}
    </div>
  );
}
