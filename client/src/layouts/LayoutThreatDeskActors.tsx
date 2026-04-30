import { ColRule, FooterStrip, HRule } from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

const ACTIVITY_BADGE = {
  high: { label: "HIGH", bg: "#111", color: "#fff" },
  moderate: { label: "MOD", bg: "#666", color: "#fff" },
  low: { label: "LOW", bg: "none", color: "#777", border: "1px solid #aaa" },
  dormant: {
    label: "DORMANT",
    bg: "none",
    color: "#aaa",
    border: "1px solid #ccc",
  },
};

function ActorRow({ actor, zebra }) {
  const badge = ACTIVITY_BADGE[actor.activity];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 0.5fr 1.2fr 1.2fr 2.8fr 1.8fr 1fr",
        gap: 0,
        padding: "2px 0",
        borderBottom: "1px solid #ddd",
        background: zebra ? "#EEEEEE" : "transparent",
        alignItems: "start", // all cells top-aligned
      }}
    >
      {/* Designation */}
      <div style={{ paddingRight: "4px" }}>
        <span
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "5.8px",
            fontWeight: "700",
          }}
        >
          {actor.designation}
        </span>
        <div style={{ fontSize: "5px", color: "#666", marginTop: "1px" }}>
          {actor.aliases.join(" · ")}
        </div>
      </div>
      {/* Origin — plain text now */}
      <div
        style={{
          fontSize: "5.4px",
          fontFamily: "'Libre Baskerville', serif",
          color: "#333",
          paddingRight: "4px",
          paddingTop: "1px",
        }}
      >
        {actor.origin}
      </div>
      {/* Category */}
      <div
        style={{
          fontSize: "5.4px",
          color: "#444",
          fontFamily: "'Libre Baskerville', serif",
          paddingRight: "4px",
          paddingTop: "1px",
        }}
      >
        {actor.category}
      </div>
      {/* Activity badge */}
      <div style={{ paddingTop: "1px", paddingRight: "4px" }}>
        <span
          style={{
            fontSize: "4.8px",
            fontFamily: "sans-serif",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "1px 3px",
            background: badge.bg,
            color: badge.color,
            border: badge.border ?? "none",
          }}
        >
          {badge.label}
        </span>
      </div>
      {/* Primary targets */}
      <div
        style={{
          fontSize: "5.4px",
          color: "#333",
          paddingRight: "4px",
          lineHeight: "1.4",
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        {actor.primaryTargets}
      </div>
      {/* TTPs */}
      <div
        style={{
          fontSize: "5.2px",
          color: "#444",
          paddingRight: "4px",
          lineHeight: "1.4",
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        {actor.ttps}
      </div>
      {/* Last seen */}
      <div
        style={{
          fontSize: "5.2px",
          color: "#666",
          fontFamily: "'Libre Baskerville', serif",
          paddingTop: "1px",
        }}
      >
        {actor.lastSeen}
      </div>
    </div>
  );
}

function ActorTable({ actors }) {
  return (
    <div style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 0.5fr 1.2fr 1.2fr 2.8fr 1.8fr 1fr",
          gap: 0,
          borderTop: "2px solid #111",
          borderBottom: "1px solid #111",
          padding: "2px 0",
          marginBottom: "1px",
        }}
      >
        {[
          "DESIGNATION",
          "ORI",
          "TYPE",
          "ACTIVITY",
          "PRIMARY TARGETS",
          "TTPs",
          "LAST SEEN",
        ].map((h) => (
          <div
            key={h}
            style={{
              fontSize: "4.8px",
              fontFamily: "sans-serif",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#555",
              paddingRight: "4px",
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {actors.map((actor, i) => (
        <ActorRow key={actor.id} actor={actor} zebra={i % 2 === 1} />
      ))}
    </div>
  );
}

/**
 * Props:
 *   actors  — array of actor objects from threatActorStories.actors
 *   col1    — array of story objects
 *   col2    — array of story objects
 */
export function LayoutThreatDeskActors({ actors = [], col1 = [], col2 = [] }) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0, gap: "5px" }}
    >
      {/* Actor table — full width */}
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
          Threat Actor Registry — Ranked by Activity · Target Scope · TTP
          Sophistication
        </p>
        <ActorTable actors={actors} />
      </div>

      {/* Story columns below */}
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
