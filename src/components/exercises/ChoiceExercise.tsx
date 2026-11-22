"use client";

import { useState } from "react";
import type { Letter } from "@/data/letters";
import { playLetter } from "@/lib/audio";
import type { Question } from "@/lib/quiz";
import { glyphFor } from "@/lib/strokes";
import { LetterGlyph } from "../LetterGlyph";
import { ActionBar, PrimaryButton } from "../ui";
import { SoundPrompt } from "./SoundPrompt";

type Props = { question: Question; onAnswer: (correct: boolean) => void };

/**
 * QCM.
 * - « read » (lettre → son) : toucher une proposition la fait entendre et la sélectionne, « Valider » confirme.
 * - « listen » (son → lettre) : toucher une proposition répond ; ensuite chaque proposition s'écoute et affiche son son.
 */
export function ChoiceExercise({ question, onAnswer }: Props) {
  const { letter, mode, letterCase, choices = [] } = question;
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit(id: string) {
    setSelected(id);
    setSubmitted(true);
    onAnswer(id === letter.id);
  }

  function tap(c: Letter) {
    if (submitted) {
      playLetter(c);
    } else if (mode === "read") {
      setSelected(c.id);
      playLetter(c);
    } else {
      submit(c.id);
    }
  }

  const choiceCase = (c: Letter) => (letterCase === "upper" && c.id !== "yev" ? "upper" : "lower");

  return (
    <div className="animate-pop">
      <p className="text-center text-sm text-muted">{mode === "read" ? "Quel est le son de cette lettre ?" : "Quelle lettre correspond à ce son ?"}</p>
      <div className="my-6 flex min-h-32 items-center justify-center">
        {mode === "read" ? <LetterGlyph glyph={glyphFor(letter, letterCase)} size="xl" /> : <SoundPrompt letter={letter} autoPlay />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
          const state = !submitted ? (c.id === selected ? "selected" : "idle") : c.id === letter.id ? "right" : c.id === selected ? "wrong" : "other";
          const styles = {
            idle: "border-line bg-surface hover:border-brand-200 active:scale-[0.98]",
            selected: "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30 dark:bg-brand-500/15",
            right: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15",
            wrong: "border-brand-500 bg-brand-50 dark:bg-brand-500/15",
            other: "border-line bg-surface",
          }[state];
          const audible = mode === "read" || submitted;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => tap(c)}
              aria-pressed={mode === "read" && !submitted ? c.id === selected : undefined}
              className={`relative flex flex-col items-center rounded-2xl border-2 p-3 text-center transition ${styles}`}
            >
              {audible && <SpeakerIcon />}
              {mode === "read" ? (
                <>
                  <div className="text-2xl font-bold">{c.translit}</div>
                  <div className="text-xs text-muted">{c.nameLatin}</div>
                </>
              ) : (
                <>
                  <div className="flex h-16 items-center"><LetterGlyph glyph={glyphFor(c, choiceCase(c))} size="md" /></div>
                  {submitted && (
                    <div className="mt-1 text-sm font-semibold text-brand-600">
                      {c.translit} <span className="font-mono text-xs font-normal text-muted">[{c.ipa}]</span>
                    </div>
                  )}
                </>
              )}
              {submitted && <div className="mt-1 text-xs leading-snug text-muted">{c.hint}</div>}
            </button>
          );
        })}
      </div>
      {submitted && (
        <p className="mt-4 text-center text-sm text-muted">
          <span className="hy font-semibold text-foreground">{letter.upper} {letter.lower}</span> — lettre « {letter.nameLatin} ». Touchez une proposition pour l&apos;écouter.
        </p>
      )}
      {mode === "read" && !submitted && (
        <ActionBar>
          <PrimaryButton onClick={() => selected && submit(selected)} disabled={!selected} className="w-full">
            Valider
          </PrimaryButton>
        </ActionBar>
      )}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="absolute right-2 top-2 h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
