"use client";

import { useGlyphStyle } from "@/lib/settings";
import { getStrokes, viewBoxAttr, viewBoxFor } from "@/lib/strokes";
import { HandGlyph } from "./HandGlyph";

const SIZES = {
  xl: { print: "text-8xl leading-none", hand: "h-32 w-32", stroke: 4 },
  md: { print: "text-5xl leading-tight", hand: "h-16 w-16", stroke: 6 },
} as const;

/** Lettre affichée selon le réglage « imprimé / manuscrit » des quiz. */
export function LetterGlyph({ glyph, size }: { glyph: string; size: keyof typeof SIZES }) {
  const [style] = useGlyphStyle();
  const s = SIZES[size];
  // Cadrage des zones d'écriture : les minuscules sont agrandies comme dans les exercices de tracé.
  if (style === "hand" && getStrokes(glyph))
    return <HandGlyph glyph={glyph} viewBox={viewBoxAttr(viewBoxFor(glyph))} className={`${s.hand} inline-block`} strokeWidth={s.stroke} />;
  return <span className={`hy ${s.print}`}>{glyph}</span>;
}

/** Bascule imprimé / manuscrit (en haut à droite des quiz). */
export function GlyphStyleToggle() {
  const [style, setStyle] = useGlyphStyle();
  const options = [
    { value: "print", label: <span className="hy text-lg leading-none">Ա</span>, title: "Caractères imprimés" },
    { value: "hand", label: <HandGlyph glyph="Ա" viewBox="26 17 48 48" className="h-6 w-6" strokeWidth={5} />, title: "Écriture manuscrite" },
  ] as const;
  return (
    <div role="radiogroup" aria-label="Affichage des lettres" className="flex shrink-0 rounded-full border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={style === o.value}
          title={o.title}
          onClick={() => setStyle(o.value)}
          className={`grid h-8 min-w-10 place-items-center rounded-full px-2 transition ${style === o.value ? "bg-brand-500 text-white" : "text-muted hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
