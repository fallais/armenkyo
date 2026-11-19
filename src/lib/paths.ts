/** Échantillonnage des tracés SVG (commandes absolues M, L, Q, C uniquement). */
export type Point = { x: number; y: number };

const ARITY: Record<string, number> = { M: 2, L: 2, Q: 4, C: 6 };

/** Convertit un tracé en polyligne (≈ `steps` points par courbe). */
export function samplePath(d: string, steps = 16): Point[] {
  const tokens = d.match(/[MLQC]|-?\d*\.?\d+/g) ?? [];
  const pts: Point[] = [];
  let cur: Point = { x: 0, y: 0 };
  let cmd = "M";
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i] in ARITY) cmd = tokens[i++];
    const v = tokens.slice(i, i + ARITY[cmd]).map(Number);
    i += ARITY[cmd];
    if (cmd === "M" || cmd === "L") {
      cur = { x: v[0], y: v[1] };
      pts.push(cur);
      if (cmd === "M") cmd = "L";
    } else if (cmd === "Q") {
      const p0 = cur;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t;
        pts.push({ x: a * p0.x + b * v[0] + c * v[2], y: a * p0.y + b * v[1] + c * v[3] });
      }
      cur = { x: v[2], y: v[3] };
    } else if (cmd === "C") {
      const p0 = cur;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, e = t ** 3;
        pts.push({ x: a * p0.x + b * v[0] + c * v[2] + e * v[4], y: a * p0.y + b * v[1] + c * v[3] + e * v[5] });
      }
      cur = { x: v[4], y: v[5] };
    }
  }
  return pts;
}

export function polylineLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
}

export function toSvgPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y} l0.01,0`;
  return "M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L");
}
