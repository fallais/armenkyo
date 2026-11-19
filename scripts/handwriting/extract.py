#!/usr/bin/env python3
"""Extraction des tracés manuscrits (cursif arménien) à partir d'un tableau de référence.

Usage : python3 -I scripts/handwriting/extract.py <image de référence> [cells.json] [sortie.json]
  cells.json : « glyphe de gauche|glyphe de droite » → {box: [x0,y0,x1,y1] en pixels, split: x de séparation
               (mesuré le long de l'inclinaison de l'écriture) ou "lower" si la case ne contient qu'un glyphe (clé de droite)}
  Sortie : src/data/strokes.json (tracés normalisés dans un carré 100×100).

Méthode : seuillage → squelette (Zhang-Suen) → parcours « au stylo » (direction la plus droite,
croisements autorisés) → raccord des morceaux qui se touchent → simplification → courbes de Bézier.
L'image de référence (tableau d'alphabet manuscrit, minuscule puis majuscule) n'est pas versionnée.
"""
import json, math, os, re, sys
from PIL import Image, ImageOps, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
UP = 4  # suréchantillonnage avant squelettisation
SRC = ImageOps.autocontrast(Image.open(sys.argv[1]).convert('L'))

def binarize(box):
    x0, y0, x1, y1 = box
    im = ImageOps.autocontrast(SRC.crop(box), cutoff=1).resize(((x1-x0)*UP, (y1-y0)*UP), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    W, H = im.size; px = im.load()
    thr = 175
    g = [[1 if px[x, y] < thr else 0 for x in range(W)] for y in range(H)]
    # retire les petites composantes (bruit, filigrane)
    seen = [[0]*W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if g[y][x] and not seen[y][x]:
                comp, st = [], [(x, y)]; seen[y][x] = 1
                while st:
                    cx, cy = st.pop(); comp.append((cx, cy))
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx+dx, cy+dy
                            if 0 <= nx < W and 0 <= ny < H and g[ny][nx] and not seen[ny][nx]:
                                seen[ny][nx] = 1; st.append((nx, ny))
                if len(comp) < 60:
                    for cx, cy in comp: g[cy][cx] = 0
    return g, W, H

def thin(g, W, H):
    changed = True
    def nb(x, y):
        return [g[y-1][x], g[y-1][x+1], g[y][x+1], g[y+1][x+1], g[y+1][x], g[y+1][x-1], g[y][x-1], g[y-1][x-1]]
    while changed:
        changed = False
        for step in (0, 1):
            rm = []
            for y in range(1, H-1):
                for x in range(1, W-1):
                    if not g[y][x]: continue
                    p = nb(x, y); b = sum(p)
                    if b < 2 or b > 6: continue
                    a = sum(1 for i in range(8) if p[i] == 0 and p[(i+1) % 8] == 1)
                    if a != 1: continue
                    if step == 0 and (p[0]*p[2]*p[4] or p[2]*p[4]*p[6]): continue
                    if step == 1 and (p[0]*p[2]*p[6] or p[0]*p[4]*p[6]): continue
                    rm.append((x, y))
            for x, y in rm: g[y][x] = 0
            changed = changed or bool(rm)
    return g

N8 = [(-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)]

def trace(g, W, H):
    """Parcours « au stylo » : part des extrémités les plus hautes, suit la direction la plus droite,
    peut traverser un trait déjà tracé (croisements)."""
    pts = {(x, y) for y in range(H) for x in range(W) if g[y][x]}
    nb = lambda p: [(p[0]+dx, p[1]+dy) for dx, dy in N8 if (p[0]+dx, p[1]+dy) in pts]
    # élagage des petites branches parasites
    for _ in range(3):
        ends = [p for p in pts if len(nb(p)) == 1]
        for e in ends:
            path = [e]; cur = e; prev = None
            while True:
                n = [q for q in nb(cur) if q != prev]
                if len(n) != 1 or len(path) > 4*UP: break
                prev, cur = cur, n[0]; path.append(cur)
            if len(path) <= 2*UP and len(nb(cur)) >= 3:
                for q in path[:-1]: pts.discard(q)
    visited = set(); strokes = []
    def heading(path, k=3*UP):
        a, b = path[max(0, len(path)-k)], path[-1]
        dx, dy = b[0]-a[0], b[1]-a[1]; n = math.hypot(dx, dy) or 1
        return dx/n, dy/n
    while True:
        rem = [p for p in pts if p not in visited]
        if not rem: break
        ends = [p for p in rem if len([q for q in nb(p) if q not in visited]) <= 1]
        start = min(ends or rem, key=lambda p: (p[1] - 0.3*p[0]))
        path = [start]; visited.add(start); through = 0
        while True:
            cur = path[-1]
            cand = nb(cur)
            fresh = [q for q in cand if q not in visited]
            h = heading(path) if len(path) > 2 else None
            def score(q):
                if h is None: return 0
                dx, dy = q[0]-cur[0], q[1]-cur[1]; n = math.hypot(dx, dy)
                return -(dx*h[0] + dy*h[1]) / n
            nxt = None
            if fresh:
                best = min(fresh, key=score)
                if h is None or score(best) < 0.5: nxt = best  # virage < ~120°
            if nxt is None and h is not None and through < 3*UP:
                old = [q for q in cand if q in visited and q not in path[-3*UP:]]
                if old:
                    best = min(old, key=score)
                    if score(best) < -0.8: nxt = best; through += 1
            if nxt is None: break
            if nxt not in visited: through = 0
            visited.add(nxt); path.append(nxt)
        # retire un éventuel passage final sur un trait existant
        while through and len(path) > 1: path.pop(); through -= 1
        if len(path) >= 4*UP: strokes.append(path)
    return strokes

def join(strokes, maxd):
    """Relie les morceaux dont les extrémités se touchent (pointes de rebroussement du cursif)."""
    strokes = [list(s) for s in strokes]
    while True:
        best = None
        for i, a in enumerate(strokes):
            for j, b in enumerate(strokes):
                if i >= j: continue
                for ra in (False, True):
                    for rb in (False, True):
                        A = a[::-1] if ra else a; B = b[::-1] if rb else b
                        d = math.hypot(A[-1][0]-B[0][0], A[-1][1]-B[0][1])
                        if d <= maxd and (best is None or d < best[0]): best = (d, i, j, A, B)
        if not best: return strokes
        _, i, j, A, B = best
        strokes = [s for k, s in enumerate(strokes) if k not in (i, j)] + [A + B]

def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1-x0, y1-y0; n = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        d = abs(dy*pts[i][0] - dx*pts[i][1] + x1*y0 - y1*x0) / n if n > 1e-6 else math.hypot(pts[i][0]-x0, pts[i][1]-y0)
        if d > dmax: dmax, idx = d, i
    if dmax > eps: return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def to_path(pts):
    """Catmull-Rom → Béziers cubiques."""
    if len(pts) == 2: return f"M{pts[0][0]:.1f},{pts[0][1]:.1f} L{pts[1][0]:.1f},{pts[1][1]:.1f}"
    closed = pts[0] == pts[-1]
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    for i in range(len(pts)-1):
        p0 = pts[i-1] if i > 0 else (pts[-2] if closed else pts[i])
        p1, p2 = pts[i], pts[i+1]
        p3 = pts[i+2] if i+2 < len(pts) else (pts[1] if closed else p2)
        c1 = (p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6)
        c2 = (p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d

def extract(box, split=None):
    g, W, H = binarize(box)
    g = thin(g, W, H)
    strokes = join(trace(g, W, H), 4.5*UP)
    x0, y0 = box[0], box[1]
    out = {"upper": [], "lower": []}
    for s in strokes:
        pts = [(x0 + (x+0.5)/UP, y0 + (y+0.5)/UP) for x, y in s]
        pts = rdp(pts, 0.3)
        # sens : on commence par l'extrémité la plus haute (les traits manuscrits partent du haut)
        if pts[0] != pts[-1] and (pts[-1][0] + 0.6*pts[-1][1]) < (pts[0][0] + 0.6*pts[0][1]): pts = pts[::-1]
        # centroïde « redressé » le long de l'inclinaison de l'écriture (~0,38 px en x par px en y)
        ymid = (box[1] + box[3]) / 2
        cx = sum(p[0] + 0.38*(p[1] - ymid) for p in pts) / len(pts)
        side = "lower" if split == "lower" else ("upper" if split is None or cx < split else "lower")
        out[side].append(pts)
    for side in out:
        # retire les petits morceaux isolés (fragments d'une lettre voisine)
        def plen(p): return sum(math.hypot(b[0]-a[0], b[1]-a[1]) for a, b in zip(p, p[1:]))
        def gap(p, q): return min(math.hypot(a[0]-b[0], a[1]-b[1]) for a in p for b in q)
        strokes_ = out[side]
        out[side] = [p for p in strokes_ if plen(p) >= 12 or any(gap(p, q) < 2.5 for q in strokes_ if q is not p)]
        out[side].sort(key=lambda p: p[0][0] + 0.6*p[0][1])
        out[side] = [to_path(p) for p in out[side]]
    return out

NUM = re.compile(r"-?\d+(?:\.\d+)?")

def normalize(paths, size=80):
    """Place le glyphe au centre d'un carré 100×100 (côté le plus long = size), proportions conservées."""
    pts = [(float(a), float(b)) for d in paths for a, b in zip(*[iter(NUM.findall(d))]*2)]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    k = size / max(x1 - x0, y1 - y0)
    ox, oy = 50 - k*(x0 + x1)/2, 50 - k*(y0 + y1)/2
    def tf(d):
        nums = iter(NUM.findall(d)); out = []
        for tok in re.findall(r"[MLC]|-?\d+(?:\.\d+)?", d):
            if tok in "MLC": out.append(tok); continue
        # reconstruit en remplaçant chaque paire de nombres
        res, i = "", 0
        for m in re.finditer(r"([MLC])|(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", d):
            if m.group(1): res += ("" if not res else " ") + m.group(1)
            else: res += f"{ox + k*float(m.group(2)):.1f},{oy + k*float(m.group(3)):.1f} "
        return re.sub(r" +", " ", res.replace("M ", "M").replace("L ", "L").replace("C ", "C")).strip()
    return [tf(d) for d in paths]

if __name__ == "__main__":
    cells = json.load(open(sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "cells.json")))
    out_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "src", "data", "strokes.json")
    res = {}
    for name, c in cells.items():
        r = extract(c["box"], c.get("split"))
        up, lo = name.split("|")
        if up: res[up] = normalize(r["upper"])
        if lo: res[lo] = normalize(r["lower"])
        print(name, len(r["upper"]), len(r["lower"]), file=sys.stderr)
    json.dump(res, open(out_path, "w"), ensure_ascii=False, indent=1)
    print("ok", len(res), "glyphes →", out_path, file=sys.stderr)
