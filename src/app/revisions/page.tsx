import type { Metadata } from "next";
import { ReviewApp } from "./ReviewApp";

export const metadata: Metadata = { title: "Révisions" };

export default function RevisionsPage() {
  return <ReviewApp />;
}
