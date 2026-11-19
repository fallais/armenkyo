"use client";

import { useState } from "react";
import type { Point } from "@/lib/paths";
import type { Question } from "@/lib/quiz";
import { recognize } from "@/lib/recognizer";
import { getStrokes, glyphFor } from "@/lib/strokes";
import { DrawingPad } from "../DrawingPad";
import { HandGlyph } from "../HandGlyph";
import { StrokeAnimation } from "../StrokeAnimation";
import { SoundPrompt } from "./SoundPrompt";

/** Résultat : « good » (reconnu), « self » (non reconnu mais l'utilisateur s'estime juste), « bad ». */
export type WriteOutcome = "good" | "self" | "bad";

type Props = { question: Question; onAnswer: (outcome: WriteOutcome) => void };

/** Son → tracé : l'utilisateur dessine la lettre de mémoire, sans modèle. */
export function WriteExercise({ question, onAnswer }: Props) {
  const { letter, letterCase } = question;
  const glyph = glyphFor(letter, letterCase);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [verdict, setVerdict] = useState<"accepted" | "rejected" | "gaveup" | null>(null);
  const [answered, setAnswered] = useState(false);

  function answer(o: WriteOutcome) {
    if (answered) return;
    setAnswered(true);
    onAnswer(o);
  }

  function check() {
    const r = recognize(strokes, letter.id, letterCase);
    setVerdict(r.accepted ? "accepted" : "rejected");
    if (r.accepted) answer("good");
  }

  function giveUp() {
    setVerdict("gaveup");
    answer("bad");
  }

  return (
    <div className="animate-pop">
      <p className="text-center text-sm text-muted">
        Écrivez cette lettre en <strong className="text-foreground">{letterCase === "upper" ? "majuscule" : "minuscule"}</strong>
      </p>
      <div className="my-4">
        <SoundPrompt letter={letter} autoPlay />
      </div>

      <div className="mx-auto max-w-[300px]">
        <DrawingPad
          strokes={strokes}
          onChange={setStrokes}
          disabled={verdict !== null}
          reveal={verdict && verdict !== "accepted" ? getStrokes(glyph) : undefined}
          tone={verdict === null ? "neutral" : verdict === "accepted" ? "good" : "bad"}
        />
      </div>

      {verdict === null && (
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={giveUp} className="rounded-full border border-line bg-surface px-5 py-2 text-sm text-muted">
            Je ne sais pas
          </button>
          <button
            type="button"
            onClick={check}
            disabled={strokes.length === 0}
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Vérifier
          </button>
        </div>
      )}

      {verdict && (
        <div className="animate-pop mx-auto mt-4 flex max-w-[300px] items-center gap-4">
          {verdict === "accepted" ? (
            <HandGlyph glyph={glyph} className="h-20 w-20 shrink-0 text-emerald-600" />
          ) : (
            <StrokeAnimation glyph={glyph} className="aspect-square w-24 shrink-0 rounded-2xl border border-line bg-surface" showReplay={false} />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${verdict === "accepted" ? "text-emerald-600" : "text-brand-600"}`}>
              {verdict === "accepted" ? "Bien tracé !" : verdict === "rejected" ? "Le tracé ne correspond pas." : "Voici comment l'écrire."}
            </p>
            {verdict === "rejected" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={answered} onClick={() => answer("bad")} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm disabled:opacity-40">
                  J&apos;avais faux
                </button>
                <button type="button" disabled={answered} onClick={() => answer("self")} className="rounded-full border border-emerald-500 px-3 py-1.5 text-sm text-emerald-700 disabled:opacity-40 dark:text-emerald-400">
                  J&apos;avais juste
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
