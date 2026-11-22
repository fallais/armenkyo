# Armenkyo

A web app for learning the Eastern Armenian alphabet (French interface), inspired by Obenkyo.
Mobile-first, works on desktop. All progress is stored locally in the browser (IndexedDB). No account or backend.

Live: https://fallais.github.io/armenkyo/

## Features

- **Alphabet**: the 39 letters, with names, romanization, IPA, a pronunciation hint in French and an example word.
- **Handwriting**: letters are shown and practiced in Armenian cursive (handwritten forms), with the printed form alongside.
- **Stroke order**: an animated, numbered stroke order for every uppercase and lowercase letter.
- **Tracing**: draw over a faint model of the letter, or draw without one, then check the result.
- **Quiz**: letter → sound, sound → letter, sound → drawing (draw from memory; uppercase and lowercase together when "both" is chosen).
  Letters are either all 39 or a selection made from the Alphabet page. Order is either spaced repetition with FSRS (`ts-fsrs`:
  due letters first, then new ones) or fully random. Letters can be shown printed or handwritten.
- **Dashboard**: shortcuts to each exercise (with pending reviews), progress per letter.
- **Help**: usage tips, version and credits.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest (handwriting recognizer)
npm run lint
npm run build      # static export into out/
```

Deployment: every push to `main` builds the static export (`PAGES_BASE_PATH=/armenkyo`) and publishes it to
GitHub Pages (`.github/workflows/pages.yml`).

## Data

- `src/data/letters.ts`: letters, sounds, hints, examples, groups of easily confused letters.
- `src/data/strokes.json`: handwritten (cursive) strokes in writing order and direction, from the MIT-licensed
  [ArmenianAlphabet](https://github.com/gagiopapinni/ArmenianAlphabet) project (see `THIRD_PARTY_NOTICES.md`).
  All letters share one baseline (`baseline`) and lowercase height (`xline`) in a 100×100 box.
  Regenerate with `python3 -I scripts/handwriting/import_armenian_alphabet.py <path to letters.js>`.
- `src/data/strokes-print.json`: earlier print-style strokes, drawn over Noto Sans Armenian (unused, kept as an alternative style).
  Preview: `python3 scripts/preview-strokes.py src/data/strokes-print.json "Ա,ա" /tmp/out.png`
- `public/audio/<id>.mp3`: letter pronunciations, cut from a Wikimedia Commons recording of the alphabet.
  `public/audio/word-<id>.mp3`: example words (Lingua Libre). Both CC BY-SA, credited on `/credits`.
  Regenerate with `scripts/audio/fetch_commons.py` then `scripts/audio/process.py` (needs ffmpeg).
  Missing files are fine: the speaker button is hidden and the transcription is shown.

## Handwriting recognition

`src/lib/recognizer.ts` uses the $P point-cloud recognizer. It ignores stroke order and direction. A drawing is accepted
if the expected letter is the closest match, or nearly tied with a similar-looking letter. When the drawing is rejected,
the user can still grade their own answer.
