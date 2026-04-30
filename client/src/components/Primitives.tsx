/** Thin + double rule that sits below the masthead meta row */
export function MastheadRule({ showBottomBorder = true }) {
  return (
    <div
      style={{
        borderTop: "1px solid #999",
        borderBottom: showBottomBorder ? "3px double #111" : "none",
        paddingBottom: "1px",
        marginBottom: "3px",
      }}
    />
  );
}

/** Vertical column separator — use as a right-border utility wrapper */
export function ColRule({ children, className = "", style = {} }) {
  return (
    <div className={`border-r border-[#999] ${className}`} style={style}>
      {children}
    </div>
  );
}

/** Horizontal story separator */
export function HRule({ className = "" }) {
  return <div className={`border-t border-[#aaa] my-1.5 ${className}`} />;
}

/**
 * Story headline — size controls font-size class
 * size: 'banner' | 'lead' | 'secondary' | 'brief'
 */
export function Headline({ children, size = "secondary" }) {
  const sizes = {
    banner:
      "font-Libre text-[30px] font-bold leading-none tracking-tight uppercase text-center",
    lead: "font-Libre text-[11px] font-bold leading-snug",
    secondary: "font-Libre text-[9px] font-bold leading-snug",
    brief: "font-Libre text-[8px] font-bold leading-snug",
  };
  return <p className={sizes[size]}>{children}</p>;
}

/** Deck / sub-headline beneath a banner */
export function Deck({ children }) {
  return (
    <p className="text-center font-Libre text-[10px] font-bold tracking-wide uppercase text-[#111] mb-[3px]">
      {children}
    </p>
  );
}

/** Italic byline line */
export function Byline({ children }) {
  return <p className="text-[5.8px] text-[#444] italic mb-[3px]">{children}</p>;
}

/** Caption beneath a photo */
export function Caption({ children }) {
  return (
    <p className="text-[5.5px] text-[#444] italic mt-[1.5px] leading-[1.3]">
      {children}
    </p>
  );
}

/** Jump line / continued-on */
export function JumpLine({ children }) {
  return (
    <p className="text-[5.4px] text-[#555] border-t border-[#aaa] pt-[2px] mt-[5px]">
      {children}
    </p>
  );
}

/**
 * Body copy paragraph.
 * dropCap: applies ::first-letter styling via a CSS class (needs global .drop-cap rule).
 * All hyphens/justify lives in the global .newsprint class — can't do those in Tailwind.
 */
export function Body({ children, dropCap = false, className = "" }) {
  return (
    <p
      className={`newsprint mb-[4px] ${dropCap ? "drop-cap" : ""} ${className}`}
    >
      {children}
    </p>
  );
}

/** Photo with optional halftone swap */
export function Photo({ src, alt = "", height = "130px", className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`block w-full object-cover grayscale-[0.3] contrast-[1.1] ${className}`}
      style={{ height }}
      onError={(e) => {
        e.target.style.background = "#ccc";
        e.target.alt = "";
      }}
    />
  );
}

/** Footer strip at the bottom of a page */
export function FooterStrip({ left, right }) {
  return (
    <div className="font-Libre border-t-2 border-[#111] mt-[4px] pt-[2px] flex justify-between text-[5.4px] text-[#555]">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
