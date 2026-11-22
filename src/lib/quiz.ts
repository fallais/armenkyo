import { LETTERS, LETTERS_BY_ID, SHAPE_GROUPS, SOUND_GROUPS, type Letter } from "@/data/letters";
import type { CardKind } from "./db";
import { canWrite, type Case } from "./strokes";

export type QuizMode = "read" | "listen" | "write";
export type CaseMode = Case | "both";

export type Question = {
  letter: Letter;
  mode: QuizMode;
  /** Casse affichée (lecture / écoute). */
  letterCase: Case;
  /** Casses à tracer (écriture) : une ou deux zones de dessin. */
  cases: Case[];
  /** Propositions pour les QCM (contient la bonne réponse). */
  choices?: Letter[];
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 distracteurs : d'abord des lettres proches (son ou forme), puis au hasard. */
export function distractors(letter: Letter, mode: QuizMode, pool: Letter[] = LETTERS, n = 3): Letter[] {
  const groups = mode === "read" ? [...SHAPE_GROUPS, ...SOUND_GROUPS] : [...SOUND_GROUPS, ...SHAPE_GROUPS];
  const near = shuffle(groups.filter((g) => g.includes(letter.id)).flat())
    .filter((id) => id !== letter.id)
    .map((id) => LETTERS_BY_ID[id]);
  const picked: Letter[] = [];
  // Au plus 2 lettres « pièges » pour ne pas rendre le QCM injouable.
  for (const l of near) if (picked.length < 2 && !picked.includes(l)) picked.push(l);
  const others = shuffle((pool.length > n ? pool : LETTERS).filter((l) => l.id !== letter.id && !picked.includes(l)));
  return [...picked, ...others].slice(0, n);
}

/** Casses à tracer pour une lettre : « les deux » = majuscule et minuscule ; և n'a que la minuscule. */
export function writeCases(letter: Letter, caseMode: CaseMode): Case[] {
  if (caseMode === "both") return (["upper", "lower"] as Case[]).filter((c) => canWrite(letter, c));
  if (canWrite(letter, caseMode)) return [caseMode];
  return canWrite(letter, "lower") ? ["lower"] : [];
}

/** Cartes de répétition espacée concernées par une question. */
export function cardKinds(mode: QuizMode, cases: Case[]): CardKind[] {
  return mode === "write" ? cases.map((c) => `write-${c}` as CardKind) : [mode];
}

export function makeQuestion(letter: Letter, mode: QuizMode, caseMode: CaseMode = "both", pool?: Letter[]): Question {
  let letterCase: Case = caseMode === "both" ? (Math.random() < 0.5 ? "lower" : "upper") : caseMode;
  // և n'a pas de majuscule : on affiche toujours la minuscule.
  if (letter.id === "yev") letterCase = "lower";
  const cases = mode === "write" ? writeCases(letter, caseMode) : [letterCase];
  const choices = mode === "write" ? undefined : shuffle([letter, ...distractors(letter, mode, pool)]);
  return { letter, mode, letterCase, cases, choices };
}

/** Série aléatoire de questions pour le mode choisi. */
export function buildQuiz(mode: QuizMode, letters: Letter[], caseMode: CaseMode, count: number): Question[] {
  const usable = mode === "write" ? letters.filter((l) => writeCases(l, caseMode).length > 0) : letters;
  const items: Question[] = [];
  let bag: Letter[] = [];
  while (usable.length > 0 && items.length < count) {
    if (bag.length === 0) bag = shuffle(usable);
    items.push(makeQuestion(bag.pop()!, mode, caseMode, letters));
  }
  return items;
}
