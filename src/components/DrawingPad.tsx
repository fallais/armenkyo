"use client";

import { useRef, useState, type PointerEvent } from "react";
import { toSvgPath, type Point } from "@/lib/paths";
import { WritingGuides } from "./WritingGuides";

type Props = {
  strokes: Point[][];
  onChange: (strokes: Point[][]) => void;
  /** Tracés de référence affichés en filigrane (mode calque). */
  guide?: string[];
  /** Tracés de la bonne réponse à superposer après vérification. */
  reveal?: string[];
  /** Couleur du tracé de l'utilisateur. */
  tone?: "neutral" | "good" | "bad";
  disabled?: boolean;
};

const TONES = { neutral: "stroke-foreground", good: "stroke-emerald-600", bad: "stroke-brand-500" };

export function DrawingPad({ strokes, onChange, guide, reveal, tone = "neutral", disabled }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [current, setCurrent] = useState<Point[] | null>(null);

  function toPoint(e: PointerEvent): Point {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  }

  function onDown(e: PointerEvent<SVGSVGElement>) {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setCurrent([toPoint(e)]);
  }

  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!current) return;
    const p = toPoint(e);
    const last = current[current.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 0.6) return;
    setCurrent([...current, p]);
  }

  function onUp() {
    if (!current) return;
    onChange([...strokes, current]);
    setCurrent(null);
  }

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className={`aspect-square w-full touch-none select-none rounded-2xl border border-line bg-surface ${disabled ? "" : "cursor-crosshair"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <WritingGuides />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {guide?.map((d, i) => <path key={`g${i}`} d={d} stroke="currentColor" strokeOpacity={0.14} strokeWidth={5} />)}
          {reveal?.map((d, i) => <path key={`r${i}`} d={d} className="stroke-emerald-500" strokeOpacity={0.35} strokeWidth={5} />)}
          {[...strokes, ...(current ? [current] : [])].map((s, i) => (
            <path key={i} d={toSvgPath(s)} className={TONES[tone]} strokeWidth={3.5} />
          ))}
        </g>
      </svg>
      <div className="mt-2 flex justify-center gap-2">
        <button
          type="button"
          disabled={disabled || strokes.length === 0}
          onClick={() => onChange(strokes.slice(0, -1))}
          className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-muted disabled:opacity-40"
        >
          ↶ Annuler
        </button>
        <button
          type="button"
          disabled={disabled || strokes.length === 0}
          onClick={() => onChange([])}
          className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-muted disabled:opacity-40"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}
