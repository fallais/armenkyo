import { BASELINE, XLINE } from "@/lib/strokes";

/** Ligne d'écriture (trait plein) et hauteur des minuscules (pointillés), communes à toutes les lettres. */
export function WritingGuides() {
  return (
    <g className="text-line" stroke="currentColor" fill="none" strokeLinecap="round">
      <line x1="-50" x2="150" y1={XLINE} y2={XLINE} strokeWidth={0.5} strokeDasharray="1.5 2" />
      <line x1="-50" x2="150" y1={BASELINE} y2={BASELINE} strokeWidth={1.1} />
    </g>
  );
}
