/**
 * Reconnaissance de tracé par nuage de points ($P, Vatavu et al. 2012) :
 * insensible à l'ordre et au sens des traits, ce qui convient aux débutants.
 */
import { LETTERS } from "@/data/letters";
import { samplePath, type Point } from "./paths";
import { getStrokes, glyphFor, type Case } from "./strokes";

const N = 48;

type Cloud = Point[];

function pathLength(pts: Point[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

/** Rééchantillonne un ensemble de traits en N points régulièrement espacés (sans relier les traits). */
function resample(strokes: Point[][], n = N): Cloud {
  const total = strokes.reduce((acc, st) => acc + pathLength(st), 0);
  const first = strokes[0]?.[0];
  if (!first) return [];
  if (total === 0) return Array.from({ length: n }, () => ({ ...first }));
  const interval = total / (n - 1);
  const out: Point[] = [{ ...first }];
  let acc = 0;
  for (const st of strokes) {
    for (let i = 1; i < st.length; i++) {
      let p = st[i - 1];
      const cur = st[i];
      let d = Math.hypot(cur.x - p.x, cur.y - p.y);
      while (acc + d >= interval && d > 0 && out.length < n) {
        const t = (interval - acc) / d;
        p = { x: p.x + t * (cur.x - p.x), y: p.y + t * (cur.y - p.y) };
        out.push(p);
        d = Math.hypot(cur.x - p.x, cur.y - p.y);
        acc = 0;
      }
      acc += d;
    }
  }
  const last = strokes[strokes.length - 1].at(-1)!;
  while (out.length < n) out.push({ ...last });
  return out;
}

function normalize(cloud: Cloud): Cloud {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of cloud) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const scaled = cloud.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size }));
  const cx = scaled.reduce((a, p) => a + p.x, 0) / scaled.length;
  const cy = scaled.reduce((a, p) => a + p.y, 0) / scaled.length;
  return scaled.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function cloudDistance(a: Cloud, b: Cloud, start: number) {
  const matched = new Array(a.length).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity, index = -1;
    for (let j = 0; j < b.length; j++) {
      if (matched[j]) continue;
      const d = (a[i].x - b[j].x) ** 2 + (a[i].y - b[j].y) ** 2;
      if (d < min) { min = d; index = j; }
    }
    matched[index] = true;
    const weight = 1 - ((i - start + a.length) % a.length) / a.length;
    sum += weight * Math.sqrt(min);
    i = (i + 1) % a.length;
  } while (i !== start);
  return sum;
}

function greedyMatch(a: Cloud, b: Cloud) {
  const step = Math.floor(Math.sqrt(a.length));
  let min = Infinity;
  for (let i = 0; i < a.length; i += step) {
    min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  }
  return min;
}

export function makeCloud(strokes: Point[][]): Cloud {
  return normalize(resample(strokes.filter((s) => s.length > 0)));
}

type Template = { letterId: string; cloud: Cloud };
const templates: Partial<Record<Case, Template[]>> = {};

function getTemplates(c: Case): Template[] {
  if (!templates[c]) {
    templates[c] = LETTERS.flatMap((l) => {
      const paths = getStrokes(glyphFor(l, c));
      return paths ? [{ letterId: l.id, cloud: makeCloud(paths.map((d) => samplePath(d))) }] : [];
    });
  }
  return templates[c]!;
}

export type Recognition = {
  /** Lettres classées de la plus proche à la plus lointaine. */
  ranking: { letterId: string; distance: number }[];
  /** Rang (0 = meilleur) de la lettre attendue. */
  rank: number;
  /** Le tracé est-il accepté comme la lettre attendue ? */
  accepted: boolean;
};

/** Distance au-delà de laquelle on considère le tracé comme illisible. */
const MAX_DISTANCE = 9;

export function recognize(strokes: Point[][], expectedId: string, c: Case): Recognition {
  const cloud = makeCloud(strokes);
  const ranking = getTemplates(c)
    .map((t) => ({ letterId: t.letterId, distance: greedyMatch(cloud, t.cloud) }))
    .sort((a, b) => a.distance - b.distance);
  const rank = ranking.findIndex((r) => r.letterId === expectedId);
  const best = ranking[0]?.distance ?? Infinity;
  const mine = ranking[rank]?.distance ?? Infinity;
  // Accepté si c'est la meilleure correspondance, ou quasi ex-aequo avec une forme voisine.
  const accepted = mine <= MAX_DISTANCE && (rank === 0 || (rank <= 2 && mine <= best * 1.08));
  return { ranking, rank, accepted };
}
