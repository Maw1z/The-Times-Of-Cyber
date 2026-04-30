import {
  ColRule,
  FooterStrip,
  HRule,
  Headline,
  Byline,
  Body,
} from "../components/Primitives";
import { StoryBlock } from "../components/StoryBlock";

const EXPLOIT_BADGE = {
  kev: { label: "KEV", bg: "#111", color: "#fff" },
  active: { label: "ACTIVE", bg: "#555", color: "#fff" },
  poc: { label: "PoC", bg: "#999", color: "#fff" },
  theoretical: {
    label: "THEOR",
    bg: "none",
    color: "#777",
    border: "1px solid #aaa",
  },
};

function CVERow({ cve, zebra }) {
  const badge = EXPLOIT_BADGE[cve.exploitability];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2.2fr 1.6fr 0.6fr 1.4fr 3fr",
        gap: 0,
        padding: "2px 0",
        borderBottom: "1px solid #ddd",
        background: zebra ? "#EEEEEE" : "transparent",
        alignItems: "start", // enforce top alignment on all cells
      }}
    >
      {/* CVE ID + product */}
      <div style={{ paddingRight: "4px" }}>
        <span
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "5.8px",
            fontWeight: "700",
            letterSpacing: "0.02em",
          }}
        >
          {cve.id}
        </span>
        <div style={{ fontSize: "5.2px", color: "#555", marginTop: "1px" }}>
          {cve.product}
        </div>
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
        {cve.category}
      </div>
      {/* CVSS */}
      <div
        style={{
          fontSize: "6.5px",
          fontWeight: "700",
          fontFamily: "'Libre Baskerville', serif",
          color: cve.cvss >= 9 ? "#111" : cve.cvss >= 7 ? "#444" : "#777",
          paddingTop: "1px",
        }}
      >
        {cve.cvss.toFixed(1)}
      </div>
      {/* Exploitability badge */}
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
      {/* Summary */}
      <div
        style={{
          fontSize: "5.4px",
          lineHeight: "1.4",
          color: "#333",
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        {cve.summary}
      </div>
    </div>
  );
}

function CVETable({ cves }) {
  return (
    <div style={{ overflow: "hidden" }}>
      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.2fr 1.6fr 0.6fr 1.4fr 3fr",
          gap: 0,
          borderTop: "2px solid #111",
          borderBottom: "1px solid #111",
          padding: "2px 0",
          marginBottom: "1px",
        }}
      >
        {["CVE / PRODUCT", "CATEGORY", "CVSS", "STATUS", "SUMMARY"].map((h) => (
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
      {cves.map((cve, i) => (
        <CVERow key={cve.id} cve={cve} zebra={i % 2 === 1} />
      ))}
    </div>
  );
}

/**
 * Props:
 *   cves    — array of CVE objects from threatDeskStories.cves
 *   col1    — array of story objects (left story column)
 *   col2    — array of story objects (right story column)
 */
export function LayoutThreatDeskCVE({ cves = [], col1 = [], col2 = [] }) {
  return (
    <div
      className="flex-1 overflow-hidden px-[10px] pb-[6px] flex flex-col"
      style={{ minHeight: 0, gap: "5px" }}
    >
      {/* CVE table — full width, fixed height */}
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
          Vulnerability Desk — Ranked by Exploitability · CVSS · Exposure
        </p>
        <CVETable cves={cves} />
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
