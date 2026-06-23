# Phase 2 Mobile and Tablet Support Contract

Updated: 2026-06-23

## Purpose

This contract defines the viewport, touch, and verification targets for Phase 2 before the dense table, form, and tactics-board redesign work begins. It keeps Phase 2 focused on real coaching workflows instead of device-name guessing.

## Supported viewport bands

| Band | CSS viewport width | Primary use | Support target |
| --- | ---: | --- | --- |
| Compact phone | 360-479 px | quick lookup, bulletins, simple edits, match-day checks | Supported for core read and short-form actions |
| Large phone | 480-767 px | roster lookup, schedule edits, assessment entry | Supported for primary workflows with stacked layouts |
| Tablet portrait | 768-1023 px | training, assessments, roster management, schedule updates | Primary Phase 2 target |
| Tablet landscape | 1024-1366 px | tactics board, dense forms, tables, comparison workflows | Primary Phase 2 target |
| Desktop | 1367 px and wider | full management workflows | Must not regress while tablet work lands |

The minimum supported width remains 360 CSS pixels. Layouts may scroll vertically, but primary actions must not require horizontal page scrolling outside intentionally scrollable tables or boards.

## Touch target standard

- Primary buttons, icon buttons, tabs, segmented controls, menu items, and row actions should expose at least a 44 by 44 CSS pixel activation area.
- Destructive or high-risk actions should use at least 48 by 48 CSS pixels when space allows.
- Adjacent touch targets should keep at least 8 CSS pixels of separation unless they are grouped controls with clear visual boundaries.
- Inputs, selects, textareas, and date/time controls should be at least 44 CSS pixels tall on compact and tablet widths.
- Drag handles and board pieces should be operable by touch without requiring pixel-perfect placement.
- Hover-only affordances must have a visible touch equivalent.

## Workflow expectations

### Navigation

- The five primary areas remain available within one tap from the mobile menu or tablet shell.
- Nested tabs remain visible or reachable without requiring the user to remember hidden routes.
- Opening and closing menus must preserve focus and not shift the underlying page unexpectedly.

### Dense data

- Tables may use horizontal scrolling only when row comparison is the main task.
- Row actions should remain attached to their row when a table scrolls horizontally.
- Important identifiers, such as player names and opponent names, should remain visible at compact widths.

### Forms

- Required fields, errors, and save actions must remain visible in the same task flow.
- Numeric assessment entry should favor direct entry with clear units and constraints.
- Virtual keyboards must not hide the active field, validation message, or primary save action.

### Tactics board

- Player dragging, selection, and note entry must work with touch and pointer input.
- Tablet landscape is the target layout for tactical editing.
- Compact phones may prioritize viewing and simple assignment over full drawing comfort.

## Verification matrix

Run these checks before marking a Phase 2 mobile/tablet task complete:

```bash
npm run build
npm run verify:mobile-tablet
```

| Width | Orientation | Required coverage |
| ---: | --- | --- |
| 360 px | portrait | navigation, roster lookup, bulletin read/create, basic schedule edit |
| 390 px | portrait | iPhone-sized primary workflow smoke |
| 768 px | portrait | roster/profile editing, assessments, training planner |
| 820 px | portrait | iPad/tablet portrait workflow smoke |
| 1024 px | landscape | tactics board, standings, dense forms, comparison panels |
| 1280 px | landscape | Android tablet landscape workflow smoke |

Automated checks can prove layout and interaction invariants, but Phase 2 completion still needs a manual pass on at least one Android tablet-class device before Google Play packaging begins.

The automated mobile/tablet verifier rotates phone and tablet viewports, exercises the tactics board after rotation, focuses roster, schedule, and assessment fields under a reduced-height keyboard viewport, and checks that focused fields and save actions remain reachable without page-level horizontal overflow. It does not replace a real iOS or Android keyboard pass because browser engines control the actual virtual keyboard overlay.

## Acceptance rule

The first Phase 2 task is complete when this support contract is published and linked from the roadmap. Later Phase 2 tasks must either satisfy these standards or update this contract with an explicit product decision.
