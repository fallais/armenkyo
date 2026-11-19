import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LETTERS, LETTERS_BY_ID } from "@/data/letters";
import { LetterDetail } from "./LetterDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return LETTERS.map((l) => ({ id: l.id }));
}

export async function generateMetadata(props: PageProps<"/alphabet/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const l = LETTERS_BY_ID[id];
  return { title: l ? `${l.upper} ${l.lower} — ${l.nameLatin}` : "Lettre" };
}

export default function LetterPage(props: PageProps<"/alphabet/[id]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface" />}>
      <Letter params={props.params} />
    </Suspense>
  );
}

async function Letter({ params }: { params: PageProps<"/alphabet/[id]">["params"] }) {
  const { id } = await params;
  const letter = LETTERS_BY_ID[id];
  if (!letter) notFound();
  return <LetterDetail letter={letter} />;
}
