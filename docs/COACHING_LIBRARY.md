# Coaching Library — Content Guide

Updated: 2026-07-09

The Coaching Library (Tactics page → "Coaching Library" section) is a text-first reading
room for coaches: long-form articles on coaching philosophies, club identities, formations,
game principles, and coaching craft. This document explains how the content is structured
and how to add or update articles without touching any UI code.

## Where the content lives

```txt
src/knowledge/library/
  types.ts            # LibraryArticle type and category union
  philosophies.ts     # Coaching Philosophies (Michels, Cruyff, Sacchi, ...)
  clubDna.ts          # Club & National Identities (Ajax, La Masia, Spain 08-12, ...)
  formations.ts       # Formations & Systems (4-4-2, 4-3-3, back threes, ...)
  principles.ts       # Game Principles (pressing, build-up, transitions, ...)
  coachingCraft.ts    # Coaching Craft (session design, youth development, ...)
  index.ts            # Aggregation, category labels/order, reading time, search
  library.test.ts     # Data validation tests
```

The UI (`src/components/CoachKnowledgeBase.tsx`) renders whatever these files export.
Adding an article requires **zero component changes**.

## The article model

Each article is a `LibraryArticle`:

- `id` — stable, unique, kebab-case, prefixed by category (e.g. `philosophy-klopp-gegenpressing`).
- `category` — one of `philosophy | club-dna | formations | principles | coaching-craft`.
- `title` / `subtitle` — the headline and the one-sentence promise of the article.
- `era` / `origin` — optional context metadata shown in the reader header.
- `tags` — used by search; at least two.
- `sections` — the body. Each section has a `heading`, `paragraphs` (real prose, not
  fragments), and optional `bullets` for scannable lists.
- `keyIdeas` — 3-4 takeaways, shown in the green panel.
- `trainingIdeas` — optional "On the Training Pitch" panel: how to coach the idea.
- `references` — optional further-reading links (https only).
- `diagramId` — optional link to a legacy diagram in `src/knowledge/coachingLibrary.ts`;
  rendered collapsed at the bottom of the reader. Text stays primary.
- `status` — `draft` articles are excluded from the UI until promoted to `active`.
- `updatedOn` — ISO date (`YYYY-MM-DD`) of the last content revision.

## Adding or updating an article

1. Pick the category file (or create a new one and register it in `index.ts`).
2. Write the article following the model above. Aim for 3-5 sections and a 3-6 minute
   read (the validation test enforces minimum substance: 3+ sections, paragraphs of
   real length, 3+ key ideas).
3. Set `status: 'draft'` while writing if you want it merged but hidden; flip to
   `'active'` when reviewed.
4. Bump `updatedOn`.
5. Run `npx vitest run src/knowledge/library` — the validation suite catches duplicate
   ids, thin content, bad dates, broken diagram references, and non-https links.

## Editorial guidelines

- Write for a grassroots coach reading on a phone between sessions: plain language,
  concrete examples, no unexplained jargon.
- Every article should end usable: the "What grassroots coaches can take" pattern and
  `trainingIdeas` exist so knowledge converts into next-session actions.
- Claims about coaches/eras should be verifiable history, not fan lore; keep numbers
  approximate where sources vary ("multiple league titles") rather than precise and wrong.
- Facts and philosophy over illustration: diagrams are optional supporting material.

## Adding a new category

1. Extend the `LibraryCategory` union in `types.ts`.
2. Add the label, description, and order entry in `index.ts`.
3. Add an accent color for the badge in `CoachKnowledgeBase.tsx` (`CATEGORY_ACCENTS`) —
   this is the only UI touch a new category needs.

## Future directions (not built yet)

- Move article data to JSON + zod schema if non-developers need to edit content.
- Bookmarks / "mark as read" persistence per coach.
- Cross-links from Strategy Engine recommendations to relevant library articles
  (e.g. recommending High Press links to the pressing principles article).
- Search across full body text (currently title/subtitle/tags/headings/origin).
