import type { Metadata } from "next";
import { QuizApp } from "./QuizApp";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage() {
  return <QuizApp />;
}
