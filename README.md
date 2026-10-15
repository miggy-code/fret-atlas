# Fret Atlas

Fret Atlas is a focused guitar-fretboard workspace for learning how pentatonic positions, rectangles, stacks, and diagonal patterns connect. The neck is the center of the interface; controls are grouped into small modules so the study view stays readable.

## Learn the shapes

Choose a key and a scale, then select a study view:

- **In position** shows one complete pentatonic position. Use the previous/next arrows or the **1–5** picker to move directly among all five forms; selecting a form extends the neck when necessary.
- **Shape** isolates one **rectangle** or **stack**.
- **Diagonal** follows that rectangle or stack across the strings, including its partial continuations at the neck edges.
- **All patterns** puts every rectangle and stack on the neck at once.
- **One string** and **3NPS** offer linear scale views alongside the shape studies.

Rectangle outlines are red and stack outlines are blue. Shared edges retain both colors, keeping the two pattern families legible when they overlap. **Ghost forms** adds the neighboring positions as quiet dashed outlines so their connections are easier to see.

With standard tuning, **Warp** marks the G–B boundary and shows the one-fret shift toward the bridge. It is hidden in all-fourths tuning, where the shift does not exist.

## Workspace

The board supports standard tuning or all fourths, 12 to 24 frets, left-handed display, string and fret focus, note/interval labels, degree colors, a triad overlay, custom note sets, and marked fingerings. **Whole map**, **Skeleton**, and **Pentatonic only** control how much context surrounds the active form.

The modular controls hold secondary settings such as labels, overlays, focus, display options, and scale tones. **Share** and **Guide** live below the board, along with the light/dark appearance switch.

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

## Credit

Fret Atlas was informed by [Fret Science's Scale Visualizer](https://fretscience.com/tools/scale-visualizer), created by [Keith Martin](https://fretscience.com/). It is an independent study tool and has no affiliation with Fret Science or Keith Martin.

## Development notes

See [DESIGN.md](./DESIGN.md) for the musical model, visual grammar, and verification scope.
