# Fret Atlas

Fret Atlas is a focused guitar-fretboard workspace for learning how pentatonic positions, rectangles, stacks, and diagonal patterns connect. The neck is the center of the interface; controls are grouped into small modules so the study view stays readable.

**Stack:** React 19, TypeScript, and Vite, with unit tests on `node:test` and browser tests in Playwright.

## Learn the shapes

Choose a key and a scale, then select a study view:

- **Position** shows one complete pentatonic position. Use the previous/next arrows or the **1–5** picker to move directly among all five forms; selecting a form extends the neck when necessary.
- **Shape** isolates one **rectangle** or **stack**.
- **Diagonal** follows that rectangle or stack across the strings, including its partial continuations at the neck edges. Hollow continuation tones mark the next scale note beyond each block.
- **Whole neck** puts every rectangle and stack on the neck at once, including shapes cut off by the nut or the last fret. **Show** switches between both families, rectangles only, or stacks only; hovering a note highlights the shapes it belongs to.
- **One string** and **3NPS** offer linear scale views alongside the shape studies.
- **Fit neck to screen** (on narrow screens) scales Diagonal and Whole neck to the available width; turn it off to return to fretboard scrolling.

Rectangle outlines are red and stack outlines are blue. Shared edges retain both colors, keeping the two pattern families legible when they overlap. **Ghost forms** adds neighboring positions as dashed outlines so their connections are easier to see.

With standard tuning, **Warp** draws a thin line at the G–B boundary, marked **+1** in the string-name gutter, for the one-fret shift toward the bridge. It is hidden in all-fourths tuning, where the shift does not exist.

## Workspace

The board supports standard tuning or all fourths, 12 to 24 frets, left-handed display, string and fret focus, note/interval labels, degree colors, a triad overlay, custom note sets, and marked fingerings. **Whole map**, **Skeleton**, **Warp**, and **Pentatonic only** control how much context surrounds the active form.

The modular controls hold secondary settings such as labels, overlays, focus, display options, and scale tones. **Share**, **Guide**, and **Reset view** are in the board header. Each settings panel shows **Changed** when it differs from its defaults and offers **Restore defaults** for just that panel; Reset view restores them all. Key, scale, custom notes and marks always stay. Dark mode lives in Instrument & display.

Your view, selected form, overlays, and marked notes are saved in browser local storage. **Share** copies a URL that contains the current view, so it can be reopened or sent to someone else.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:4177](http://127.0.0.1:4177). To choose a different port:

```sh
npm run dev -- --port 4178
```

Available checks:

```sh
npm test
npm run build
npm run test:browser
```

`server.mjs` is a minimal zero-dependency static file server (`node server.mjs --port 4177`) for serving the files without Vite. The production build in `dist/` does not use it.

## Credit

Fret Atlas was informed by [Fret Science's Scale Visualizer](https://fretscience.com/tools/scale-visualizer), created by [Keith Martin](https://fretscience.com/). It is an independent study tool and has no affiliation with Fret Science or Keith Martin.

## Development notes

See [DESIGN.md](./DESIGN.md) for the musical model, visual grammar, and verification scope.
