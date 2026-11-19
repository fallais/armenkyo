"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { LETTERS, LETTERS_BY_ID } from "@/data/letters";
import { db, localDay, type StoredCard } from "@/lib/db";
import { letterMastery, pendingNewLetters } from "@/lib/srs";

const WEEKS = 17;

const MASTERY_STYLE = {
  new: "border-line bg-surface text-muted",
  learning: "border-apricot-400 bg-apricot-100 text-apricot-500 dark:bg-apricot-500/15",
  known: "border-brand-200 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200",
  mastered: "border-brand-500 bg-brand-500 text-white",
} as const;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function Dashboard() {
  const data = useLiveQuery(async () => {
    const now = new Date();
    const since = addDays(now, -WEEKS * 7);
    const [cards, answers, pending] = await Promise.all([
      db.cards.toArray(),
      db.answers.where("day").aboveOrEqual(localDay(since)).toArray(),
      pendingNewLetters(),
    ]);
    const perDay = new Map<string, number>();
    for (const a of answers) perDay.set(a.day, (perDay.get(a.day) ?? 0) + 1);
    const byLetter = new Map<string, StoredCard[]>();
    for (const c of cards) byLetter.set(c.letterId, [...(byLetter.get(c.letterId) ?? []), c]);
    const week = answers.filter((a) => a.at >= addDays(now, -7));
    return {
      today: now,
      due: cards.filter((c) => c.fsrs.dueAt <= now).length,
      pending,
      perDay,
      byLetter,
      accuracy: week.length ? Math.round((week.filter((a) => a.correct).length / week.length) * 100) : null,
      weekCount: week.length,
    };
  }, []);

  const streak = (() => {
    if (!data) return 0;
    let n = 0;
    let d = data.today;
    // La série n'est pas rompue si l'on n'a pas encore travaillé aujourd'hui.
    if (!data.perDay.has(localDay(d))) d = addDays(d, -1);
    while (data.perDay.has(localDay(d))) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  })();

  const mastery = LETTERS.map((l) => ({ letter: l, status: letterMastery(data?.byLetter.get(l.id) ?? []) }));
  const studied = mastery.filter((m) => m.status !== "new").length;
  const mastered = mastery.filter((m) => m.status === "mastered").length;
  const todo = (data?.due ?? 0) + (data?.pending.length ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">
        <span className="hy">Բարև</span> ! <span className="font-normal text-muted">Bonjour !</span>
      </h1>

      <Link
        href="/revisions"
        className="mt-5 flex items-center gap-4 rounded-3xl bg-brand-500 p-5 text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99]"
      >
        <div className="flex-1">
          <div className="text-sm/5 opacity-80">Aujourd&apos;hui</div>
          {!data ? (
            <div className="text-xl font-semibold">…</div>
          ) : todo === 0 ? (
            <div className="text-xl font-semibold">Tout est à jour 🎉</div>
          ) : (
            <div className="text-xl font-semibold">
              {data.due > 0 && `${data.due} révision${data.due > 1 ? "s" : ""}`}
              {data.due > 0 && data.pending.length > 0 && " · "}
              {data.pending.length > 0 && (
                <>
                  {data.pending.length} nouvelle{data.pending.length > 1 ? "s" : ""} lettre{data.pending.length > 1 ? "s" : ""}{" "}
                  <span className="hy">{data.pending.map((id) => LETTERS_BY_ID[id].upper).join(" ")}</span>
                </>
              )}
            </div>
          )}
        </div>
        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">{todo === 0 ? "Voir" : "Commencer"} →</span>
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat value={`${streak}`} label={`jour${streak > 1 ? "s" : ""} de suite`} icon="🔥" />
        <Stat value={`${studied}/${LETTERS.length}`} label="lettres étudiées" icon="📖" />
        <Stat value={data?.accuracy != null ? `${data.accuracy} %` : "–"} label="réussite (7 j)" icon="🎯" />
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-4">
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

      <section className="mt-4 rounded-3xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Activité</h2>
          <span className="text-xs text-muted">{data?.weekCount ?? 0} réponses cette semaine</span>
        </div>
        {data ? <Heatmap perDay={data.perDay} today={data.today} /> : <div className="mt-3 h-24" />}
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/quiz", t: "Lettre → son", d: "Բ → b" },
          { href: "/quiz", t: "Son → lettre", d: "b → Բ" },
          { href: "/quiz", t: "Son → tracé", d: "b → ✍️" },
        ].map((q) => (
          <Link key={q.t} href={q.href} className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 hover:border-brand-200">
            <span className="font-medium">{q.t}</span>
            <span className="hy text-brand-600">{q.d}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="text-xs">{icon}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
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

function Heatmap({ perDay, today }: { perDay: Map<string, number>; today: Date }) {
  // Colonnes = semaines (lundi en haut), la dernière colonne contient aujourd'hui.
  const offset = (today.getDay() + 6) % 7;
  const start = addDays(today, -offset - (WEEKS - 1) * 7);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = addDays(start, i);
    return { day: localDay(d), n: perDay.get(localDay(d)) ?? 0, future: d > today };
  });
  const level = (n: number) => (n === 0 ? "bg-line" : n < 10 ? "bg-brand-200" : n < 30 ? "bg-brand-500/70" : "bg-brand-600");
  return (
    <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
      {cells.map((c) => (
        <div key={c.day} title={`${c.day} : ${c.n}`} className={`aspect-square rounded-[3px] ${c.future ? "opacity-0" : level(c.n)}`} />
      ))}
    </div>
  );
}
