import Dexie, { type EntityTable } from "dexie";
import type { SchedulerCard } from "./srs";

/** Types d'exercices pour une lettre. */
export type CardKind = "read" | "listen" | "write-lower" | "write-upper";

export const KIND_LABELS: Record<CardKind, string> = {
  read: "Lettre → son",
  listen: "Son → lettre",
  "write-lower": "Son → tracé (minuscule)",
  "write-upper": "Son → tracé (majuscule)",
};

/** Carte de révision : une lettre × un type d'exercice. `fsrs` = état du planificateur. */
export type StoredCard = {
  id: string; // `${letterId}:${kind}`
  letterId: string;
  kind: CardKind;
  fsrs: FsrsState;
  createdAt: Date;
};

/** État FSRS tel que produit par ts-fsrs (dates natives, stockables dans IndexedDB). */
export type FsrsState = SchedulerCard;

/** Journal de toutes les réponses (révisions et quiz) : sert aux statistiques. */
export type Answer = {
  id?: number;
  at: Date;
  day: string; // AAAA-MM-JJ (heure locale)
  letterId: string;
  kind: CardKind;
  correct: boolean;
  source: "srs" | "quiz";
};

export type Setting = { key: string; value: unknown };

export const db = new Dexie("armenkyo") as Dexie & {
  cards: EntityTable<StoredCard, "id">;
  answers: EntityTable<Answer, "id">;
  settings: EntityTable<Setting, "key">;
};

db.version(1).stores({
  cards: "id, letterId, kind, fsrs.dueAt",
  answers: "++id, day, letterId, [letterId+kind]",
  settings: "key",
});

export function localDay(d = new Date()): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function logAnswer(a: Omit<Answer, "id" | "at" | "day">) {
  const now = new Date();
  await db.answers.add({ ...a, at: now, day: localDay(now) });
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await db.settings.get(key);
  return (s?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
