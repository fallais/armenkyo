"use client";

import { useState } from "react";
import type { Point } from "@/lib/paths";
import type { Question } from "@/lib/quiz";
import { recognize } from "@/lib/recognizer";
import { getStrokes, glyphFor, viewBoxFor, type Case } from "@/lib/strokes";
import { DrawingPad } from "../DrawingPad";
import { HandGlyph } from "../HandGlyph";
import { StrokeAnimation } from "../StrokeAnimation";
import { SoundPrompt } from "./SoundPrompt";

/** Résultat : « good » (reconnu), « self » (non reconnu mais l'utilisateur s'estime juste), « bad ». */
export type WriteOutcome = "good" | "self" | "bad";
export type WriteResult = { letterCase: Case; outcome: WriteOutcome };

type Verdict = "accepted" | "rejected" | "gaveup";
type Pad = { strokes: Point[][]; verdict?: Verdict; outcome?: WriteOutcome };

type Props = { question: Question; onAnswer: (results: WriteResult[]) => void };

const CASE_LABEL: Record<Case, string> = { upper: "majuscule", lower: "minuscule" };

/** Son → tracé : l'utilisateur dessine la lettre de mémoire, sans modèle, dans une ou deux casses. */
export function WriteExercise({ question, onAnswer }: Props) {
  const { letter, cases } = question;
  const [pads, setPads] = useState<Pad[]>(() => cases.map(() => ({ strokes: [] })));
  const checked = pads.some((p) => p.verdict);
  const double = cases.length > 1;

  function update(next: Pad[]) {
    setPads(next);
    if (next.every((p) => p.outcome) && !pads.every((p) => p.outcome)) {
      onAnswer(next.map((p, i) => ({ letterCase: cases[i], outcome: p.outcome! })));
    }
  }

  function check() {
    update(
      pads.map((p, i): Pad => {
        if (p.strokes.length === 0) return { ...p, verdict: "gaveup", outcome: "bad" };
        return recognize(p.strokes, letter.id, cases[i]).accepted ? { ...p, verdict: "accepted", outcome: "good" } : { ...p, verdict: "rejected" };
      }),
    );
  }

  function giveUp() {
    update(pads.map((p) => ({ ...p, verdict: "gaveup", outcome: "bad" })));
  }

  function selfAssess(i: number, outcome: WriteOutcome) {
    update(pads.map((p, j) => (j === i ? { ...p, outcome } : p)));
  }

  return (
    <div className="animate-pop">
      <p className="text-center text-sm text-muted">
        Écrivez cette lettre en{" "}
        <strong className="text-foreground">{double ? "majuscule et en minuscule" : CASE_LABEL[cases[0]]}</strong>
      </p>
      <div className="my-4">
        <SoundPrompt letter={letter} autoPlay />
      </div>

      <div className={double ? "grid grid-cols-2 gap-3" : "mx-auto max-w-[300px]"}>
        {cases.map((c, i) => {
          const glyph = glyphFor(letter, c);
          const pad = pads[i];
          return (
            <div key={c}>
              {double && <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wider text-muted">{CASE_LABEL[c]}</div>}
              <DrawingPad
                viewBox={viewBoxFor(glyph)}
                strokes={pad.strokes}
                onChange={(strokes) => setPads((ps) => ps.map((p, j) => (j === i ? { ...p, strokes } : p)))}
                disabled={checked}
                compact={double}
                reveal={pad.verdict && pad.verdict !== "accepted" ? getStrokes(glyph) : undefined}
                tone={!pad.verdict ? "neutral" : pad.verdict === "accepted" ? "good" : "bad"}
              />
              {pad.verdict && (
                <Feedback glyph={glyph} pad={pad} compact={double} onSelf={(o) => selfAssess(i, o)} />
              )}
            </div>
          );
        })}
      </div>

      {!checked && (
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={giveUp} className="rounded-full border border-line bg-surface px-5 py-2 text-sm text-muted">
            Je ne sais pas
          </button>
          <button
            type="button"
            onClick={check}
            disabled={pads.every((p) => p.strokes.length === 0)}
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Vérifier
          </button>
        </div>
      )}
    </div>
  );
}

function Feedback({ glyph, pad, compact, onSelf }: { glyph: string; pad: Pad; compact: boolean; onSelf: (o: WriteOutcome) => void }) {
  const { verdict, outcome } = pad;
  const message = verdict === "accepted" ? "Bien tracé !" : verdict === "rejected" ? "Le tracé ne correspond pas." : "Voici comment l'écrire.";
  return (
    <div className={`animate-pop mt-3 flex items-center gap-3 ${compact ? "flex-col text-center" : ""}`}>
      {!compact &&
        (verdict === "accepted" ? (
          <HandGlyph glyph={glyph} className="h-20 w-20 shrink-0 text-emerald-600" />
        ) : (
          <StrokeAnimation glyph={glyph} className="aspect-square w-24 shrink-0 rounded-2xl border border-line bg-surface" showReplay={false} />
        ))}
      <div className="flex-1">
        <p className={`text-sm font-medium ${verdict === "accepted" ? "text-emerald-600" : "text-brand-600"}`}>{message}</p>
        {verdict === "rejected" && (
          <div className={`mt-2 flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              type="button"
              disabled={!!outcome}
              onClick={() => onSelf("bad")}
              className={`rounded-full border px-3 py-1.5 text-sm disabled:opacity-40 ${outcome === "bad" ? "border-brand-500 opacity-100!" : "border-line bg-surface"}`}
            >
              J&apos;avais faux
            </button>
            <button
              type="button"
              disabled={!!outcome}
              onClick={() => onSelf("self")}
              className={`rounded-full border border-emerald-500 px-3 py-1.5 text-sm text-emerald-700 disabled:opacity-40 dark:text-emerald-400 ${outcome === "self" ? "bg-emerald-50 opacity-100! dark:bg-emerald-500/15" : ""}`}
            >
              J&apos;avais juste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
