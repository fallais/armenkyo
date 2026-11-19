import data from "@/data/strokes.json";
import type { Letter } from "@/data/letters";

export type Case = "upper" | "lower";

/**
 * Tracés manuscrits (centre du trait, repère 100×100), dans l'ordre et le sens d'écriture.
 * Source : projet ArmenianAlphabet de Gagik Papikyan (licence MIT), importé par
 * scripts/handwriting/import_armenian_alphabet.py. Toutes les lettres partagent la même ligne de base.
 */
const STROKES = data.glyphs as Record<string, string[]>;

/** Ligne de base et hauteur des minuscules, dans le repère 100×100. */
export const BASELINE = data.baseline;
export const XLINE = data.xline;

/**
 * Cadrage des zones d'écriture : les minuscules sont agrandies (même cadre pour toutes, pour garder
 * leurs proportions et la ligne de base commune), les majuscules occupent tout le carré.
 */
export type ViewBox = { x: number; y: number; w: number; h: number };
const FULL: ViewBox = { x: 0, y: 0, w: 100, h: 100 };
const LOWER: ViewBox = { x: 10.5, y: 19, w: 79, h: 79 };

export function viewBoxFor(glyph: string): ViewBox {
  return glyph !== glyph.toUpperCase() ? LOWER : FULL;
}

export function viewBoxAttr(v: ViewBox): string {
  return `${v.x} ${v.y} ${v.w} ${v.h}`;
}

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
