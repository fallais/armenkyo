"use client";

import type { Question } from "@/lib/quiz";
import { ChoiceExercise } from "./ChoiceExercise";
import { WriteExercise, type WriteOutcome } from "./WriteExercise";

export type Outcome = "good" | "self" | "bad";

/** Aiguille vers le bon type d'exercice. `key` doit changer à chaque question. */
export function Exercise({ question, onAnswer }: { question: Question; onAnswer: (o: Outcome) => void }) {
  if (question.kind === "read" || question.kind === "listen") {
    return <ChoiceExercise question={question} onAnswer={(ok) => onAnswer(ok ? "good" : "bad")} />;
  }
  return <WriteExercise question={question} onAnswer={(o: WriteOutcome) => onAnswer(o)} />;
}
