import { DefaultScheduler, Rating, type Grade } from "ts-fsrs";
import { LETTERS, LETTERS_BY_ID } from "@/data/letters";
import { db, getSetting, logAnswer, type CardKind, type StoredCard } from "./db";
import { canWrite } from "./strokes";

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

export const NEW_PER_DAY_KEY = "newLettersPerDay";
export const DEFAULT_NEW_PER_DAY = 3;

/** Types de cartes créés pour une lettre (ordre de présentation). */
export function kindsFor(letterId: string): CardKind[] {
  const l = LETTERS_BY_ID[letterId];
  const kinds: CardKind[] = ["read", "listen"];
  if (canWrite(l, "lower")) kinds.push("write-lower");
  if (canWrite(l, "upper")) kinds.push("write-upper");
  return kinds;
}

/** Lettres déjà introduites dans les révisions. */
export async function introducedLetterIds(): Promise<Set<string>> {
  const ids = await db.cards.orderBy("letterId").uniqueKeys();
  return new Set(ids as string[]);
}

/** Nombre de nouvelles lettres introduites aujourd'hui. */
async function introducedToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const cards = await db.cards.where("kind").equals("read").filter((c) => c.createdAt >= start).count();
  return cards;
}

/** Prochaines lettres à introduire aujourd'hui (ordre alphabétique, dans la limite du quota quotidien). */
export async function pendingNewLetters(): Promise<string[]> {
  const perDay = await getSetting(NEW_PER_DAY_KEY, DEFAULT_NEW_PER_DAY);
  const remaining = perDay - (await introducedToday());
  if (remaining <= 0) return [];
  const known = await introducedLetterIds();
  return LETTERS.filter((l) => !known.has(l.id)).slice(0, remaining).map((l) => l.id);
}

/** Introduit les nouvelles lettres du jour : crée leurs cartes. */
export async function introduceNewLetters(): Promise<string[]> {
  const next = (await pendingNewLetters()).map((id) => LETTERS_BY_ID[id]);
  if (next.length === 0) return [];
  const s = await scheduler();
  const now = new Date();
  const cards: StoredCard[] = next.flatMap((l) =>
    kindsFor(l.id).map((kind) => ({
      id: `${l.id}:${kind}`,
      letterId: l.id,
      kind,
      fsrs: s.newCard({ now }) as SchedulerCard,
      createdAt: now,
    })),
  );
  await db.cards.bulkPut(cards);
  return next.map((l) => l.id);
}

export async function dueCards(now = new Date()): Promise<StoredCard[]> {
  const cards = await db.cards.where("fsrs.dueAt").belowOrEqual(now).toArray();
  return cards.sort((a, b) => +a.fsrs.dueAt - +b.fsrs.dueAt);
}

/** Enregistre une réponse et replanifie la carte. Renvoie la carte mise à jour. */
export async function reviewCard(card: StoredCard, grade: Grade, now = new Date()): Promise<StoredCard> {
  const s = await scheduler();
  // Les types de ts-fsrs v6 (union de modèles) ne se recoupent pas : on force, la forme est validée à l'exécution.
  const { card: next } = s.review({ card: card.fsrs as never, grade, now });
  const updated: StoredCard = { ...card, fsrs: next as SchedulerCard };
  await db.cards.put(updated);
  await logAnswer({ letterId: card.letterId, kind: card.kind, correct: grade !== Rating.Again, source: "srs" });
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
