import { MastheadRule } from "./Primitives";

export function Masthead({
  name = "The Times of Cyber",
  tagline = '"All the News \nThat\'s Fit to Print"',
  date = "Monday, April 28, 2026",
  edition = "Late Edition · $4.00",
  nameplateClassName,
  showBottomBorder = "true",
}) {
  return (
    <div className="px-[10px] pt-[6px]">
      {/* Top thick rule */}
      <div className="border-t-[3px] border-[#111] mb-[2px]" />

      {/* Three-column meta row */}
      <div className="flex justify-between items-center mb-[2px] font-Libre">
        <span className="text-[6px] leading-[1.3] max-w-[18%] text-[#333]">
          {tagline.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </span>

        <div className={`flex-1 text-center ${nameplateClassName}`}>{name}</div>

        <div className="text-right text-[5.8px] leading-[1.4] max-w-[22%] text-[#333]">
          <div>{date.toUpperCase()}</div>
          <div>{edition.toUpperCase()}</div>
        </div>
      </div>

      <MastheadRule showBottomBorder={showBottomBorder} />
    </div>
  );
}
