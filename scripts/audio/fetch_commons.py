#!/usr/bin/env python3
"""Télécharge depuis Wikimedia Commons les enregistrements choisis dans picks.json.

Usage : python3 -I scripts/audio/fetch_commons.py <dossier de travail>
  - liste les fichiers Lingua Libre en arménien (LL-Q8785) → <travail>/ll.json
  - récupère auteurs et licences → <travail>/meta.json
  - télécharge les fichiers → <travail>/raw/
picks.json : id de lettre → [mot tel que nommé sur Commons, mot affiché, translittération, traduction].
"""
import json, re, time, urllib.request, urllib.parse, urllib.error, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = sys.argv[1] if len(sys.argv) > 1 else "/tmp/armenkyo-audio"
os.makedirs(WORK, exist_ok=True)
UA = "armenkyo-audio-fetch/0.1"
API = "https://commons.wikimedia.org/w/api.php"
PREF = ["Vahagn Petrosyan", "Yevgenya Shamshyan (Vahagn Petrosyan)", "Veravi95", "Emptyfear"]
def get(url):
    for attempt in range(8):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("Retry-After") or 0) or 15 * (attempt + 1)
                print("429, waiting", wait, flush=True); time.sleep(wait); continue
            raise
    raise RuntimeError("too many retries: " + url)
LL = os.path.join(WORK, "ll.json")
if not os.path.exists(LL):
    names, cont = [], {}
    while True:
        q = urllib.parse.urlencode({"action": "query", "list": "allimages", "aiprefix": "LL-Q8785", "ailimit": 500, "format": "json", **cont})
        r = json.loads(get(API + "?" + q))
        names += ["File:" + it["name"].replace("_", " ") for it in r["query"]["allimages"]]
        if "continue" not in r: break
        cont = r["continue"]; time.sleep(1)
    json.dump(names, open(LL, "w"), ensure_ascii=False)
files = json.load(open(LL))
idx = {}
for f in files:
    m = re.match(r"File:LL-Q8785 \(hye\)-(.+?)-(.+)\.(wav|ogg|flac|mp3)$", f)
    if m: idx.setdefault(m.group(2), []).append((m.group(1), f))
picks = json.load(open(os.path.join(HERE, "picks.json")))
titles = {}
for lid, (word, *_rest) in picks.items():
    cands = sorted(idx[word], key=lambda sf: PREF.index(sf[0]) if sf[0] in PREF else 99)
    titles[lid] = cands[0][1]
titles["_alphabet"] = "File:Armenian alphabet (Eastern Armenian).ogg"
META = os.path.join(WORK, "meta.json")
meta = json.load(open(META)) if os.path.exists(META) else {}
items = [it for it in titles.items() if it[0] not in meta]
for i in range(0, len(items), 20):
    chunk = items[i:i+20]
    q = urllib.parse.urlencode({"action": "query", "titles": "|".join(t for _, t in chunk), "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "format": "json"})
    d = json.loads(get(API + "?" + q))
    by_title = {p["title"]: p for p in d["query"]["pages"].values()}
    norm = {n["from"]: n["to"] for n in d["query"].get("normalized", [])}
    for lid, t in chunk:
        p = by_title[norm.get(t, t)]; ii = p["imageinfo"][0]; m = ii["extmetadata"]
        strip = lambda s: re.sub("<[^>]+>", "", s or "").strip()
        meta[lid] = {"title": p["title"], "url": ii["url"].split("?")[0], "page": ii["descriptionurl"] if "descriptionurl" in ii else "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(p["title"].replace(" ", "_")),
                     "author": strip((m.get("Artist") or {}).get("value")), "license": strip((m.get("LicenseShortName") or {}).get("value")),
                     "licenseUrl": (m.get("LicenseUrl") or {}).get("value", "")}
    time.sleep(2)
json.dump(meta, open(os.path.join(WORK, "meta.json"), "w"), ensure_ascii=False, indent=1)
os.makedirs(os.path.join(WORK, "raw"), exist_ok=True)
for lid, m in meta.items():
    ext = m["url"].rsplit(".", 1)[-1]
    path = os.path.join(WORK, "raw", f"{lid}.{ext}")
    if not os.path.exists(path):
        data = get(m["url"])
        open(path + ".part", "wb").write(data)
        os.replace(path + ".part", path)
        print("downloaded", lid, len(data), flush=True)
        time.sleep(3)
print("ok", len(meta))
