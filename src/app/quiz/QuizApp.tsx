"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { LETTERS, type Letter } from "@/data/letters";
import { Exercise, type ExerciseResult, type Outcome } from "@/components/exercises/Exercise";
import { LetterIntro } from "@/components/LetterIntro";
import { GlyphStyleToggle } from "@/components/LetterGlyph";
import { ActionBar, PrimaryButton, ProgressBar, Segmented } from "@/components/ui";
import { logAnswer } from "@/lib/db";
import { buildQuiz, makeQuestion, shuffle, type Question, type QuizMode } from "@/lib/quiz";
import { useQuizConfig, useSelectedLetters, type QuizConfig } from "@/lib/settings";
import { REQUEUE_WINDOW_MS, Rating, type Grade, reviewKind, srsPlan } from "@/lib/srs";

const MODES: { value: QuizMode; title: string; desc: string; demo: string }[] = [
  { value: "read", title: "Lettre → son", desc: "Reconnaître le son d'une lettre", demo: "Բ → b" },
  { value: "listen", title: "Son → lettre", desc: "Retrouver la lettre d'un son", demo: "b → Բ" },
  { value: "write", title: "Son → tracé", desc: "Écrire la lettre de mémoire", demo: "b → ✍️" },
];

const GRADE: Record<Outcome, Grade> = { good: Rating.Good, self: Rating.Hard, bad: Rating.Again };
const RANK: Record<Outcome, number> = { good: 0, self: 1, bad: 2 };

type Step = { type: "intro"; letter: Letter } | { type: "question"; question: Question };
type Result = { question: Question; outcome: Outcome };
type Session = { order: QuizConfig["order"]; pool: Letter[]; steps: Step[] };

/** Nouvelles lettres présentées par groupes de 3, entre des révisions. */
const NEW_CHUNK = 3;

export function QuizApp() {
  const [config, setConfig] = useQuizConfig();
  const { mode, caseMode, order, count } = config;
  const { selected } = useSelectedLetters();
  const [session, setSession] = useState<Session | null>(null);
  const [done, setDone] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const pool: Letter[] = config.letters === "all" ? LETTERS : LETTERS.filter((l) => selected.has(l.id));
  const poolKey = pool.map((l) => l.id).join(",");
  const plan = useLiveQuery(() => srsPlan(mode, pool, caseMode), [mode, caseMode, poolKey]);

  async function start(letters = pool, sessionOrder = order) {
    const ask = (l: Letter): Step => ({ type: "question", question: makeQuestion(l, mode, caseMode, letters) });
    let steps: Step[];
    if (sessionOrder === "random") {
      steps = buildQuiz(mode, letters, caseMode, count).map((question) => ({ type: "question", question }));
    } else {
      const p = await srsPlan(mode, letters, caseMode);
      const picked = [...p.due, ...p.fresh].slice(0, count);
      const known = picked.filter((l) => !p.unseen.has(l.id));
      const unseen = picked.filter((l) => p.unseen.has(l.id));
      // Les plus en retard d'abord, puis les nouvelles lettres présentées par petits groupes, mêlées au reste.
      steps = known.splice(0, 5).map(ask);
      for (let i = 0; i < unseen.length; i += NEW_CHUNK) {
        const chunk = unseen.slice(i, i + NEW_CHUNK);
        steps.push(...chunk.map((letter): Step => ({ type: "intro", letter })));
        steps.push(...shuffle([...chunk, ...known.splice(0, NEW_CHUNK)]).map(ask));
      }
      steps.push(...shuffle(known).map(ask));
    }
    if (steps.length === 0) {
      // Plus rien à revoir : retour aux réglages, qui l'indiquent.
      setSession(null);
      return;
    }
    setSession({ order: sessionOrder, pool: letters, steps });
    setDone(0);
    setResults([]);
    setAnswered(false);
  }

  async function onAnswer(answers: ExerciseResult[]) {
    const step = session!.steps[0];
    if (step.type !== "question") return;
    const { question } = step;
    const outcome = answers.reduce<Outcome>((worst, a) => (RANK[a.outcome] > RANK[worst] ? a.outcome : worst), "good");
    setResults((r) => [...r, { question, outcome }]);
    setAnswered(true);
    if (session!.order === "random") {
      for (const a of answers) logAnswer({ letterId: question.letter.id, kind: a.kind, correct: a.outcome !== "bad", source: "quiz" });
      return;
    }
    const updated = await Promise.all(answers.map((a) => reviewKind(question.letter.id, a.kind, GRADE[a.outcome])));
    if (updated.some((c) => +c.fsrs.dueAt - Date.now() < REQUEUE_WINDOW_MS)) {
      // Pas encore acquise : elle repasse plus loin dans la séance.
      setSession((s) => {
        if (!s) return s;
        const steps = [...s.steps];
        const pos = Math.min(steps.length, 4 + Math.floor(Math.random() * 3));
        steps.splice(pos, 0, { type: "question", question: makeQuestion(question.letter, question.mode, caseMode, s.pool) });
        return { ...s, steps };
      });
    }
  }

  function next() {
    setSession((s) => s && { ...s, steps: s.steps.slice(1) });
    setDone((d) => d + 1);
    setAnswered(false);
  }

  // --- Séance en cours ---
  if (session && session.steps.length > 0) {
    const step = session.steps[0];
    const total = done + session.steps.length;
    return (
      <div className="mx-auto max-w-md pb-24 md:pb-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSession(null)} className="text-xl text-muted" aria-label="Quitter">✕</button>
          <ProgressBar value={done + (answered ? 1 : 0)} max={total} />
          <span className="text-sm tabular-nums text-muted">{done + 1}/{total}</span>
          <GlyphStyleToggle />
        </div>
        <div className="mt-6">
          {step.type === "intro" ? (
            <LetterIntro letter={step.letter} />
          ) : (
            <Exercise key={done} question={step.question} onAnswer={onAnswer} />
          )}
        </div>
        {(step.type === "intro" || answered) && (
          <ActionBar>
            <PrimaryButton onClick={next} className="w-full" autoFocus>
              {step.type === "intro" ? "J'ai compris" : "Continuer"}
            </PrimaryButton>
          </ActionBar>
        )}
      </div>
    );
  }

  // --- Résultats ---
  if (session) {
    const good = results.filter((r) => r.outcome !== "bad").length;
    const mistakes = [...new Map(results.filter((r) => r.outcome === "bad").map((r) => [r.question.letter.id, r.question.letter])).values()];
    const ratio = results.length ? good / results.length : 1;
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl">{ratio === 1 ? "🎉" : ratio >= 0.7 ? "👏" : "💪"}</div>
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
          {mistakes.length > 0 && <PrimaryButton onClick={() => start(mistakes, "random")}>Revoir mes erreurs</PrimaryButton>}
          <button type="button" onClick={() => start(session.pool, session.order)} className="rounded-2xl border border-line bg-surface px-6 py-3 font-semibold">
            Recommencer
          </button>
          <button type="button" onClick={() => setSession(null)} className="py-2 text-sm text-muted">
            Changer de mode
          </button>
        </div>
      </div>
    );
  }

  // --- Configuration ---
  const srsEmpty = order === "srs" && plan && plan.due.length === 0 && plan.fresh.length === 0;
  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <GlyphStyleToggle />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setConfig({ mode: m.value })}
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
        onChange={(v) => setConfig({ caseMode: v })}
        options={[
          { value: "lower", label: "Minuscules" },
          { value: "upper", label: "Majuscules" },
          { value: "both", label: "Les deux" },
        ]}
      />
      {mode === "write" && caseMode === "both" && (
        <p className="mt-2 text-xs text-muted">Chaque lettre se trace deux fois : en majuscule et en minuscule.</p>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Lettres</h2>
      <Segmented
        value={config.letters}
        onChange={(v) => setConfig({ letters: v })}
        options={[
          { value: "all", label: `Toutes (${LETTERS.length})` },
          { value: "selected", label: `Sélectionnées (${selected.size})` },
        ]}
      />
      {config.letters === "selected" && (
        <p className="mt-2 text-sm text-muted">
          {selected.size === 0 ? "Aucune lettre sélectionnée. " : ""}
          Ajoutez ou retirez des lettres depuis l&apos;<Link href="/alphabet" className="text-brand-600 underline">Alphabet</Link>.
        </p>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Ordre</h2>
      <Segmented
        value={order}
        onChange={(v) => setConfig({ order: v })}
        options={[
          { value: "srs", label: "Répétition espacée" },
          { value: "random", label: "Aléatoire" },
        ]}
      />
      <p className="mt-2 text-sm text-muted">
        {order === "random" ? (
          "Tirage au hasard, sans effet sur la répétition espacée."
        ) : !plan ? (
          "…"
        ) : srsEmpty ? (
          <>Rien à revoir pour ces lettres{plan.nextDue && <> avant le {formatDue(plan.nextDue)}</>}. Passez en aléatoire ou ajoutez des lettres.</>
        ) : (
          <>
            Chaque lettre revient juste avant que vous ne l&apos;oubliiez :{" "}
            <strong className="text-foreground">{plan.due.length}</strong> à revoir ·{" "}
            <strong className="text-foreground">{plan.fresh.length}</strong> nouvelle{plan.fresh.length > 1 ? "s" : ""}.
          </>
        )}
      </p>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Questions {order === "srs" && <span className="font-normal">(au plus)</span>}</h2>
      <Segmented value={count} onChange={(v) => setConfig({ count: v })} options={[10, 20, 39].map((n) => ({ value: n, label: n }))} />

      <PrimaryButton onClick={() => start()} disabled={pool.length < 1 || !!srsEmpty || (order === "srs" && !plan)} className="mt-8 w-full">
        Commencer
      </PrimaryButton>
    </div>
  );
}

function formatDue(d: Date): string {
  return d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
