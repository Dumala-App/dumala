# Dumala shadcn/ui Adoption Plan

## Summary

Adopt shadcn/ui gradually to make Dumala's interface more consistent, accessible, and maintainable without replacing Tailwind or Lucide. Tailwind remains the styling layer, Lucide remains the generic icon system, and a small custom Dumala SVG set adds coaching-specific identity.

The migration should start with shared primitives used across many screens: buttons, tabs, dialogs, forms, tooltips, and status/alert patterns. Existing app behavior, storage, routing, PWA behavior, and feature logic should remain unchanged.

## Design Direction

- Target style: professional coaching operations dashboard.
- Keep the UI calm, dense, and scannable rather than turning it into a marketing page or highly decorative sports-game interface.
- Use shadcn/ui for consistent interaction patterns and accessibility.
- Use Lucide for generic action icons such as add, edit, search, upload, download, reset, menu, close, save, filter, calendar, and warning.
- Use custom Dumala SVG icons only for branded product concepts such as Match Day, Squad Board, Tactics Pitch, Training Load, Assessment Radar, League Table, Payments Ledger, Local Backup, and Club Bulletin.

## Key Changes

- Add shadcn/ui-compatible project setup for the existing Vite React Tailwind app.
- Introduce a `src/components/ui/` layer for reusable components.
- Add `components.json` and configure aliases to match the current project structure.
- Add or confirm required utilities such as `cn`.
- Start with shadcn/ui components that directly replace repeated hand-built patterns:
  - `button`
  - `tabs`
  - `dialog`
  - `alert-dialog`
  - `input`
  - `label`
  - `textarea`
  - `select`
  - `tooltip`
  - `popover`
  - `dropdown-menu`
  - `badge`
  - `card`
  - `table`
  - `separator`
  - `sheet`
- Keep component adoption incremental. Do not rewrite every screen at once.

## Implementation Plan

1. **Foundation Setup**
   - Add shadcn/ui configuration for Vite React.
   - Confirm Tailwind 4 compatibility and use the project's existing CSS/token approach.
   - Add `cn` helper if not already present.
   - Add base UI components under `src/components/ui/`.
   - Preserve existing fonts: DM Sans and Manrope.

2. **Core Primitive Migration**
   - Replace repeated custom tab pills in Home, Development, and League/Updates with a shared shadcn-based tab or segmented control pattern.
   - Replace common button styles with shadcn `Button` variants:
     - `default`
     - `secondary`
     - `outline`
     - `ghost`
     - `destructive`
     - `link`
   - Introduce consistent icon button sizing using Lucide icons.
   - Add tooltips for icon-only or compact controls.

3. **Dialogs And Sheets**
   - Convert reset confirmation, profile modals, feedback modal, and important confirmation flows to shadcn `Dialog` or `AlertDialog`.
   - Use `Sheet` for mobile navigation, filters, and dense side panels where appropriate.
   - Ensure focus trapping, escape behavior, labels, descriptions, and keyboard navigation remain correct.

4. **Forms And Validation**
   - Standardize inputs, labels, descriptions, errors, selects, textareas, and field spacing.
   - Prioritize forms in:
     - roster player creation
     - staff creation
     - schedule/result entry
     - assessment forms
     - training planner controls
     - backup/import flows
   - Keep current validation logic, but render errors through consistent form components.

5. **Tables And Dense Data**
   - Use shadcn table patterns for standings, payments ledger, history views, and admin-style records.
   - Preserve mobile/tablet behavior, including horizontal scrolling and sticky columns where already useful.
   - Improve alignment, row hover states, empty states, and action menus.

6. **Dumala Custom Icon Layer**
   - Add a `BrandedIcon` component with `name`, `size`, `className`, and optional `title`.
   - Use inline SVG with `currentColor`, 24x24 viewBox, rounded line caps, and consistent stroke width.
   - Keep custom icons small and semantic. Do not recreate generic Lucide actions.
   - Use custom icons in navigation, section headers, empty states, and major feature cards.

7. **Screen-by-Screen Rollout**
   - Phase 1: App shell, navigation, quick status drawer, shared tabs, and buttons.
   - Phase 2: Dashboard cards, status chips, leaderboards, and empty states.
   - Phase 3: Roster forms, player cards, payments panel, and backup/import controls.
   - Phase 4: Tactics board panels, notes, role selectors, and mobile controls.
   - Phase 5: Training, assessments, standings, bulletins, and updates.

## Component Policy

- shadcn/ui components should live in `src/components/ui/`.
- Dumala-specific composed components should live near current app components or in a shared local folder only when reused.
- Prefer composition over deep customization.
- Do not import from a fake `@shadcn/ui` package. shadcn/ui components are copied into the repo and owned by the app.
- Keep Radix accessibility behavior intact.
- Keep Tailwind classes token-oriented and consistent.
- Do not introduce DaisyUI or another competing component system.

## Icon Policy

- Lucide:
  - Generic UI actions.
  - Controls and toolbar commands.
  - Standard interface objects.
- Custom Dumala SVG:
  - Product areas.
  - Coaching concepts.
  - Branded empty states.
  - Feature identity moments.
- Avoid:
  - emoji as UI icons
  - inconsistent icon stroke weights
  - large decorative icons that reduce scanability
  - replacing text labels with icons where clarity matters

## Testing And Verification

- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Run `npm run verify:mobile-tablet` after layout changes.
- Manually verify:
  - desktop navigation
  - mobile navigation
  - Home tabs
  - Development tabs
  - League/Updates tabs
  - roster add-player form
  - reset confirmation dialog
  - player/staff modals
  - standings table
  - payments table
  - training planner
  - tactics board
- Check keyboard navigation, focus states, dialog focus trapping, tooltip behavior, color contrast, disabled states, empty states, and long text wrapping.

## Acceptance Criteria

- Dumala has a consistent shared UI component layer.
- Repeated hand-built tab, button, dialog, and form patterns are reduced.
- Lucide and custom Dumala SVG icons have clear separate roles.
- No feature behavior, saved data format, PWA behavior, or persistence logic changes unintentionally.
- Main workflows remain usable on mobile and tablet.
- The app builds and passes existing tests.

## Assumptions

- Tailwind remains the primary styling system.
- shadcn/ui is adopted gradually instead of through a full visual rewrite.
- Lucide remains installed and continues to be used.
- Custom SVG icons are implemented as React components, not generated as separate image files unless a future design pass requires asset files.
- The first implementation target should be the app shell and shared primitives, not the whole application at once.
