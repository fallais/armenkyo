"use client";

import type { Letter } from "@/data/letters";
import { AudioButton } from "./AudioButton";
import { HandGlyph } from "./HandGlyph";
import { StrokeAnimation } from "./StrokeAnimation";

/** Présentation d'une lettre jamais vue, avant sa première question en répétition espacée. */
export function LetterIntro({ letter }: { letter: Letter }) {
  return (
    <div className="animate-pop text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-apricot-500">Nouvelle lettre</div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className="hy text-6xl leading-none">{letter.upper}<span className="ml-1 text-muted">{letter.lower}</span></span>
        <span className="flex items-center">
          {letter.id !== "yev" && <HandGlyph glyph={letter.upper} className="h-20 w-20" strokeWidth={4} />}
          <HandGlyph glyph={letter.lower} className="h-20 w-20 text-muted" strokeWidth={4} />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <AudioButton letter={letter} autoPlay />
        <div className="text-left">
          <div className="text-2xl font-bold text-brand-600">{letter.translit} <span className="font-mono text-sm font-normal text-muted">[{letter.ipa}]</span></div>
          <div className="text-sm text-muted">nom : <span className="hy">{letter.name}</span> ({letter.nameLatin})</div>
        </div>
      </div>
      <p className="mt-3 text-sm">{letter.hint}</p>
      <p className="mt-1 text-sm text-muted">
        ex. <span className="hy text-base text-foreground">{letter.example.word}</span> {letter.example.translit} — {letter.example.fr}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <StrokeAnimation glyph={letter.lower} className="aspect-square w-36 rounded-2xl border border-line bg-surface" />
        {letter.id !== "yev" && <StrokeAnimation glyph={letter.upper} className="aspect-square w-36 rounded-2xl border border-line bg-surface" />}
      </div>
    </div>
  );
}
