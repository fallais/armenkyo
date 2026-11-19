"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { LETTERS_BY_ID, type Letter } from "@/data/letters";
import { AudioButton } from "@/components/AudioButton";
import { HandGlyph } from "@/components/HandGlyph";
import { Exercise, type Outcome } from "@/components/exercises/Exercise";
import { StrokeAnimation } from "@/components/StrokeAnimation";
import { PrimaryButton, ProgressBar } from "@/components/ui";
import { db, getSetting, setSetting, type StoredCard } from "@/lib/db";
import { makeQuestion, shuffle, type Question } from "@/lib/quiz";
import { DEFAULT_NEW_PER_DAY, NEW_PER_DAY_KEY, Rating, type Grade, dueCards, introduceNewLetters, pendingNewLetters, reviewCard } from "@/lib/srs";

type Step = { type: "intro"; letter: Letter } | { type: "card"; card: StoredCard; question: Question };

/** Délai sous lequel une carte revient dans la même séance (pas d'apprentissage 1 min / 10 min). */
const REQUEUE_WINDOW_MS = 15 * 60 * 1000;

const GRADE: Record<Outcome, Grade> = {
  good: Rating.Good,
  self: Rating.Hard,
  bad: Rating.Again,
};

export function ReviewApp() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [done, setDone] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [stats, setStats] = useState({ good: 0, bad: 0 });

  const overview = useLiveQuery(async () => {
    const now = new Date();
    return {
      due: await db.cards.where("fsrs.dueAt").belowOrEqual(now).count(),
      pending: await pendingNewLetters(),
      perDay: await getSetting(NEW_PER_DAY_KEY, DEFAULT_NEW_PER_DAY),
      total: await db.cards.count(),
    };
  }, []);

  async function start() {
    const newIds = await introduceNewLetters();
    const due = await dueCards();
    const fresh = new Set(newIds);
    // Les cartes des nouvelles lettres viennent après leur présentation ; le reste est mélangé.
    const old = shuffle(due.filter((c) => !fresh.has(c.letterId)));
    const intro: Step[] = newIds.map((id) => ({ type: "intro", letter: LETTERS_BY_ID[id] }));
    const newCards = shuffle(due.filter((c) => fresh.has(c.letterId)));
    const toStep = (card: StoredCard): Step => ({ type: "card", card, question: makeQuestion(LETTERS_BY_ID[card.letterId], card.kind) });
    setSteps([...old.slice(0, 5).map(toStep), ...intro, ...shuffle([...old.slice(5), ...newCards]).map(toStep)]);
    setDone(0);
    setAnswered(false);
    setStats({ good: 0, bad: 0 });
  }

  async function onAnswer(outcome: Outcome) {
    const step = steps![0];
    if (step.type !== "card") return;
    setAnswered(true);
    setStats((s) => (outcome === "bad" ? { ...s, bad: s.bad + 1 } : { ...s, good: s.good + 1 }));
    const updated = await reviewCard(step.card, GRADE[outcome]);
    if (+updated.fsrs.dueAt - Date.now() < REQUEUE_WINDOW_MS) {
      // Repasse plus loin dans la séance.
      setSteps((s) => {
        if (!s) return s;
        const rest = [...s];
        const pos = Math.min(rest.length, 4 + Math.floor(Math.random() * 3));
        rest.splice(pos, 0, { type: "card", card: updated, question: makeQuestion(LETTERS_BY_ID[updated.letterId], updated.kind) });
        return rest;
      });
    }
  }

  function next() {
    setSteps((s) => s!.slice(1));
    setDone((d) => d + 1);
    setAnswered(false);
  }

  // --- Séance en cours ---
  if (steps && steps.length > 0) {
    const step = steps[0];
    return (
      <div className="mx-auto max-w-md pb-20 md:pb-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSteps(null)} className="text-xl text-muted" aria-label="Quitter">✕</button>
          <ProgressBar value={done} max={done + steps.length} />
          <span className="text-sm tabular-nums text-muted">{steps.length}</span>
        </div>
        <div className="mt-6">
          {step.type === "intro" ? (
            <LetterIntro letter={step.letter} />
          ) : (
            <Exercise key={`${done}-${step.card.id}`} question={step.question} onAnswer={onAnswer} />
          )}
        </div>
        {(step.type === "intro" || answered) && (
          <div className="fixed inset-x-0 bottom-16 z-10 px-4 md:static md:mt-6 md:px-0">
            <PrimaryButton onClick={next} className="w-full">
              {step.type === "intro" ? "J'ai compris" : "Continuer"}
            </PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  // --- Fin de séance ---
  if (steps) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl">✅</div>
        <h1 className="mt-3 text-2xl font-bold">Séance terminée</h1>
        <p className="mt-1 text-muted">
          {stats.good} réussite{stats.good > 1 ? "s" : ""} · {stats.bad} erreur{stats.bad > 1 ? "s" : ""}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/" className="rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Retour à l&apos;accueil</Link>
          <button type="button" onClick={() => setSteps(null)} className="py-2 text-sm text-muted">Voir les révisions</button>
        </div>
      </div>
    );
  }

  // --- Vue d'ensemble ---
  const nothing = overview && overview.due === 0 && overview.pending.length === 0;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Révisions</h1>
      <p className="mt-1 text-sm text-muted">Répétition espacée : chaque lettre revient juste avant que vous ne l&apos;oubliiez.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-3xl font-bold tabular-nums">{overview?.due ?? "–"}</div>
          <div className="text-sm text-muted">carte{overview?.due === 1 ? "" : "s"} à revoir</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="hy text-3xl font-bold">
            {overview?.pending.length ? overview.pending.map((id) => LETTERS_BY_ID[id].upper).join(" ") : "0"}
          </div>
          <div className="text-sm text-muted">nouvelle{(overview?.pending.length ?? 0) > 1 ? "s" : ""} lettre{(overview?.pending.length ?? 0) > 1 ? "s" : ""}</div>
        </div>
      </div>

      {nothing ? (
        <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          Tout est à jour pour aujourd&apos;hui. Revenez demain, ou entraînez-vous avec un <Link href="/quiz" className="underline">quiz</Link>.
        </p>
      ) : (
        <PrimaryButton onClick={start} disabled={!overview} className="mt-6 w-full">
          Commencer la séance
        </PrimaryButton>
      )}

      <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>
            <span className="block font-medium">Nouvelles lettres par jour</span>
            <span className="text-muted">Chaque lettre ajoute 3 à 4 exercices.</span>
          </span>
          <select
            value={overview?.perDay ?? DEFAULT_NEW_PER_DAY}
            onChange={(e) => setSetting(NEW_PER_DAY_KEY, Number(e.target.value))}
            className="rounded-lg border border-line bg-background px-2 py-1"
          >
            {[1, 2, 3, 4, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

function LetterIntro({ letter }: { letter: Letter }) {
  return (
    <div className="animate-pop text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-apricot-500">Nouvelle lettre</div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className="hy text-6xl leading-none">{letter.upper}<span className="ml-1 text-muted">{letter.lower}</span></span>
        <span className="flex items-center">
          {letter.id !== "yev" && <HandGlyph glyph={letter.upper} className="h-20 w-20" strokeWidth={4} />}
          <HandGlyph glyph={letter.lower} className="h-20 w-20 text-muted" strokeWidth={4} />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <AudioButton letter={letter} autoPlay />
        <div className="text-left">
          <div className="text-2xl font-bold text-brand-600">{letter.translit} <span className="font-mono text-sm font-normal text-muted">[{letter.ipa}]</span></div>
          <div className="text-sm text-muted">nom : <span className="hy">{letter.name}</span> ({letter.nameLatin})</div>
        </div>
      </div>
      <p className="mt-3 text-sm">{letter.hint}</p>
      <p className="mt-1 text-sm text-muted">
        ex. <span className="hy text-base text-foreground">{letter.example.word}</span> {letter.example.translit} — {letter.example.fr}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <StrokeAnimation glyph={letter.lower} className="aspect-square w-36 rounded-2xl border border-line bg-surface" />
        {letter.id !== "yev" && <StrokeAnimation glyph={letter.upper} className="aspect-square w-36 rounded-2xl border border-line bg-surface" />}
      </div>
    </div>
  );
}
