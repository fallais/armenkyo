"use client";

import type { Letter } from "@/data/letters";

/**
 * Lecture audio d'une lettre :
 * 1. fichier enregistré `/audio/<id>.mp3` s'il existe ;
 * 2. sinon synthèse vocale du navigateur si une voix arménienne est installée ;
 * 3. sinon rien (l'interface affiche la transcription).
 */
const available = new Map<string, boolean>();
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function hasFile(url: string): Promise<boolean> {
  if (!available.has(url)) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      available.set(url, res.ok);
    } catch {
      available.set(url, false);
    }
  }
  return available.get(url)!;
}

function armenianVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("hy"));
}

export function hasArmenianVoice(): boolean {
  return armenianVoice() !== undefined;
}

export async function canPlay(letter: Letter): Promise<boolean> {
  return (await hasFile(`${BASE}/audio/${letter.id}.mp3`)) || hasArmenianVoice();
}

export async function playLetter(letter: Letter, what: "name" | "word" = "name"): Promise<boolean> {
  const url = what === "name" ? `${BASE}/audio/${letter.id}.mp3` : `${BASE}/audio/word-${letter.id}.mp3`;
  if (await hasFile(url)) {
    await new Audio(url).play().catch(() => {});
    return true;
  }
  const voice = armenianVoice();
  if (voice) {
    const u = new SpeechSynthesisUtterance(what === "name" ? letter.name : letter.example.word);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  }
  return false;
}
