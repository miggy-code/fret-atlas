# STORY-006 — Narrow practice to a fret range and strings

## Friction Scorecard

| Measure | Evidence | Result |
|---|---|---|
| Steps | Screenshot `critique-focus-configured.png`: open **Focus**, enable **Fret range**, set two bounds, then exclude strings 4–6 | 6 / 4 ideal |
| Decisions | Enable range, choose two bounds, then decide each string independently | 5 necessary decisions |
| Re-entry | None; the existing 0–12 range remains visible when enabled | 0 |
| Confirmations | None | 0 |
| Dead ends | **Restore defaults** is available once changed; Practice remains one top-level switch away | 0 |
| Hesitations | **Focus** is collapsed below Overlays, and “Fret range” does not say it also affects drill targets | 2 |

Measured live evidence: `critique-focus-configured.png` shows the resulting 5–9 range and strings 1–3 after six interactions. The board immediately reflects the restriction, and the module receives a **Changed** badge plus an in-context reset link.

Verdict: **acceptable**. The individual controls are direct and compact; the extra two interactions are the cost of separate range activation and three per-string toggles.

## Take-away Pass

- Keep the collapsed Focus module; its controls are advanced and do not belong in the initial study surface.
- Keep the range toggle because a full-neck default is meaningful.
- The individual string buttons are necessary for non-contiguous choices. For the common “top three” and “bottom three” exercises, a preset would remove repeated taps without taking that control away.
- The **Changed** badge and **Restore defaults** solve different needs and should remain.

## The Simpler Version

1. Open **Focus**.
2. Enable **Fret range** and enter 5–9.
3. Choose **Top 3 strings** or adjust individual strings.

Concrete change: add optional **Top 3** and **Bottom 3** presets beside the individual string controls. They should set the same buttons visibly, not introduce a second focus model. Clarify the toggle as **Limit fret range** and add a short hint that Focus also bounds practice targets.

## Clarity Issues

- “Fret range” names the control but not its effect. **Limit fret range** is more action-oriented.
- The adjacent **Pattern strings** setting in Overlays and **Strings** in Focus are easy to confuse: Focus restricts notes and drills, whereas Pattern strings only suppresses outlines. The catalog’s redundancy candidates identify this naming risk; the Focus summary should say “Limit notes and drills by fret and string.”
