"use client";

import { useState } from "react";
import type { Letter } from "@/data/letters";
import type { Point } from "@/lib/paths";
import { recognize } from "@/lib/recognizer";
import { getStrokes, glyphFor, viewBoxFor, type Case } from "@/lib/strokes";
import { DrawingPad } from "./DrawingPad";

/** Entraînement libre : tracer la lettre (avec ou sans modèle en filigrane) puis vérifier. */
export function WritingPractice({ letter, letterCase }: { letter: Letter; letterCase: Case }) {
  const glyph = glyphFor(letter, letterCase);
  const ref = getStrokes(glyph);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [withGuide, setWithGuide] = useState(true);
  const [result, setResult] = useState<boolean | null>(null);

  if (!ref) return null;

  function check() {
    setResult(recognize(strokes, letter.id, letterCase).accepted);
  }

  function reset(next: Point[][]) {
    setStrokes(next);
    setResult(null);
  }

  return (
    <div>
      <div className="mx-auto max-w-[320px]">
        <DrawingPad
          viewBox={viewBoxFor(glyph)}
          strokes={strokes}
          onChange={reset}
          guide={withGuide ? ref : undefined}
          reveal={result === false && !withGuide ? ref : undefined}
          tone={result === null ? "neutral" : result ? "good" : "bad"}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={withGuide} onChange={(e) => { setWithGuide(e.target.checked); reset([]); }} className="accent-brand-500" />
          Modèle en filigrane
        </label>
        <button
          type="button"
          onClick={check}
          disabled={strokes.length === 0}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Vérifier
        </button>
      </div>
      {result !== null && (
        <p className={`animate-pop mt-3 text-center text-sm font-medium ${result ? "text-emerald-600" : "text-brand-600"}`}>
          {result ? "Bien tracé !" : "Pas tout à fait : regardez l'animation et réessayez."}
        </p>
      )}
    </div>
  );
}
