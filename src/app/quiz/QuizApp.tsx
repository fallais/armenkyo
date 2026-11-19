"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { LETTERS, type Letter } from "@/data/letters";
import { Exercise, type Outcome } from "@/components/exercises/Exercise";
import { PrimaryButton, ProgressBar, Segmented } from "@/components/ui";
import { db, logAnswer } from "@/lib/db";
import { buildQuiz, type Question, type QuizMode } from "@/lib/quiz";
import type { Case } from "@/lib/strokes";

const MODES: { value: QuizMode; title: string; desc: string; demo: string }[] = [
  { value: "read", title: "Lettre → son", desc: "Reconnaître le son d'une lettre", demo: "Բ → b" },
  { value: "listen", title: "Son → lettre", desc: "Retrouver la lettre d'un son", demo: "b → Բ" },
  { value: "write", title: "Son → tracé", desc: "Écrire la lettre de mémoire", demo: "b → ✍️" },
];

type LetterSet = "all" | "studied" | "custom";
type Result = { question: Question; outcome: Outcome };

export function QuizApp() {
  const [mode, setMode] = useState<QuizMode>("read");
  const [caseMode, setCaseMode] = useState<Case | "both">("both");
  const [set, setSet] = useState<LetterSet>("all");
  const [custom, setCustom] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [answered, setAnswered] = useState(false);

  const studied = useLiveQuery(async () => new Set((await db.cards.orderBy("letterId").uniqueKeys()) as string[]), []);

  const pool: Letter[] =
    set === "all" ? LETTERS : set === "studied" ? LETTERS.filter((l) => studied?.has(l.id)) : LETTERS.filter((l) => custom.has(l.id));

  function start(letters = pool) {
    setQuestions(buildQuiz(mode, letters, caseMode, count));
    setIndex(0);
    setResults([]);
    setAnswered(false);
  }

  function onAnswer(outcome: Outcome) {
    const q = questions![index];
    setResults((r) => [...r, { question: q, outcome }]);
    setAnswered(true);
    logAnswer({ letterId: q.letter.id, kind: q.kind, correct: outcome !== "bad", source: "quiz" });
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswered(false);
  }

  // --- Session en cours ---
  if (questions && index < questions.length) {
    const q = questions[index];
    return (
      <div className="mx-auto max-w-md pb-20 md:pb-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQuestions(null)} className="text-xl text-muted" aria-label="Quitter">✕</button>
          <ProgressBar value={index + (answered ? 1 : 0)} max={questions.length} />
          <span className="text-sm tabular-nums text-muted">{index + 1}/{questions.length}</span>
        </div>
        <div className="mt-6">
          <Exercise key={index} question={q} onAnswer={onAnswer} />
        </div>
        {answered && (
          <div className="fixed inset-x-0 bottom-16 z-10 px-4 md:static md:mt-6 md:px-0">
            <PrimaryButton onClick={next} className="w-full" autoFocus>
              Continuer
            </PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  // --- Résultats ---
  if (questions) {
    const good = results.filter((r) => r.outcome !== "bad").length;
    const mistakes = [...new Map(results.filter((r) => r.outcome === "bad").map((r) => [r.question.letter.id, r.question.letter])).values()];
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl">{good === results.length ? "🎉" : good / results.length >= 0.7 ? "👏" : "💪"}</div>
        <h1 className="mt-3 text-2xl font-bold">{good} / {results.length}</h1>
        <p className="text-muted">bonnes réponses</p>
        {mistakes.length > 0 && (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-left">
            <h2 className="text-sm font-semibold">À revoir</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {mistakes.map((l) => (
                <Link key={l.id} href={`/alphabet/${l.id}`} className="hy rounded-xl border border-line px-3 py-1.5 text-lg">
                  {l.upper}{l.lower} <span className="font-sans text-xs text-muted">{l.translit}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2">
          {mistakes.length > 0 && <PrimaryButton onClick={() => start(mistakes)}>Revoir mes erreurs</PrimaryButton>}
          <button type="button" onClick={() => start()} className="rounded-2xl border border-line bg-surface px-6 py-3 font-semibold">
            Recommencer
          </button>
          <button type="button" onClick={() => setQuestions(null)} className="py-2 text-sm text-muted">
            Changer de mode
          </button>
        </div>
      </div>
    );
  }

  // --- Configuration ---
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Quiz</h1>
      <p className="mt-1 text-sm text-muted">Entraînement libre, sans effet sur vos révisions.</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`flex items-center gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition sm:flex-col sm:items-start ${mode === m.value ? "border-brand-500" : "border-line"}`}
          >
            <span className="hy w-16 shrink-0 text-lg font-semibold text-brand-600">{m.demo}</span>
            <span>
              <span className="block font-semibold">{m.title}</span>
              <span className="block text-xs text-muted">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Casse</h2>
      <Segmented
        value={caseMode}
        onChange={setCaseMode}
        options={[
          { value: "lower", label: "Minuscules" },
          { value: "upper", label: "Majuscules" },
          { value: "both", label: "Les deux" },
        ]}
      />

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Lettres</h2>
      <Segmented
        value={set}
        onChange={setSet}
        options={[
          { value: "all", label: `Toutes (${LETTERS.length})` },
          { value: "studied", label: `Étudiées (${studied?.size ?? 0})` },
          { value: "custom", label: "Choisir" },
        ]}
      />
      {set === "custom" && (
        <div className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-10">
          {LETTERS.map((l) => {
            const on = custom.has(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setCustom((s) => { const n = new Set(s); if (on) n.delete(l.id); else n.add(l.id); return n; })}
                className={`hy aspect-square rounded-lg border text-lg ${on ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface"}`}
              >
                {l.lower}
              </button>
            );
          })}
        </div>
      )}
      {set === "studied" && studied?.size === 0 && (
        <p className="mt-2 text-sm text-muted">Aucune lettre étudiée pour l&apos;instant : commencez par les <Link href="/revisions" className="text-brand-600 underline">révisions</Link>.</p>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Questions</h2>
      <Segmented value={count} onChange={setCount} options={[10, 20, 39].map((n) => ({ value: n, label: n }))} />

      <PrimaryButton onClick={() => start()} disabled={pool.length < 1} className="mt-8 w-full">
        Commencer
      </PrimaryButton>
    </div>
  );
}
