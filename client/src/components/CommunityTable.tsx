const TREND_BADGE = {
  rising: { label: "↑ RISING", color: "#111", weight: "700" },
  peak: { label: "◆ PEAK", color: "#555", weight: "700" },
  cooling: { label: "↓ COOLING", color: "#999", weight: "400" },
};

const SENTIMENT_LABEL = {
  alarm: "ALARM",
  skeptical: "SKEPTICAL",
  analytical: "ANALYTICAL",
  mixed: "MIXED",
};

export function TopicRow({ topic, zebra }) {
  const trend = TREND_BADGE[topic.trend];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.8fr 0.5fr 0.9fr 0.7fr 0.8fr 0.8fr 3fr",
        gap: 0,
        padding: "2px 0",
        borderBottom: "1px solid #ddd",
        background: zebra ? "#EBEBEB" : "transparent",
        alignItems: "start",
      }}
    >
      {/* Keyword */}
      <div style={{ paddingRight: "4px" }}>
        <span
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "5.8px",
            fontWeight: "700",
          }}
        >
          {topic.novelty && (
            <span
              style={{
                fontSize: "4.6px",
                fontFamily: "sans-serif",
                fontWeight: "700",
                background: "#111",
                color: "#fff",
                padding: "0px 2px",
                marginRight: "3px",
                letterSpacing: "0.04em",
              }}
            >
              NEW
            </span>
          )}
          {topic.keyword}
        </span>
      </div>
      {/* Velocity */}
      <div
        style={{
          fontSize: "6.5px",
          fontWeight: "700",
          fontFamily: "'Libre Baskerville', serif",
          color:
            topic.velocity >= 70
              ? "#111"
              : topic.velocity >= 40
                ? "#444"
                : "#888",
          paddingTop: "1px",
        }}
      >
        {topic.velocity}
        <span style={{ fontSize: "4.5px", fontWeight: "400", color: "#888" }}>
          /hr
        </span>
      </div>
      {/* Trend */}
      <div
        style={{
          fontSize: "5px",
          fontFamily: "sans-serif",
          fontWeight: trend.weight,
          color: trend.color,
          paddingTop: "2px",
          paddingRight: "4px",
          letterSpacing: "0.04em",
        }}
      >
        {trend.label}
      </div>
      {/* Upvotes */}
      <div
        style={{
          fontSize: "5.4px",
          fontFamily: "'Libre Baskerville', serif",
          color: "#444",
          paddingTop: "1px",
        }}
      >
        {(topic.upvotes / 1000).toFixed(1)}k
      </div>
      {/* Comments */}
      <div
        style={{
          fontSize: "5.4px",
          fontFamily: "'Libre Baskerville', serif",
          color: "#444",
          paddingTop: "1px",
        }}
      >
        {topic.comments}
      </div>
      {/* Sentiment */}
      <div
        style={{
          fontSize: "4.8px",
          fontFamily: "sans-serif",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: topic.sentiment === "alarm" ? "#111" : "#666",
          paddingTop: "2px",
          paddingRight: "4px",
        }}
      >
        {SENTIMENT_LABEL[topic.sentiment]}
      </div>
      {/* Top thread excerpt */}
      <div
        style={{
          fontSize: "5.3px",
          lineHeight: "1.4",
          color: "#333",
          fontFamily: "'Libre Baskerville', serif",
          fontStyle: "italic",
        }}
      >
        "{topic.topThread}"
      </div>
    </div>
  );
}

export function TopicTable({ topics }) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 0.5fr 0.9fr 0.7fr 0.8fr 0.8fr 3fr",
          gap: 0,
          borderTop: "2px solid #111",
          borderBottom: "1px solid #111",
          padding: "2px 0",
          marginBottom: "1px",
        }}
      >
        {[
          "TOPIC / KEYWORD",
          "VEL.",
          "TREND",
          "▲ UP",
          "✦ CMT",
          "SENTIMENT",
          "TOP THREAD",
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
      {topics.map((topic, i) => (
        <TopicRow key={topic.id} topic={topic} zebra={i % 2 === 1} />
      ))}
    </div>
  );
}
