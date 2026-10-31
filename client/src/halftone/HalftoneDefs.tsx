/**
 * SVG filters for the printed look, modelled on an early-1900s newspaper clipping.
 *
 *   #ht-photo              Photos: a true amplitude-modulated halftone — each dot's size
 *                          follows the darkness under it (big dots in shadows, pin-points
 *                          in highlights), soft dot edges, brown-black ink.
 *   #ink-xl, #ink-display  Letterpress edges for the nameplate and section banners: slight
 *                          ink gain, ragged edges, uneven inking. Type is never screened.
 *
 * The paper speckle and grey shading are CSS dot patterns (index.css) — the same look
 * as screening the whole sheet, at a fraction of the rendering cost.
 * Filters work on cross-origin RSS images: nothing is read back into JS.
 */

const INK = "#141210";
const PHOTO_INK = "#1e1a16";

/** Dots per tile edge. */
const TILE_CELLS = 10;

/**
 * Threshold tile for a 45° screen: a TILE_CELLS × TILE_CELLS block of `cell`-sized
 * squares with a dot at every corner and centre; alpha falls from 1 at each dot
 * centre to 0.02 at its edge. A large intrinsic size keeps feImage from rasterising
 * it into grey mush, and tiling a 10×10 block (not one dot) avoids a Chromium
 * feTile bug that drops output at some sizes.
 */
function dotTile(cell: number): { href: string; size: number } {
  const r = (cell * Math.SQRT2) / 4;
  const size = cell * TILE_CELLS;
  const circles: string[] = [];
  for (let i = 0; i <= TILE_CELLS; i++) {
    for (let j = 0; j <= TILE_CELLS; j++) {
      circles.push(`<circle cx='${i * cell}' cy='${j * cell}' r='${r}' fill='url(%23g)'/>`);
      if (i < TILE_CELLS && j < TILE_CELLS) circles.push(`<circle cx='${i * cell + cell / 2}' cy='${j * cell + cell / 2}' r='${r}' fill='url(%23g)'/>`);
    }
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 ${size} ${size}'>` +
    `<defs><radialGradient id='g'><stop offset='0' stop-opacity='1'/><stop offset='1' stop-opacity='0.02'/></radialGradient></defs>` +
    `<rect width='${size}' height='${size}' fill-opacity='0.02'/>${circles.join("")}</svg>`;
  return { href: `data:image/svg+xml;utf8,${svg}`, size };
}

/**
 * Letterpress ink for display type. `rough` displaces the glyph edge, `gain` is how far
 * ink spreads past it, `mottle` how uneven the inking is (0 = perfectly even).
 */
function InkFilter({ id, rough, gain, mottle }: { id: string; rough: number; gain: number; mottle: number }) {
  return (
    <filter id={id} x="-3%" y="-15%" width="106%" height="130%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="grain" />
      <feDisplacementMap in="SourceAlpha" in2="grain" scale={rough} xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feGaussianBlur in="rough" stdDeviation={gain} result="soft" />
      <feComponentTransfer in="soft" result="inked">
        <feFuncA type="linear" slope="2.6" intercept="-0.5" />
      </feComponentTransfer>
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="blotch" />
      <feColorMatrix in="blotch" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${mottle * 2} 0 0 0 ${1 - mottle * 1.5}`} result="density" />
      <feComposite in="inked" in2="density" operator="in" result="mottled" />
      <feFlood floodColor={INK} result="ink" />
      <feComposite in="ink" in2="mottled" operator="in" />
    </filter>
  );
}

/** `cell` is the photo screen pitch in CSS px (App coarsens it on low-DPI screens). */
export function HalftoneDefs({ cell }: { cell: number }) {
  const { href, size } = dotTile(cell);
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <InkFilter id="ink-xl" rough={2.2} gain={0.7} mottle={0.12} />
        <InkFilter id="ink-display" rough={1.3} gain={0.45} mottle={0.12} />

        <filter id="ht-photo" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="lum" />
          {/* Tone → dot size: paper white (98.5%) prints pin-points, 28% and darker prints
              solid; dot area grows with r², so the curve converts coverage to radius. */}
          <feComponentTransfer in="lum" result="L">
            <feFuncA type="table" tableValues="0 0 0 0 0 0 0 0 0 0.017 0.064 0.113 0.166 0.222 0.282 0.348 0.422 0.506 0.608 0.749 1" />
          </feComponentTransfer>
          <feImage href={href} x="0" y="0" width={size} height={size} preserveAspectRatio="none" result="tile" />
          <feTile in="tile" result="T" />
          {/* ink where the dot value exceeds the tone; a steep ramp gives soft dot edges */}
          <feComposite in="T" in2="L" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0.5" result="v" />
          <feComponentTransfer in="v" result="dots">
            <feFuncA type="linear" slope="7" intercept="-3" />
          </feComponentTransfer>
          <feGaussianBlur in="dots" stdDeviation="0.2" result="spread" />
          <feFlood floodColor={PHOTO_INK} result="ink" />
          <feComposite in="ink" in2="spread" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
