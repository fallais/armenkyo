import { describe, expect, it } from "vitest";
import { LETTERS } from "@/data/letters";
import { samplePath, type Point } from "@/lib/paths";
import { recognize } from "@/lib/recognizer";
import { getStrokes, glyphFor, type Case } from "@/lib/strokes";

// Générateur pseudo-aléatoire déterministe.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Simule un tracé humain : décalage, échelle, inclinaison, tremblement, sens inversé. */
function wobble(strokes: Point[][], rand: () => number): Point[][] {
  const scale = 0.8 + rand() * 0.5, dx = (rand() - 0.5) * 20, dy = (rand() - 0.5) * 20, shear = (rand() - 0.5) * 0.2;
  return strokes.map((st) => {
    const pts = st.map((p) => ({
      x: p.x * scale + p.y * shear + dx + (rand() - 0.5) * 3,
      y: p.y * scale + dy + (rand() - 0.5) * 3,
    }));
    return rand() < 0.3 ? pts.reverse() : pts;
  });
}

describe("recognizer", () => {
  for (const c of ["upper", "lower"] as Case[]) {
    it(`reconnaît les tracés de référence (${c})`, () => {
      for (const l of LETTERS) {
        const paths = getStrokes(glyphFor(l, c));
        if (!paths) continue;
        const r = recognize(paths.map((d) => samplePath(d)), l.id, c);
        expect(r.rank, `${l.id} ${c}`).toBe(0);
      }
    });

    it(`reconnaît des tracés bruités (${c})`, () => {
      const rand = rng(42);
      let ok = 0, total = 0;
      const failures: string[] = [];
      for (const l of LETTERS) {
        const paths = getStrokes(glyphFor(l, c));
        if (!paths) continue;
        for (let k = 0; k < 5; k++) {
          const r = recognize(wobble(paths.map((d) => samplePath(d)), rand), l.id, c);
          total++;
          if (r.accepted) ok++;
          else failures.push(`${glyphFor(l, c)}→${r.ranking[0].letterId}`);
        }
      }
      console.log(`${c}: ${ok}/${total}`, failures.join(" "));
      expect(ok / total).toBeGreaterThan(0.9);
    });
  }

  it("rejette un tracé d'une autre lettre", () => {
    const o = getStrokes("Օ")!.map((d) => samplePath(d));
    expect(recognize(o, "liun", "upper").accepted).toBe(false);
  });
});
