import type { Metadata } from "next";
import Link from "next/link";
import credits from "@/data/audio-credits.json";
import { LETTERS } from "@/data/letters";

export const metadata: Metadata = { title: "Aide" };

type Credit = { title: string; page: string; author: string; license: string; licenseUrl: string };
const audio = credits as { letters: Credit | null; words: Record<string, Credit & { word: string }> };

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const COMMIT = process.env.NEXT_PUBLIC_COMMIT;
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;
const REPO = "https://github.com/fallais/armenkyo";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-6 scroll-mt-20 rounded-2xl border border-line bg-surface p-4 text-sm">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Source({ c }: { c: Credit }) {
  return (
    <>
      <a href={c.page} className="underline decoration-line underline-offset-2 hover:text-brand-600">{c.author || "auteur inconnu"}</a>
      {" · "}
      <a href={c.licenseUrl} className="text-muted hover:text-foreground">{c.license}</a>
    </>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Aide</h1>

      <Section title="Comment ça marche">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><Link href="/alphabet" className="underline">Alphabet</Link> : chaque lettre avec sa prononciation, un mot d&apos;exemple et l&apos;animation de son tracé manuscrit. La pastille de chaque lettre l&apos;ajoute ou la retire de votre sélection d&apos;entraînement.</li>
          <li><Link href="/quiz" className="underline">Quiz</Link> : lettre → son, son → lettre, son → tracé, sur toutes les lettres ou sur votre sélection.</li>
          <li>En <strong>répétition espacée</strong>, le quiz propose d&apos;abord les lettres à revoir, puis les nouvelles : chacune revient juste avant que vous ne l&apos;oubliiez. En <strong>aléatoire</strong>, les lettres sont tirées au hasard, sans effet sur la répétition espacée.</li>
          <li>Le bouton en haut à droite des quiz affiche les lettres en caractères imprimés ou en écriture manuscrite.</li>
          <li>Pour écrire, suivez l&apos;ordre et le sens des traits numérotés ; posez la lettre sur la ligne d&apos;écriture (trait plein). Les pointillés indiquent la hauteur des minuscules.</li>
          <li>Votre progression reste dans ce navigateur : aucun compte, rien n&apos;est envoyé. Effacer les données du site la réinitialise.</li>
        </ul>
      </Section>

      <Section title="Version">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">Version</dt>
          <dd>{VERSION}</dd>
          <dt className="text-muted">Révision</dt>
          <dd>
            <a href={`${REPO}/commit/${COMMIT}`} className="font-mono underline decoration-line underline-offset-2">{COMMIT}</a>
          </dd>
          <dt className="text-muted">Construite le</dt>
          <dd>{BUILD_DATE}</dd>
          <dt className="text-muted">Code source</dt>
          <dd><a href={REPO} className="underline decoration-line underline-offset-2">{REPO.replace("https://", "")}</a></dd>
        </dl>
      </Section>

      <Section id="credits" title="Crédits">
        <h3 className="font-medium">Tracés manuscrits</h3>
        <p className="mt-1 text-muted">
          Formes cursives, ordre et sens des traits : projet{" "}
          <a href="https://github.com/gagiopapinni/ArmenianAlphabet" className="underline">ArmenianAlphabet</a>{" "}
          (<a href="https://armenian-alphabet.com" className="underline">armenian-alphabet.com</a>), © 2020 Gagik Papikyan, licence MIT.
          Les tracés ont été mis à l&apos;échelle et recadrés.
        </p>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">Texte de la licence MIT</summary>
          <p className="mt-2 whitespace-pre-line">{`Copyright (c) 2020 Gagik Papikyan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`}</p>
        </details>

        <h3 className="mt-4 font-medium">Enregistrements audio</h3>
        <p className="mt-1 text-muted">
          Depuis <a href="https://commons.wikimedia.org/" className="underline">Wikimedia Commons</a>, dont beaucoup via{" "}
          <a href="https://lingualibre.org/" className="underline">Lingua Libre</a>. Découpés, débruités et normalisés, puis convertis
          en MP3 ; ces versions modifiées sont distribuées sous la même licence que les originaux.
        </p>
        {audio.letters && (
          <p className="mt-2">
            Prononciation des lettres, extraite de{" "}
            <a href={audio.letters.page} className="underline">{audio.letters.title.replace(/^File:/, "")}</a> : <Source c={audio.letters} />
          </p>
        )}
        {Object.keys(audio.words).length > 0 && (
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {LETTERS.filter((l) => audio.words[l.id]).map((l) => {
              const c = audio.words[l.id];
              return (
                <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 px-3 py-1.5">
                  <span className="hy w-24 text-base">{c.word}</span>
                  <span className="text-muted"><Source c={c} /></span>
                </li>
              );
            })}
          </ul>
        )}

        <h3 className="mt-4 font-medium">Polices et bibliothèques</h3>
        <p className="mt-1 text-muted">
          Noto Sans Armenian et Inter (SIL Open Font License 1.1) ; Next.js et React (MIT), Dexie (Apache 2.0),
          ts-fsrs (MIT), Tailwind CSS (MIT).
        </p>
      </Section>
    </div>
  );
}
