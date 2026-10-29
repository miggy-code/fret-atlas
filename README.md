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

## Practice

The board header switches between **Explore** and **Practice**. Both share the key, scale, view, form and board; only the panel below the board changes.

- **Sound.** Tapping a note plucks it. In Explore, **Play**, next to the form arrows, runs the current form up and back down the way it is fingered (low string to high) and lights each note as it sounds. **Hear chord** plays the chord in the Chord row. Sound can be turned off in Settings.
- **Drills.** The Practice tab offers **Find notes**, **Find scale degrees** (pick the degrees there), **Find chord tones**, and **Play through**. Each drill names one note, such as *Find every C (♭3) in Form 2* or *Find every E on the G string*, and highlights where to look. Notes, outlines and other hints stay hidden until you find them. A correct tap reveals the note with a pluck; a wrong one shows a cross and tells you which note it was. Finishing a round plays every answer and deals the next prompt. The flame counts correct taps in a row, and your best streak is saved on this device. Drills follow the current key, scale, form and focus.

- **Progress.** In Position view, a form you've had on screen for a few seconds counts as seen; a form you've played through from Practice or finished a drill in counts as practiced. Progress appears only in the Practice tab: as dots on the 1–5 picker and as a ring for each of the 12 keys (minor and major are tracked separately); click a key to study it. Progress is saved on this device only.

These extras sit around the atlas and never change it: ending a drill restores your view exactly, and none of them alter the saved or shared view.

## Workspace

The board supports standard tuning or all fourths, 12 to 24 frets, left-handed display, string and fret focus, note/interval labels, degree colors, a triad overlay, custom note sets, and marked fingerings. **Whole map**, **Skeleton**, **Warp**, and **Pentatonic only** control how much context surrounds the active form.

Below the board, Explore holds note view, scale degrees, the Chord row, and the **Overlays** and **Focus** panels. **Share**, **Guide**, and **Settings** are in the board header; Settings holds tuning, frets, spelling, handedness, dark mode, sound and **Reset view**. Each panel shows **Changed** when it differs from its defaults and offers **Restore defaults** for just that panel; Reset view restores them all. Key, scale, custom notes and marks always stay.

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

### Accounts

To enable sign-in, create a [Clerk application](https://dashboard.clerk.com/), copy `.env.example` to `.env.local`, and set `VITE_CLERK_PUBLISHABLE_KEY` to its publishable key. Set the same variable in the production build environment and configure the production domain in Clerk. Restart the dev server after changing it. Without a key, the atlas works as before and account controls are hidden.

Accounts currently provide sign-in and account management only. Views and progress remain on the device and are not linked to an account. Premium subscriptions, server-side authorization, and cross-device sync are not implemented. A future backend must verify Clerk session tokens and enforce entitlements on the server; the same Clerk application can support mobile clients.

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
