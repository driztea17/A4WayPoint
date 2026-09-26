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

- One family for everything: Poppins (owner's choice, 2026-09-26). Headings 700 to 800 with tight tracking (`-0.02em`, hero `-0.04em`); body and UI 400 to 600.
- Scale: `--step--1` to `--step-5`, fluid with `clamp()`.
- Numbers in counts and stats use tabular figures.

## Shape and depth

- Radius: 8, 12, 18, 24 px. Buttons, chips, and tabs are pills.
- Shadows: `--shadow-sm` at rest, `--shadow` on hover, `--shadow-lg` for floating items. All have offset and soft blur.

## Components

Buttons (primary orange, dark navy, secondary outline, ghost), chips with counts, pill tabs, cards, icon tiles (orange, blue, lime, navy), badges (SAMPLE in orange tint), inputs and selects with a 3 px blue focus ring, progress bars in lime, a navy toast, and dashed-border states for loading, empty, and error.

Team cards: a 300 px full-photo portrait (4:5, 28 px radius) with navy fades top and bottom, name and role in white at the top, the district logo at bottom left, and a white CIO or COO pill at bottom right. Centred side by side on desktop, stacked and centred on phones. Initials in lime show when a photo is missing.

Home entry cards carry a preview of their own content instead of a generic icon tile: the Resource Hub list, Toolkit pills, a mini AI prompt with a highlighted blank, and a tiny fan of Shuffle cards that spreads on hover.

Home invite: an original astronaut-in-a-UFO illustration (`assets/img/ufo-astronaut.svg`, navy outline, lime light) floats in from a random side 100 ms after load, bobs gently with a navy "Try something new!" bubble, and links to Shuffle. A close button hides it for the visit (sessionStorage); it flies off by itself after 30 seconds. Reduced motion fades it in without flight or bob.

Breakpoints: 640 px (container padding, 2-column grids), 1024 px (desktop menu and two-panel tool pages).

Icons are line icons from Lucide (1.75 stroke) in `assets/img/icons.svg`.

## Motion

SHUFFLE (`shuffle.html`) is the one playful surface: a navy table with a dotted route, card backs in the deck colour (Service lime, Leadership lavender, Fellowship coral) or, for Service cards, the colour and icon of the Leo service area, with white wave shapes, a white "SHUFFLE" tag, and the icon in a solid white disc so it reads on every colour. Card fronts are cream with a 3 px border and a colour wave header holding two white tags (area or deck with icon, and the card number), the centred idea (name, concept, waypoint dots, tinted twist box), and a ticket stub: a dashed perforation with two punched notches, then Budget and Volunteers side by side. Motion is a Web Animations shuffle, lift, flip (expo ease-out, no overshoot), and dot burst of about one second. Deck and service-area colours and ink colours live in `data/shuffle.json`.


GSAP on the home page only: a light fade-up for hero and cards, and one signature moment, the journey line that draws and lights each step in lime. Tool pages have no scroll motion. `prefers-reduced-motion` turns all motion off, and content is visible without JavaScript.

## Print

`assets/css/print.css`: A4 page, black on white, no header or footer, a brand line at the top, and ☐ / ☑ boxes for checklist items.
