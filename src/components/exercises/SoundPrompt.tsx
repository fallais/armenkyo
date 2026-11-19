"use client";

import type { Letter } from "@/data/letters";
import { AudioButton } from "../AudioButton";

/**
 * Consigne « son » : audio si disponible, sinon transcription.
 * Le nom latin de la lettre est toujours affiché : il distingue les homophones (ե/է, ո/օ).
 */
export function SoundPrompt({ letter, autoPlay }: { letter: Letter; autoPlay?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <AudioButton letter={letter} size="lg" autoPlay={autoPlay} />
      <div className="text-center">
        <div className="text-4xl font-bold text-brand-600">{letter.translit}</div>
        <div className="mt-1 text-sm text-muted">
          lettre « {letter.nameLatin} » · <span className="font-mono">[{letter.ipa}]</span>
        </div>
      </div>
    </div>
  );
}
