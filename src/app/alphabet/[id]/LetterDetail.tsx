"use client";

import Link from "next/link";
import { useState } from "react";
import { LETTERS, type Letter } from "@/data/letters";
import { AudioButton } from "@/components/AudioButton";
import { HandGlyph } from "@/components/HandGlyph";
import { StrokeAnimation } from "@/components/StrokeAnimation";
import { WritingPractice } from "@/components/WritingPractice";
import { canWrite, glyphFor, type Case } from "@/lib/strokes";

export function LetterDetail({ letter }: { letter: Letter }) {
  const index = LETTERS.findIndex((l) => l.id === letter.id);
  const prev = LETTERS[index - 1];
  const next = LETTERS[index + 1];
  const cases: Case[] = (["lower", "upper"] as Case[]).filter((c) => canWrite(letter, c));
  const [letterCase, setLetterCase] = useState<Case>(cases[0]);

  return (
    <div>
      <nav className="flex items-center justify-between text-sm">
        <Link href="/alphabet" className="text-muted hover:text-foreground">← Alphabet</Link>
        <div className="flex gap-1">
          {prev && <Link href={`/alphabet/${prev.id}`} className="hy rounded-lg border border-line bg-surface px-3 py-1">‹ {prev.upper}</Link>}
          {next && <Link href={`/alphabet/${next.id}`} className="hy rounded-lg border border-line bg-surface px-3 py-1">{next.upper} ›</Link>}
        </div>
      </nav>

      <section className="mt-4 rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center">
              {letter.id !== "yev" && <HandGlyph glyph={letter.upper} className="h-24 w-24 md:h-28 md:w-28" strokeWidth={4} />}
              <HandGlyph glyph={letter.lower} className="h-20 w-20 text-muted md:h-24 md:w-24" strokeWidth={4.5} />
            </div>
            <div className="mt-1 text-xs text-muted">
              Imprimé : <span className="hy text-lg text-foreground">{letter.upper} {letter.lower}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted">Lettre {index + 1} / {LETTERS.length}</div>
            <div className="mt-1 text-2xl font-bold text-brand-600">{letter.translit}</div>
            <div className="font-mono text-sm text-muted">[{letter.ipa}]</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <AudioButton letter={letter} />
          <div>
            <div className="text-sm">
              Nom : <span className="hy font-semibold">{letter.name}</span> <span className="text-muted">({letter.nameLatin})</span>
            </div>
            <div className="text-sm text-muted">{letter.hint}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-apricot-100/60 p-3 dark:bg-apricot-500/10">
          <AudioButton letter={letter} what="word" />
          <div>
            <span className="hy text-xl font-medium">{letter.example.word}</span>
            <span className="ml-2 text-sm text-muted">{letter.example.translit}</span>
            <span className="ml-2 text-sm">— {letter.example.fr}</span>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Écriture</h2>
          {cases.length > 1 && (
            <div className="flex rounded-full border border-line bg-surface p-0.5 text-sm">
              {cases.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setLetterCase(c)}
                  className={`rounded-full px-3 py-1 ${letterCase === c ? "bg-brand-500 text-white" : "text-muted"}`}
                >
                  {c === "lower" ? "Minuscule" : "Majuscule"}
                </button>
              ))}
            </div>
          )}
        </div>
        {letter.id === "yev" && (
          <p className="mt-2 text-sm text-muted">և n&apos;a pas de majuscule propre : en début de phrase, on écrit « Եվ ».</p>
        )}
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Ordre des traits</h3>
            <StrokeAnimation key={letterCase} glyph={glyphFor(letter, letterCase)} className="mx-auto aspect-square max-w-[320px] rounded-2xl border border-line bg-surface" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">À vous</h3>
            <WritingPractice key={letterCase} letter={letter} letterCase={letterCase} />
          </div>
        </div>
      </section>
    </div>
  );
}
