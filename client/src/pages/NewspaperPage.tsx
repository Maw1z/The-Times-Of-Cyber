import { Masthead } from "../components/MastHead";

/**
 * Props:
 *   layout     — a React element (already constructed with its story props)
 *   banner     — { headline, deck } for the full-width banner
 *   mastheadProps? — forwarded to <Masthead>
 */
export function NewspaperPage({ layout, banner, mastheadProps = {} }) {
  return (
    <>
      <style>{`
        .newsprint {
          font-family: 'Libre Baskerville', serif;
          font-size: 7.2px;
          line-height: 1.45;
          text-align: justify;
          hyphens: auto;
          color: #111;
          margin-bottom: 4px;
        }
        .drop-cap::first-letter {
          font-family: 'Libre Baskerville', serif;
          font-size: 2.8em;
          font-weight: 700;
          float: left;
          line-height: 0.82;
          margin-right: 2px;
          margin-top: 2px;
        }
      `}</style>

      {/* The broadsheet paper */}
      <div
        className="bg-[#F9F6EF] shadow-2xl overflow-x-hidden flex flex-col border border-[#bbb]"
        style={{ aspectRatio: "17/22", maxWidth: "37vw" }}
      >
        {/* Masthead */}
        <Masthead {...mastheadProps} />

        {/* Banner headline + deck */}
        {banner && (
          <div className="px-[10px]">
            <p className="text-center font-Libre font-bold uppercase text-[30px] leading-none tracking-tight mb-[1px] font-Libre">
              {banner.headline}
            </p>
            {banner.deck && (
              <p className="text-center font-bold uppercase tracking-wide text-[#111] mb-[3px] text-[10px] font-Libre">
                {banner.deck}
              </p>
            )}
          </div>
        )}

        {/* Layout slot — each layout is a self-contained component */}
        {layout}
      </div>
    </>
  );
}
