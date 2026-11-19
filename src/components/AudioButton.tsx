"use client";

import { useEffect, useState } from "react";
import type { Letter } from "@/data/letters";
import { canPlay, playLetter } from "@/lib/audio";

type Props = { letter: Letter; what?: "name" | "word"; size?: "sm" | "lg"; autoPlay?: boolean };

/** Bouton haut-parleur ; masqué si aucun audio n'est disponible pour cette lettre. */
export function AudioButton({ letter, what = "name", size = "sm", autoPlay }: Props) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = () => canPlay(letter).then((v) => alive && setOk(v));
    check();
    // Les voix de synthèse se chargent de façon asynchrone.
    window.speechSynthesis?.addEventListener?.("voiceschanged", check);
    return () => {
      alive = false;
      window.speechSynthesis?.removeEventListener?.("voiceschanged", check);
    };
  }, [letter]);

  useEffect(() => {
    if (ok && autoPlay) playLetter(letter, what);
  }, [ok, autoPlay, letter, what]);

  if (!ok) return null;
  const dim = size === "lg" ? "h-14 w-14" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={() => playLetter(letter, what)}
      aria-label="Écouter"
      className={`${dim} grid shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600 active:scale-95`}
    >
      <svg viewBox="0 0 24 24" className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}
