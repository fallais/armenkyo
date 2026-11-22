import type { Metadata } from "next";
import Link from "next/link";
import { AlphabetGrid } from "./AlphabetGrid";

export const metadata: Metadata = { title: "Alphabet" };

export default function AlphabetPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Alphabet</h1>
      <p className="mt-1 text-sm text-muted">39 lettres de l&apos;arménien oriental. Touchez une lettre pour l&apos;écouter et apprendre à l&apos;écrire.</p>
      <AlphabetGrid />
      <p className="mt-6 text-center text-xs text-muted">
        Tracés : ArmenianAlphabet (MIT) · Audio : Wikimedia Commons (CC BY-SA) — <Link href="/aide#credits" className="underline">crédits</Link>
      </p>
    </div>
  );
}
