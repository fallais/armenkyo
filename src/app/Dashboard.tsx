"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { LETTERS } from "@/data/letters";
import { db, type StoredCard } from "@/lib/db";
import type { QuizMode } from "@/lib/quiz";
import { presetQuiz } from "@/lib/settings";
import { letterMastery } from "@/lib/srs";

const MASTERY_STYLE = {
  new: "border-line bg-surface text-muted",
  learning: "border-apricot-400 bg-apricot-100 text-apricot-500 dark:bg-apricot-500/15",
  known: "border-brand-200 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200",
  mastered: "border-brand-500 bg-brand-500 text-white",
} as const;

export function Dashboard() {
  const data = useLiveQuery(async () => {
    const now = new Date();
    const cards = await db.cards.toArray();
    const byLetter = new Map<string, StoredCard[]>();
    for (const c of cards) byLetter.set(c.letterId, [...(byLetter.get(c.letterId) ?? []), c]);
    const due: Record<QuizMode, number> = { read: 0, listen: 0, write: 0 };
    for (const c of cards) if (c.fsrs.dueAt <= now) due[c.kind.startsWith("write") ? "write" : (c.kind as QuizMode)]++;
    return { due, byLetter };
  }, []);

  const mastery = LETTERS.map((l) => ({ letter: l, status: letterMastery(data?.byLetter.get(l.id) ?? []) }));
  const mastered = mastery.filter((m) => m.status === "mastered").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">
        <span className="hy">Բարև</span> ! <span className="font-normal text-muted">Bonjour !</span>
      </h1>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {(
          [
            { mode: "read", t: "Lettre → son", d: "Բ → b" },
            { mode: "listen", t: "Son → lettre", d: "b → Բ" },
            { mode: "write", t: "Son → tracé", d: "b → ✍️" },
          ] as const
        ).map((q) => (
          <Link
            key={q.mode}
            href="/quiz"
            onClick={() => presetQuiz({ mode: q.mode })}
            className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 hover:border-brand-200"
          >
            <span>
              <span className="block font-medium">{q.t}</span>
              {!!data?.due[q.mode] && <span className="block text-xs text-muted">{data.due[q.mode]} à revoir</span>}
            </span>
            <span className="hy text-brand-600">{q.d}</span>
          </Link>
        ))}
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Progression</h2>
          <span className="text-xs text-muted">{mastered} maîtrisée{mastered > 1 ? "s" : ""}</span>
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-13">
          {mastery.map(({ letter, status }) => (
            <Link
              key={letter.id}
              href={`/alphabet/${letter.id}`}
              title={`${letter.nameLatin} — ${status}`}
              className={`hy grid aspect-square place-items-center rounded-lg border text-lg ${MASTERY_STYLE[status]}`}
            >
              {letter.upper.length > 1 ? letter.lower : letter.upper}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          <Legend className={MASTERY_STYLE.new} label="À découvrir" />
          <Legend className={MASTERY_STYLE.learning} label="En cours" />
          <Legend className={MASTERY_STYLE.known} label="Connue" />
          <Legend className={MASTERY_STYLE.mastered} label="Maîtrisée" />
        </div>
      </section>

    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${className}`} />
      {label}
    </span>
  );
}
