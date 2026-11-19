#!/usr/bin/env python3
"""Prépare les fichiers audio de l'application à partir des enregistrements Commons.

Usage : python3 -I scripts/audio/process.py <dossier de travail>   (après fetch_commons.py)
Produit :
  public/audio/<id>.mp3        lettre, découpée dans « Armenian alphabet (Eastern Armenian).ogg »
  public/audio/word-<id>.mp3   mot d'exemple (Lingua Libre)
  src/data/audio-credits.json  auteurs et licences (CC BY-SA : attribution obligatoire)
Nécessite ffmpeg.
"""
import array, json, math, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
WORK = sys.argv[1] if len(sys.argv) > 1 else "/tmp/armenkyo-audio"
OUT = os.path.join(ROOT, "public", "audio")
os.makedirs(OUT, exist_ok=True)

# Ordre de l'enregistrement : les 38 lettres classiques (avec Ւ), puis ու et և.
RECORDING_ORDER = [
    "ayb", "ben", "gim", "da", "yech", "za", "e", "et", "to", "zhe", "ini", "liun", "khe", "tsa", "ken", "ho",
    "dza", "ghat", "che", "men", "hi", "nu", "sha", "vo", "cha", "pe", "dje", "ra", "se", "vev", "tiun", "re",
    "tso", None,  # Ւ seule : inutilisée en arménien oriental réformé
    "piur", "ke", "o", "fe", "u", "yev",
]

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

def peak_gain(path_in, filters):
    """Gain (dB) pour amener le pic à -2 dBFS après filtrage."""
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", path_in, "-af", filters + ",volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr)
    return -2 - float(m.group(1)) if m else 0

def encode(path_in, path_out, filters):
    gain = peak_gain(path_in, filters)
    ff("-i", path_in, "-af", f"{filters},volume={gain:.2f}dB", "-ac", "1", "-ar", "44100", "-b:a", "64k", path_out)

meta = json.load(open(os.path.join(WORK, "meta.json")))
picks = json.load(open(os.path.join(HERE, "picks.json")))
raw = os.path.join(WORK, "raw")
files = {f.rsplit(".", 1)[0]: os.path.join(raw, f) for f in os.listdir(raw)}

# --- Mots d'exemple : coupe des silences, filtre passe-haut, normalisation.
TRIM = ("highpass=f=80,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse")
LETTERS_ONLY = os.environ.get("LETTERS_ONLY") == "1"
done_words = []
for lid in ([] if LETTERS_ONLY else picks):
    if lid not in files:
        print("mot manquant (non téléchargé) :", lid, file=sys.stderr); continue
    encode(files[lid], os.path.join(OUT, f"word-{lid}.mp3"), TRIM)
    done_words.append(lid)

# --- Lettres : débruitage, détection des 40 segments, découpe.
alpha = files["_alphabet"]
clean = os.path.join(WORK, "alphabet-clean.wav")
ff("-i", alpha, "-af", "highpass=f=120,lowpass=f=7000,afftdn=nf=-25", "-ac", "1", "-ar", "16000", clean)
pcm = os.path.join(WORK, "alphabet-clean.pcm")
ff("-i", clean, "-f", "s16le", pcm)
a = array.array("h"); a.frombytes(open(pcm, "rb").read())
WIN = 160  # 10 ms à 16 kHz
db = [20 * math.log10(max(math.sqrt(sum(x * x for x in a[i:i + WIN]) / WIN), 1) / 32768) for i in range(0, len(a) - WIN, WIN)]
segs, i = [], 0
while i < len(db):
    if db[i] > -30:
        j = i
        while j < len(db) and db[j] > -30: j += 1
        if segs and i - segs[-1][1] < 25: segs[-1][1] = j
        else: segs.append([i, j])
        i = j
    else:
        i += 1
segs = [s for s in segs if s[1] - s[0] >= 8]
if len(segs) != len(RECORDING_ORDER):
    sys.exit(f"{len(segs)} segments trouvés, {len(RECORDING_ORDER)} attendus : vérifier les seuils")
for (s, e), lid in zip(segs, RECORDING_ORDER):
    if lid is None: continue
    start, end = max(0, s / 100 - 0.12), e / 100 + 0.18
    dur = end - start
    filt = f"atrim={start:.3f}:{end:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={dur - 0.06:.3f}:d=0.06"
    tmp = os.path.join(WORK, f"seg-{lid}.wav")
    ff("-i", clean, "-af", filt, tmp)
    encode(tmp, os.path.join(OUT, f"{lid}.mp3"), "anull")

if LETTERS_ONLY:
    sys.exit(0)

# --- Crédits.
def credit(m):
    c = {k: m[k] for k in ("title", "page", "author", "license", "licenseUrl")}
    sp = re.search(r"Speaker: ([^\n]+)", c["author"])  # Lingua Libre : « Speaker: X / Recorder: Y »
    if sp: c["author"] = sp.group(1).strip()
    return c
credits = {
    "letters": credit(meta["_alphabet"]),
    "words": {lid: {"word": picks[lid][1], **credit(meta[lid])} for lid in done_words},
}
json.dump(credits, open(os.path.join(ROOT, "src", "data", "audio-credits.json"), "w"), ensure_ascii=False, indent=1)
print("ok:", len(done_words), "mots,", sum(1 for x in RECORDING_ORDER if x), "lettres")
