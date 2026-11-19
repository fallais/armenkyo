#!/usr/bin/env python3
"""Importe les tracés manuscrits du projet ArmenianAlphabet (Gagik Papikyan, licence MIT) :
https://github.com/gagiopapinni/ArmenianAlphabet — fichier src/js/letters.js.

Usage : python3 -I scripts/handwriting/import_armenian_alphabet.py <letters.js>
Produit src/data/strokes.json.

Chaque entrée du fichier contient, dans l'ordre d'écriture, les traits de la majuscule puis de la minuscule
(sens des chemins = sens du tracé). Sur le site, la lettre est placée par translate(offset) scale(1.1) dans
un carré 100×100 dont la ligne d'écriture est à y = 60 : toutes les lettres partagent donc la même ligne
de base. On conserve cette ligne (BASELINE ci-dessous) avec une échelle commune à toutes les lettres ; les
minuscules sont réduites autour de la ligne de base (LOWER_SCALE) et chaque glyphe est centré horizontalement.
L'entrée « հիւն » contient Ու puis ու (digraphe), utilisés tels quels.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SITE_LINE = 60          # ligne d'écriture du site
LOWER_SCALE = 0.85      # minuscules un peu plus petites
MARGIN = 5
SLANT = 0.35            # inclinaison de l'écriture (x par unité de y)
NUM = r"-?\d*\.?\d+"

# Ordre des entrées du fichier source → (majuscule, minuscule)
PAIRS = [tuple(p) for p in ["Աա", "Բբ", "Գգ", "Դդ", "Եե", "Զզ", "Էէ", "Ըը", "Թթ", "Ժժ", "Իի", "Լլ", "Խխ", "Ծծ",
         "Կկ", "Հհ", "Ձձ", "Ղղ", "Ճճ", "Մմ", "Յյ", "Նն", "Շշ", "Ոո", "Չչ", "Պպ", "Ջջ", "Ռռ", "Սս", "Վվ", "Տտ",
         "Րր", "Ցց"]] + [("Ու", "ու")] + [tuple(p) for p in ["Փփ", "Քք"]] + [("և",)] + [tuple(p) for p in ["Օօ", "Ֆֆ"]]


def parse_path(d):
    """Chemin SVG (M, L, C, Z absolus) → liste de segments [(cmd, [points])]."""
    toks = re.findall(r"[MLCZ]|" + NUM, d)
    segs, i, cmd, start, cur = [], 0, None, None, None
    while i < len(toks):
        if toks[i] in "MLCZ":
            cmd = toks[i]; i += 1
            if cmd == "Z":
                segs.append(("L", [start])); cur = start; continue
        n = {"M": 1, "L": 1, "C": 3}[cmd]
        pts = [(float(toks[i+2*k]), float(toks[i+2*k+1])) for k in range(n)]
        i += 2*n
        if cmd == "M":
            segs.append(("M", pts)); start = cur = pts[0]; cmd = "L"
        else:
            segs.append((cmd, pts)); cur = pts[-1]
    return segs


def transform(segs, f):
    return [(c, [f(p) for p in pts]) for c, pts in segs]


def bbox(strokes):
    pts = [p for s in strokes for _, ps in s for p in ps]
    return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)


def parse_points(d):
    n = [float(x) for x in re.findall(NUM, d)]
    return list(zip(n[::2], n[1::2]))


def fmt(segs):
    return " ".join(c + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) for c, pts in segs)


def main():
    src = open(sys.argv[1], encoding="utf-8").read()
    entries = re.findall(r'"(\d+)"\s*:\s*\{\s*offset\s*:\s*\[\s*(' + NUM + r')\s*,\s*(' + NUM + r')\s*\]\s*,\s*name\s*:\s*"[^"]*"\s*,\s*path\s*:\s*\[(.*?)\]\s*\}', src, re.S)
    if len(entries) != len(PAIRS):
        raise SystemExit(f"{len(entries)} entrées trouvées, {len(PAIRS)} attendues")
    glyphs = {}
    for (idx, ox, oy, body), pair in zip(sorted(entries, key=lambda e: int(e[0])), PAIRS):
        ox, oy = float(ox), float(oy)
        strokes = [transform(parse_path(d), lambda p: (p[0]*1.1 + ox, p[1]*1.1 + oy)) for d in re.findall(r"`([^`]*)`", body)]
        if len(pair) == 1:
            glyphs[pair[0]] = strokes; continue
        # la minuscule commence au premier trait situé à droite des précédents (abscisses redressées
        # le long de l'inclinaison de l'écriture)
        def xs(st): return [p[0] + SLANT*(p[1] - SITE_LINE) for _, ps in st for p in ps]
        gap = lambda k: min(x for s in strokes[k:] for x in xs(s)) - max(x for s in strokes[:k] for x in xs(s))
        split = max(range(1, len(strokes)), key=gap)
        if "-v" in sys.argv: print(pair, f"{split}/{len(strokes)} ({gap(split):+.1f})", file=sys.stderr)
        glyphs[pair[0]], glyphs[pair[1]] = strokes[:split], strokes[split:]
    # échelle commune : le glyphe le plus haut (au-dessus / au-dessous de la ligne) tient dans le carré
    is_lower = lambda g: g != g.upper()
    up = max((SITE_LINE - bbox(s)[1]) * (LOWER_SCALE if is_lower(g) else 1) for g, s in glyphs.items())
    down = max((bbox(s)[3] - SITE_LINE) * (LOWER_SCALE if is_lower(g) else 1) for g, s in glyphs.items())
    wide = max((bbox(s)[2] - bbox(s)[0]) * (LOWER_SCALE if is_lower(g) else 1) for g, s in glyphs.items())
    if "-v" in sys.argv: print(f"haut {up:.1f}, bas {down:.1f}, large {wide:.1f}", file=sys.stderr)
    k = min((100 - 2*MARGIN) / (up + down), (100 - 2*MARGIN) / wide)
    BASELINE = round(MARGIN + up*k, 1)  # ligne de base dans nos glyphes (repère 100×100)
    out = {}
    for g, strokes in glyphs.items():
        kk = k * (LOWER_SCALE if is_lower(g) else 1)
        x0, _, x1, _ = bbox(strokes); cx = (x0 + x1) / 2
        f = lambda p, kk=kk, cx=cx: (50 + (p[0] - cx)*kk, BASELINE + (p[1] - SITE_LINE)*kk)
        out[g] = [fmt(transform(s, f)) for s in strokes]
    # hauteur des minuscules (lettres sans hampe ni jambage)
    tops = sorted(min(p[1] for s in out[g] for p in parse_points(s)) for g in "աոսռօ")
    xline = round(tops[len(tops)//2], 1)
    dest = os.path.join(ROOT, "src", "data", "strokes.json")
    json.dump({"baseline": BASELINE, "xline": xline, "source": "https://github.com/gagiopapinni/ArmenianAlphabet (MIT)",
               "glyphs": out}, open(dest, "w"), ensure_ascii=False, indent=1)
    print(f"ok : {len(out)} glyphes, échelle {k:.2f}, ligne de base y={BASELINE} → {dest}", file=sys.stderr)


if __name__ == "__main__":
    main()
