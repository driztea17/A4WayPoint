# Design

The visual system of A4 WAYPOINT. Tokens live in `assets/css/base.css` under `:root`.

## Direction

A clean, light product look, like a well made SaaS dashboard. White cards on a cool off-white ground, soft depth, and one action colour. The owner chose this standard direction on 2026-09-26. The district logo supplies the brand colours.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--navy` | `#0e1440` | Ink for text and headings, dark buttons, footer (from the logo) |
| `--lime` | `#84c318` | Done and progress only: ticks, progress bars, reached journey steps (from the logo). Never text on white |
| `--lime-ink` | `#3d6a00` | Lime-family text on light grounds |
| `--orange` | `#cf4a0c` | Main actions only (primary buttons). White text passes AA |
| `--blue` | `#0b63c4` | Links, focus rings, information |
| `--bg` | `#f5f7fb` | Page ground |
| `--surface` | `#ffffff` | Cards |
| `--surface-2` | `#eef1f8` | Quiet fills: tab tracks, stat tiles, hover rows |
| `--ink-2`, `--ink-3` | `#454d6b`, `#5f6784` | Secondary and tertiary text (AA on white) |

Tints (`--lime-tint`, `--orange-tint`, `--blue-tint`) back icon tiles, badges, and the closing call to action.

## Type

- Headings: Urbanist 700 to 800, tight tracking (`-0.02em`, hero `-0.04em`).
- Body and UI: Inter 400 to 600.
- Scale: `--step--1` to `--step-5`, fluid with `clamp()`.
- Numbers in counts and stats use tabular figures.

## Shape and depth

- Radius: 8, 12, 18, 24 px. Buttons, chips, and tabs are pills.
- Shadows: `--shadow-sm` at rest, `--shadow` on hover, `--shadow-lg` for floating items. All have offset and soft blur.

## Components

Buttons (primary orange, dark navy, secondary outline, ghost), chips with counts, pill tabs, cards, icon tiles (orange, blue, lime, navy), badges (SAMPLE in orange tint), inputs and selects with a 3 px blue focus ring, progress bars in lime, a navy toast, and dashed-border states for loading, empty, and error.

Icons are line icons from Lucide (1.75 stroke) in `assets/img/icons.svg`.

## Motion

GSAP on the home page only: a light fade-up for hero and cards, and one signature moment, the journey line that draws and lights each step in lime. Tool pages have no scroll motion. `prefers-reduced-motion` turns all motion off, and content is visible without JavaScript.

## Print

`assets/css/print.css`: A4 page, black on white, no header or footer, a brand line at the top, and ☐ / ☑ boxes for checklist items.
