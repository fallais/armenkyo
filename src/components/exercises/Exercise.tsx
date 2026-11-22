"use client";

import type { CardKind } from "@/lib/db";
import { cardKinds, type Question } from "@/lib/quiz";
import { ChoiceExercise } from "./ChoiceExercise";
import { WriteExercise } from "./WriteExercise";

export type Outcome = "good" | "self" | "bad";
/** Une réponse par carte concernée (deux pour un tracé majuscule + minuscule). */
export type ExerciseResult = { kind: CardKind; outcome: Outcome };

/** Aiguille vers le bon type d'exercice. `key` doit changer à chaque question. */
export function Exercise({ question, onAnswer }: { question: Question; onAnswer: (results: ExerciseResult[]) => void }) {
  if (question.mode !== "write") {
    return <ChoiceExercise question={question} onAnswer={(ok) => onAnswer([{ kind: question.mode as CardKind, outcome: ok ? "good" : "bad" }])} />;
  }
  return (
    <WriteExercise
      question={question}
      onAnswer={(rs) => onAnswer(rs.map((r) => ({ kind: cardKinds("write", [r.letterCase])[0], outcome: r.outcome })))}
    />
  );
}
