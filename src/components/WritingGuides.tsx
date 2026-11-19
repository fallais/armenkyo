/** Réglure façon cahier (lignes horizontales discrètes) pour l'écriture cursive. */
export function WritingGuides() {
  return (
    <g className="text-line" stroke="currentColor" fill="none">
      {[20, 35, 50, 65, 80].map((y) => (
        <line key={y} x1="3" x2="97" y1={y} y2={y} strokeWidth={y === 65 ? 0.7 : 0.35} strokeDasharray={y === 65 ? undefined : "1.5 1.5"} />
      ))}
    </g>
  );
}
