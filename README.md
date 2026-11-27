# Digital Flute

A flute you play in the browser. Touch/drag the holes (or use your keyboard),
follow guided songs, or watch a demo. No build step, no dependencies.

## Run locally

Any static server works (the app uses ES5-era classic scripts, so it also
works from `file://`, but a server is recommended for correct MIME types):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or: `npm start` (same thing). Or just open `index.html` in a browser.

> Audio requires a user gesture — the `AudioContext` is created/resumed on
> your first tap/keypress, per browser autoplay policy.

## Play

| Input | How |
|---|---|
| Touch / mouse | Press and drag across holes (glissando). Multi-touch works. |
| Keyboard | `A S D F G H J K L ;` — bottom hole (C4) to top (E5). Hold to sustain, release to stop. |
| Focused hole | `Space` / `Enter` while a hole button is focused. |

Holes are real `<button>`s with `aria-label`s, and the status line is an
`aria-live` region, so screen readers announce the next note.

## Modes

- **Free Play** (default) — just play. Status shows the notes you're holding.
- **Song presets** — the orange ring marks the next note. Play it to advance;
  a wrong note flashes red with the expected note. Finishing a song shows
  “Done” and auto-restarts after ~2s. **Reset** restarts manually.
- **Demo** — plays the song on the audio clock (scheduled with
  `AudioContext.currentTime`, not `setTimeout` drift). Touching a hole during
  demo takes over and stops the demo. **Stop** ends it early.

Volume is adjustable with the slider in the header.

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Markup, CSS, and UI/audio code. Holes are generated from `NOTES`. |
| `flute-core.js` | Pure, testable core: `NOTES`/`NOTE_MAP`, `SONGS`, `AUDIO` params, `validateSongs()`, `createSongTracker()`. Loaded as a classic script (`window.FluteCore`) and via `require()` in tests. |
| `tests/` | `node:test` suites — core logic + HTML regression checks. |
| `favicon.svg`, `manifest.webmanifest` | Installability / icons. |

### Song format

```js
{ note: "C4", lyric: "Twin-", dur: 350 } // dur in milliseconds
```

Notes must be in `NOTES` (C4–E5). `validateSongs()` runs at startup and in
tests — an unknown note or non-positive `dur` fails loudly instead of
silently skipping a note in demo mode.

### Audio

Each note is a `FluteVoice`: sine fundamental + octave harmonic, 5 Hz
vibrato (depth scales with pitch), band-passed brown-noise breath, and a
short attack/release envelope, through a master gain → dynamics compressor.
Voices are ref-counted per hole (multi-touch safe), `stop()` is idempotent
and disconnects *all* nodes, and `blur`/`visibilitychange` panic-stop every
voice so a note can never drone forever.

## Test

```bash
npm test   # node --test tests/  (Node >= 18, no install needed)
```

CI (`.github/workflows/ci.yml`) runs the same suite on every push/PR.

## Browser support

Any modern browser with Web Audio + Pointer Events (Chrome, Firefox,
Safari 15+, Edge). If Web Audio is unavailable the app shows
“Audio unavailable in this browser” instead of crashing.

## License

MIT — see `LICENSE`.
