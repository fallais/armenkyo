import { LETTERS, LETTERS_BY_ID, SHAPE_GROUPS, SOUND_GROUPS, type Letter } from "@/data/letters";
import type { CardKind } from "./db";
import { canWrite, type Case } from "./strokes";

export type Question = {
  letter: Letter;
  kind: CardKind;
  /** Casse affichée (lecture / écoute) ou à tracer (écriture). */
  letterCase: Case;
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
export function distractors(letter: Letter, kind: CardKind, pool: Letter[] = LETTERS, n = 3): Letter[] {
  const groups = kind === "read" ? [...SHAPE_GROUPS, ...SOUND_GROUPS] : [...SOUND_GROUPS, ...SHAPE_GROUPS];
  const near = shuffle(groups.filter((g) => g.includes(letter.id)).flat())
    .filter((id) => id !== letter.id)
    .map((id) => LETTERS_BY_ID[id]);
  const picked: Letter[] = [];
  // Au plus 2 lettres « pièges » pour ne pas rendre le QCM injouable.
  for (const l of near) if (picked.length < 2 && !picked.includes(l)) picked.push(l);
  const others = shuffle((pool.length > n ? pool : LETTERS).filter((l) => l.id !== letter.id && !picked.includes(l)));
  return [...picked, ...others].slice(0, n);
}

export function makeQuestion(letter: Letter, kind: CardKind, caseMode: Case | "both" = "both", pool?: Letter[]): Question {
  let letterCase: Case;
  if (kind === "write-lower") letterCase = "lower";
  else if (kind === "write-upper") letterCase = "upper";
  else letterCase = caseMode === "both" ? (Math.random() < 0.5 ? "lower" : "upper") : caseMode;
  // և n'a pas de majuscule : on affiche toujours la minuscule.
  if (letter.id === "yev" && kind !== "write-upper") letterCase = "lower";
  const choices = kind === "read" || kind === "listen" ? shuffle([letter, ...distractors(letter, kind, pool)]) : undefined;
  return { letter, kind, letterCase, choices };
}

export type QuizMode = "read" | "listen" | "write";

/** Génère une série de questions pour le mode choisi. */
export function buildQuiz(mode: QuizMode, letters: Letter[], caseMode: Case | "both", count: number): Question[] {
  const items: Question[] = [];
  let bag: Letter[] = [];
  let guard = 0;
  while (items.length < count && guard++ < count * 10) {
    if (bag.length === 0) bag = shuffle(letters);
    const letter = bag.pop()!;
    let kind: CardKind;
    if (mode !== "write") kind = mode;
    else {
      const c: Case = caseMode === "both" ? (Math.random() < 0.5 ? "lower" : "upper") : caseMode;
      const ok = canWrite(letter, c) ? c : canWrite(letter, "lower") ? "lower" : null;
      if (!ok) continue;
      kind = ok === "lower" ? "write-lower" : "write-upper";
    }
    items.push(makeQuestion(letter, kind, caseMode, letters));
  }
  return items;
}
