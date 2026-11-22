"use client";

import Link from "next/link";
import { LETTERS } from "@/data/letters";
import { HandGlyph } from "@/components/HandGlyph";
import { useSelectedLetters } from "@/lib/settings";

/** Grille des lettres ; la pastille de chaque case ajoute ou retire la lettre de l'entraînement. */
export function AlphabetGrid() {
  const { selected, toggle, setSelected } = useSelectedLetters();
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="flex-1">
          <strong>{selected.size}</strong> lettre{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""} pour les{" "}
          <Link href="/quiz" className="text-brand-600 underline">quiz</Link>
          <span className="block text-xs text-muted">Touchez la pastille ○ d&apos;une lettre pour l&apos;ajouter ou la retirer.</span>
        </span>
        <span className="flex gap-2">
          <button type="button" onClick={() => setSelected(LETTERS.map((l) => l.id))} className="rounded-full border border-line px-3 py-1 text-muted hover:text-foreground">
            Toutes
          </button>
          <button type="button" onClick={() => setSelected([])} disabled={selected.size === 0} className="rounded-full border border-line px-3 py-1 text-muted hover:text-foreground disabled:opacity-40">
            Aucune
          </button>
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {LETTERS.map((l, i) => {
          const on = selected.has(l.id);
          return (
            <li key={l.id} className="relative">
              <Link
                href={`/alphabet/${l.id}`}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-2xl border bg-surface transition hover:border-brand-200 hover:shadow-sm active:scale-[0.97] ${on ? "border-brand-500" : "border-line"}`}
              >
                <span className="absolute left-2 top-1.5 text-[10px] text-muted">{i + 1}</span>
                <span className="hy absolute right-2 top-1.5 text-[11px] text-muted">{l.upper}{l.lower}</span>
                <span className="flex h-14 items-center">
                  {l.id !== "yev" && <HandGlyph glyph={l.upper} className="h-14 w-14" strokeWidth={5} />}
                  <HandGlyph glyph={l.lower} className="h-14 w-14 text-muted" strokeWidth={5} />
                </span>
                <span className="mt-1 text-xs font-medium text-brand-600">{l.translit}</span>
              </Link>
              <SelectToggle on={on} onClick={() => toggle(l.id)} label={l.nameLatin} className="absolute bottom-1 right-1" />
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function SelectToggle({ on, onClick, label, className = "" }: { on: boolean; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={`${on ? "Retirer" : "Ajouter"} « ${label} » ${on ? "de" : "à"} l'entraînement`}
      title={on ? "Retirer de l'entraînement" : "Ajouter à l'entraînement"}
      className={`grid h-8 w-8 place-items-center rounded-full ${className}`}
    >
      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 text-[11px] font-bold transition ${on ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-transparent"}`}>
        ✓
      </span>
    </button>
  );
}
