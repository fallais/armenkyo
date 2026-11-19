import type { Metadata } from "next";
import Link from "next/link";
import { LETTERS } from "@/data/letters";
import { HandGlyph } from "@/components/HandGlyph";

export const metadata: Metadata = { title: "Alphabet" };

export default function AlphabetPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Alphabet</h1>
      <p className="mt-1 text-sm text-muted">39 lettres de l&apos;arménien oriental. Touchez une lettre pour l&apos;écouter et apprendre à l&apos;écrire.</p>
      <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {LETTERS.map((l, i) => (
          <li key={l.id}>
            <Link
              href={`/alphabet/${l.id}`}
              className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border border-line bg-surface transition hover:border-brand-200 hover:shadow-sm active:scale-[0.97]"
            >
              <span className="absolute left-2 top-1.5 text-[10px] text-muted">{i + 1}</span>
              <span className="hy absolute right-2 top-1.5 text-[11px] text-muted">{l.upper}{l.lower}</span>
              <span className="flex h-14 items-center">
                {l.id !== "yev" && <HandGlyph glyph={l.upper} className="h-14 w-14" strokeWidth={5} />}
                <HandGlyph glyph={l.lower} className="h-14 w-14 text-muted" strokeWidth={5} />
              </span>
              <span className="mt-1 text-xs font-medium text-brand-600">{l.translit}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">
        Audio : Wikimedia Commons / Lingua Libre, CC BY-SA — <Link href="/credits" className="underline">crédits</Link>
      </p>
    </div>
  );
}
