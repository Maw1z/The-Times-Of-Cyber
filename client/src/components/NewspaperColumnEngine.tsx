import { useMemo } from "react";

/**
 * Simple greedy column-packing engine.
 * This is NOT visual measurement-based (that would require DOM measuring),
 * but it gives stable newspaper-like distribution.
 */

function estimateStorySize(story) {
  // crude but effective heuristic
  const bodyLength = story?.body?.length || 1;
  const headlineWeight = (story?.headline?.length || 10) / 20;

  return bodyLength + headlineWeight;
}

// Sequential distribution
function packIntoColumns(items, colCount = 4) {
  const columns = Array.from({ length: colCount }, () => []);
  // Fill sequentially — column 0 fills first, then column 1, etc.
  const perCol = Math.ceil(items.length / colCount);
  items.forEach((item, i) => {
    const colIdx = Math.min(Math.floor(i / perCol), colCount - 1);
    columns[colIdx].push(item);
  });
  return columns;
}

export function NewspaperColumnEngine({
  stories = [],
  columns = 4,
  renderStory,
  gap = 10,
  showRules = true,
}) {
  const packed = useMemo(
    () => packIntoColumns(stories, columns),
    [stories, columns],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {packed.map((col, colIdx) => (
        <div
          key={colIdx}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minHeight: 0,
          }}
        >
          {col.map((story) => (
            <div
              key={story.id}
              style={{
                paddingBottom: "6px",
                borderBottom: showRules ? "1px solid #aaa" : "none", // always show
              }}
            >
              {renderStory(story)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
