import { getStrokes } from "@/lib/strokes";

/** Lettre manuscrite (cursif) dessinée à partir des tracés de référence. */
export function HandGlyph({ glyph, className = "", strokeWidth = 4.5, viewBox = "0 0 100 100" }: { glyph: string; className?: string; strokeWidth?: number; viewBox?: string }) {
  const strokes = getStrokes(glyph);
  if (!strokes) return <span className={`hy ${className}`}>{glyph}</span>;
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={glyph}>
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {strokes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
