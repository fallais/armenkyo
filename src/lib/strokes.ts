import data from "@/data/strokes.json";
import type { Letter } from "@/data/letters";

export type Case = "upper" | "lower";

const STROKES = data as Record<string, string[]>;

/** Tracés de référence (centre du trait, repère 100×100, ligne de base y=70). */
export function getStrokes(glyph: string): string[] | undefined {
  return STROKES[glyph];
}

export function glyphFor(letter: Letter, c: Case): string {
  return c === "upper" ? letter.upper : letter.lower;
}

/** և n'a pas de majuscule propre (on écrit « Եվ ») : pas d'exercice d'écriture en majuscule. */
export function canWrite(letter: Letter, c: Case): boolean {
  return getStrokes(glyphFor(letter, c)) !== undefined;
}
