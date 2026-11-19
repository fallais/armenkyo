"use client";

import { useState } from "react";
import type { Question } from "@/lib/quiz";
import { glyphFor } from "@/lib/strokes";
import { SoundPrompt } from "./SoundPrompt";

type Props = { question: Question; onAnswer: (correct: boolean) => void };

/** QCM : « read » = lettre → son ; « listen » = son → lettre. */
export function ChoiceExercise({ question, onAnswer }: Props) {
  const { letter, kind, letterCase, choices = [] } = question;
  const [picked, setPicked] = useState<string | null>(null);

  function pick(id: string) {
    if (picked) return;
    setPicked(id);
    onAnswer(id === letter.id);
  }

  return (
    <div className="animate-pop">
      <p className="text-center text-sm text-muted">{kind === "read" ? "Quel est le son de cette lettre ?" : "Quelle lettre correspond à ce son ?"}</p>
      <div className="my-6 flex min-h-28 items-center justify-center">
        {kind === "read" ? (
          <span className="hy text-8xl leading-none">{glyphFor(letter, letterCase)}</span>
        ) : (
          <SoundPrompt letter={letter} autoPlay />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
          const state = !picked ? "idle" : c.id === letter.id ? "right" : c.id === picked ? "wrong" : "dim";
          const styles = {
            idle: "border-line bg-surface hover:border-brand-200 active:scale-[0.98]",
            right: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15",
            wrong: "border-brand-500 bg-brand-50 dark:bg-brand-500/15",
            dim: "border-line bg-surface opacity-50",
          }[state];
          return (
            <button key={c.id} type="button" onClick={() => pick(c.id)} className={`rounded-2xl border-2 p-4 text-center transition ${styles}`}>
              {kind === "read" ? (
                <>
                  <div className="text-2xl font-bold">{c.translit}</div>
                  <div className="text-xs text-muted">{c.nameLatin}</div>
                </>
              ) : (
                <div className="hy text-5xl leading-tight">{glyphFor(c, letterCase === "upper" && c.id !== "yev" ? "upper" : "lower")}</div>
              )}
            </button>
          );
        })}
      </div>
      {picked && kind === "read" && (
        <p className="mt-4 text-center text-sm text-muted">
          <span className="hy font-semibold text-foreground">{letter.upper} {letter.lower}</span> — {letter.nameLatin} : {letter.hint}
        </p>
      )}
    </div>
  );
}
