import type { Metadata } from "next";
import credits from "@/data/audio-credits.json";
import { LETTERS } from "@/data/letters";

export const metadata: Metadata = { title: "Crédits" };

type Credit = { title: string; page: string; author: string; license: string; licenseUrl: string };
const data = credits as { letters: Credit | null; words: Record<string, Credit & { word: string }> };

function Source({ c }: { c: Credit }) {
  return (
    <>
      <a href={c.page} className="underline decoration-line underline-offset-2 hover:text-brand-600">{c.author || "auteur inconnu"}</a>
      {" · "}
      <a href={c.licenseUrl} className="text-muted hover:text-foreground">{c.license}</a>
    </>
  );
}

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Crédits</h1>

      <section className="mt-5 space-y-2 text-sm">
        <h2 className="text-lg font-semibold">Enregistrements audio</h2>
        <p className="text-muted">
          Les enregistrements proviennent de{" "}
          <a href="https://commons.wikimedia.org/" className="underline">Wikimedia Commons</a>, dont beaucoup via{" "}
          <a href="https://lingualibre.org/" className="underline">Lingua Libre</a>. Ils ont été découpés, débruités et
          normalisés, puis convertis en MP3. Ces versions modifiées sont distribuées sous la même licence que les originaux.
        </p>
        {data.letters && (
          <p>
            <strong>Prononciation des lettres</strong>, extraite de{" "}
            <a href={data.letters.page} className="underline">{data.letters.title.replace(/^File:/, "")}</a> :{" "}
            <Source c={data.letters} />
          </p>
        )}
      </section>

      {Object.keys(data.words).length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Mots d&apos;exemple</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
            {LETTERS.filter((l) => data.words[l.id]).map((l) => {
              const c = data.words[l.id];
              return (
                <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2">
                  <span className="hy w-24 text-base">{c.word}</span>
                  <span className="text-muted"><Source c={c} /></span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-6 text-sm">
        <h2 className="text-lg font-semibold">Police</h2>
        <p className="mt-1 text-muted">
          Noto Sans Armenian (Google), licence SIL Open Font License 1.1. Les tracés des lettres ont été dessinés d&apos;après cette police.
        </p>
      </section>
    </div>
  );
}
