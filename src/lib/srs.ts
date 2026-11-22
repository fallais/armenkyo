import { DefaultScheduler, Rating, type Grade } from "ts-fsrs";
import type { Letter } from "@/data/letters";
import { db, logAnswer, type CardKind, type StoredCard } from "./db";
import { cardKinds, writeCases, type CaseMode, type QuizMode } from "./quiz";

export { Rating, type Grade };

type Scheduler = Awaited<ReturnType<typeof DefaultScheduler>>;
/** ts-fsrs type `newCard()` sans `stabilityFast`, pourtant présent à l'exécution : on prend le type attendu par `review()`. */
export type SchedulerCard = Parameters<Scheduler["review"]>[0]["card"];
let schedulerPromise: Promise<Scheduler> | null = null;

function scheduler() {
  schedulerPromise ??= DefaultScheduler({
    version: "FSRS-7",
    desiredRetention: 0.9,
    enableShortTerm: true,
    learningSteps: ["1m", "10m"],
    relearningSteps: ["10m"],
    enableFuzz: true,
  });
  return schedulerPromise;
}

/** Délai sous lequel une carte doit revenir dans la même séance (pas d'apprentissage 1 min / 10 min). */
export const REQUEUE_WINDOW_MS = 15 * 60 * 1000;

export type SrsPlan = {
  /** Lettres à revoir (au moins une carte échue), la plus en retard d'abord. */
  due: Letter[];
  /** Lettres sans carte pour cet exercice, dans l'ordre de l'alphabet. */
  fresh: Letter[];
  /** Lettres jamais vues (aucune carte, tous exercices confondus) : présentées avant leur première question. */
  unseen: Set<string>;
  /** Prochaine échéance si rien n'est à revoir. */
  nextDue?: Date;
};

/** Ce que la répétition espacée propose pour un exercice et un ensemble de lettres. */
export async function srsPlan(mode: QuizMode, letters: Letter[], caseMode: CaseMode, now = new Date()): Promise<SrsPlan> {
  const cards = await db.cards.where("letterId").anyOf(letters.map((l) => l.id)).toArray();
  const byId = new Map(cards.map((c) => [c.id, c]));
  const seen = new Set(cards.map((c) => c.letterId));
  const due: { letter: Letter; at: Date }[] = [];
  const fresh: Letter[] = [];
  let nextDue: Date | undefined;
  for (const letter of letters) {
    const kinds = cardKinds(mode, mode === "write" ? writeCases(letter, caseMode) : []);
    if (kinds.length === 0) continue;
    const mine = kinds.map((k) => byId.get(`${letter.id}:${k}`));
    if (mine.some((c) => !c)) {
      fresh.push(letter);
      continue;
    }
    const at = new Date(Math.min(...mine.map((c) => +c!.fsrs.dueAt)));
    if (at <= now) due.push({ letter, at });
    else if (!nextDue || at < nextDue) nextDue = at;
  }
  due.sort((a, b) => +a.at - +b.at);
  return { due: due.map((d) => d.letter), fresh, unseen: new Set(fresh.filter((l) => !seen.has(l.id)).map((l) => l.id)), nextDue };
}

/** Enregistre une réponse et replanifie la carte (créée si besoin). Renvoie la carte mise à jour. */
export async function reviewKind(letterId: string, kind: CardKind, grade: Grade, now = new Date()): Promise<StoredCard> {
  const id = `${letterId}:${kind}`;
  const s = await scheduler();
  const card: StoredCard = (await db.cards.get(id)) ?? { id, letterId, kind, fsrs: s.newCard({ now }) as SchedulerCard, createdAt: now };
  // Les types de ts-fsrs v6 (union de modèles) ne se recoupent pas : on force, la forme est validée à l'exécution.
  const { card: next } = s.review({ card: card.fsrs as never, grade, now });
  const updated: StoredCard = { ...card, fsrs: next as SchedulerCard };
  await db.cards.put(updated);
  await logAnswer({ letterId, kind, correct: grade !== Rating.Again, source: "srs" });
  return updated;
}

/** Une lettre est « maîtrisée » quand toutes ses cartes ont un intervalle ≥ 7 jours. */
export function letterMastery(cards: StoredCard[]): "new" | "learning" | "known" | "mastered" {
  if (cards.length === 0) return "new";
  const min = Math.min(...cards.map((c) => c.fsrs.scheduledDays));
  if (min >= 21) return "mastered";
  if (min >= 3) return "known";
  return "learning";
}
