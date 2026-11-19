"use client";

import { useMemo, useState } from "react";
import { polylineLength, samplePath } from "@/lib/paths";
import { getStrokes, viewBoxAttr, viewBoxFor } from "@/lib/strokes";
import { WritingGuides } from "./WritingGuides";

const KEYFRAMES = `
@keyframes stroke-draw { 0% { stroke-dashoffset: 1; opacity: 0 } 1% { opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 1 } }
@keyframes stroke-fade-in { from { opacity: 0 } to { opacity: 1 } }
`;

type Props = {
  glyph: string;
  /** Vitesse en unités du repère par seconde. */
  speed?: number;
  className?: string;
  showReplay?: boolean;
};

/** Animation de l'ordre des traits, avec numéro et point de départ de chaque trait. */
export function StrokeAnimation({ glyph, speed = 70, className = "", showReplay = true }: Props) {
  const [run, setRun] = useState(0);
  const strokes = useMemo(() => getStrokes(glyph) ?? [], [glyph]);
  const timings = useMemo(() => {
    const out: { start: number; dur: number; first: { x: number; y: number } }[] = [];
    for (const d of strokes) {
      const pts = samplePath(d);
      const dur = Math.max(0.35, polylineLength(pts) / speed);
      const prev = out.at(-1);
      out.push({ start: prev ? prev.start + prev.dur + 0.25 : 0.3, dur, first: pts[0] });
    }
    return out;
  }, [strokes, speed]);

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={viewBoxAttr(viewBoxFor(glyph))} className="h-full w-full overflow-hidden" aria-label={`Ordre des traits de ${glyph}`}>
        {/* Images clés locales : Tailwind v4 élimine les @keyframes globales non déclarées dans @theme. */}
        <style>{KEYFRAMES}</style>
        <WritingGuides />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((d, i) => (
            <path key={`ghost-${i}`} d={d} stroke="currentColor" strokeOpacity={0.1} strokeWidth={4.5} />
          ))}
          {strokes.map((d, i) => (
            <path
              key={`${run}-${i}`}
              d={d}
              pathLength={1}
              strokeDasharray="1 2"
              strokeDashoffset={1}
              className="stroke-brand-500"
              strokeWidth={4.5}
              style={{ opacity: 0, animation: `stroke-draw ${timings[i].dur}s ${timings[i].start}s linear forwards` }}
            />
          ))}
        </g>
        {timings.map((t, i) => (
          <g
            key={`${run}-n-${i}`}
            style={{ opacity: 0, animation: `stroke-fade-in 0.2s ${t.start}s forwards` }}
            transform={`translate(${t.first.x} ${t.first.y})`}
          >
            <circle r={3.2} className="fill-apricot-500" />
            <text textAnchor="middle" dy={1.4} fontSize={4} fontWeight={700} fill="white">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      {showReplay && (
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="absolute bottom-1 right-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground"
        >
          ↻ Rejouer
        </button>
      )}
    </div>
  );
}
