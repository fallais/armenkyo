"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db, getSetting, setSetting } from "./db";
import type { CaseMode, QuizMode } from "./quiz";

/** Réglage persistant (IndexedDB), partagé en direct entre les pages. `fallback` tant qu'il n'est pas chargé. */
export function useSetting<T>(key: string, fallback: T): [T, (v: T) => void] {
  const row = useLiveQuery(() => db.settings.get(key), [key]);
  const set = useCallback((v: T) => void setSetting(key, v), [key]);
  return [(row?.value as T | undefined) ?? fallback, set];
}

/** Affichage des lettres dans les quiz : police imprimée ou écriture manuscrite (cursif). */
export type GlyphStyle = "print" | "hand";
export const GLYPH_STYLE_KEY = "glyphStyle";

export function useGlyphStyle() {
  return useSetting<GlyphStyle>(GLYPH_STYLE_KEY, "print");
}

/** Lettres choisies dans l'Alphabet pour l'entraînement. */
export const SELECTED_LETTERS_KEY = "selectedLetters";
const EMPTY: string[] = [];

export function useSelectedLetters() {
  const [ids, setIds] = useSetting<string[]>(SELECTED_LETTERS_KEY, EMPTY);
  const toggle = useCallback(
    (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    [ids, setIds],
  );
  return { selected: new Set(ids), toggle, setSelected: setIds };
}

/** Derniers réglages du quiz, retrouvés d'une visite à l'autre. */
export type QuizConfig = {
  mode: QuizMode;
  caseMode: CaseMode;
  letters: "all" | "selected";
  /** Répétition espacée (FSRS) ou tirage complètement aléatoire. */
  order: "srs" | "random";
  count: number;
};
export const QUIZ_CONFIG_KEY = "quizConfig";
export const DEFAULT_QUIZ_CONFIG: QuizConfig = { mode: "read", caseMode: "both", letters: "all", order: "srs", count: 10 };

export function useQuizConfig(): [QuizConfig, (patch: Partial<QuizConfig>) => void] {
  const [stored, setStored] = useSetting<Partial<QuizConfig>>(QUIZ_CONFIG_KEY, DEFAULT_QUIZ_CONFIG);
  const config = { ...DEFAULT_QUIZ_CONFIG, ...stored };
  return [config, (patch) => setStored({ ...config, ...patch })];
}

/** Pré-règle le quiz (ex. depuis l'accueil) avant d'y naviguer. */
export async function presetQuiz(patch: Partial<QuizConfig>) {
  const current = await getSetting<Partial<QuizConfig>>(QUIZ_CONFIG_KEY, {});
  await setSetting(QUIZ_CONFIG_KEY, { ...DEFAULT_QUIZ_CONFIG, ...current, ...patch });
}
