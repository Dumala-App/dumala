# Dumala Custom Icon Layer

## Summary

Create a reusable set of 24 football-specific outline icons. Continue using Lucide for generic actions, navigation, status, and utility concepts.

Source artwork will be provided as individual SVG files and converted into typed inline React icons for `currentColor`, accessibility, and consistent sizing.

## SVG Specification

Every generated SVG must use:

- `viewBox="0 0 24 24"`
- `fill="none"`
- `stroke="currentColor"`
- `stroke-width="2"`
- `stroke-linecap="round"`
- `stroke-linejoin="round"`
- No embedded colors, text, background, gradients, masks, or raster images
- Clear rendering at 16px, 20px, and 24px
- Kebab-case filenames under `src/assets/icons/dumala/`

## Required Custom Icons

| Filename | Visual concept | Primary uses |
|---|---|---|
| `sprint-run.svg` | Running lane, boot, and motion lines | Speedster, Winger |
| `clinical-finish.svg` | Ball entering a goal corner with precision mark | Clinical Finisher, Poacher |
| `hold-up-play.svg` | Player shielding a ball from pressure | Target Man |
| `dribble-slalom.svg` | Ball weaving between two cones | Dribbler, Magician |
| `false-nine-drop.svg` | Forward dropping away from the penalty area | False 9 |
| `first-touch-control.svg` | Boot cushioning a descending ball | First Touch, Velcro |
| `aerial-duel.svg` | Ball above two competing upward movements | Aerial Threat, Aerial Dominant |
| `counter-transition.svg` | Ball moving rapidly across halfway with forward arrows | Counter Attack |
| `link-up-triangle.svg` | Three connected passing nodes and a ball | Link-Up Play, Through Ball |
| `chip-shot.svg` | Ball arcing over a keeper or defensive line | Chip Shot |
| `playmaker-compass.svg` | Central ball with multiple passing directions | Playmaker, Maestro, Vision, Tempo Setter |
| `box-to-box-route.svg` | Two penalty areas connected by a running path | Box-to-Box, Engine |
| `deep-lying-pivot.svg` | Deep midfield node distributing forward | Deep Lying, Anchor |
| `set-piece-delivery.svg` | Stationary ball with a curling delivery path | Set Piece Specialist |
| `ball-winner.svg` | Boot intercepting a pass lane | Ball Winner, Sweeper, Tackling Machine |
| `defensive-wall.svg` | Aligned defensive blocks protecting a goal | Wall |
| `ball-playing-defender.svg` | Shield and ball with an outgoing pass | Ball-Playing CB |
| `overlap-run.svg` | Curved outside run around a teammate | Wingback Overlap |
| `man-mark.svg` | Two player nodes joined by a tracking bracket | Man Marker |
| `last-ditch-tackle.svg` | Sliding tackle blocking a shot path | Last-Ditch Tackle |
| `offside-line.svg` | Defensive line with an attacker beyond it | Offside Trap |
| `cross-delivery.svg` | Ball arcing from the flank into the box | Crossing Expert |
| `keeper-save.svg` | Goalkeeper gloves deflecting a ball | Shot Stopper, Reflex King, Penalty Specialist, One-on-One |
| `sweeper-keeper.svg` | Keeper outside the box clearing forward | Sweeper Keeper |

## Keep Using Lucide

Do not generate custom versions of these:

- Upload, folder, link, download, edit, close
- Calendar, clock, location, stadium
- Shield, trophy, star, award
- Megaphone, sparkles, clipboard
- Yellow/red cards using colored `Square`
- Pace using `Zap`
- Strength using `Dumbbell`
- Leadership and commanding presence using `Megaphone`
- Distribution using `Route`
- Footwork using `Footprints`
- Long throw using `Send`
- Cross collection using `Hand`
- Long shot using `Rocket`
- Availability trends using `TrendingUp`, `TrendingDown`, and `Minus`

## Integration Changes

- Add a typed `BrandedIcon` component with `name`, `size`, `className`, and optional `title`.
- Define `DumalaIconName` as a union of the 24 custom icon names.
- Convert source SVG path markup into an inline React registry; do not render source files through `<img>`.
- Replace `SpecialtyTrait.icon` emoji values with semantic icon keys. Player persistence is unaffected because saved players store trait labels, not icon artwork.
- Replace visible emoji icons first in Dashboard and PlayerComparer, then Roster, Schedule, Player Profile, Tactics, Training, and Standings.
- Use shared `Badge` variants when replacing emoji-based cards, MVP markers, registration states, and similar status pills.
- Preserve typographic Unicode such as bullets, arrows, en dashes, mathematical symbols, and ellipses.

## Test Plan

- Render all custom icons at 16px, 20px, and 24px in light and dark contexts.
- Verify `currentColor`, inherited sizing, and no clipping.
- Icons with a `title` expose an accessible label; decorative icons remain hidden from assistive technology.
- Audit UI source for remaining emoji used as icons, with an explicit whitelist for textual punctuation.
- Run `npm run lint`, `npm test`, `npm run build`, and `npm run verify:mobile-tablet`.
- Visually verify Dashboard, PlayerComparer, roster trait selection, player cards, schedule summaries, and profile statistics.

## Assumptions

- The first release contains exactly 24 custom icons.
- Individual SVG source files are retained as design assets.
- Lucide-compatible outline styling is mandatory.
- Related specialty traits intentionally reuse icons to create a coherent visual vocabulary.
