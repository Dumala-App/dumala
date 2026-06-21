# Dumala

Dumala is a local-first football team management web application for coaches, managers, and grassroots club operators. It combines weekly club operations with structured player assessment in one browser workspace.

## Current capabilities

- Team onboarding and club identity
- Player and staff roster management
- Position-specific player cards, traits, measurements, and placeholders
- Match scheduling, availability, opponent context, notes, and result logging
- Automatic standings and player-stat updates
- Discipline records and Man of the Match history
- Position-aware tactics board and lineup auto-fill
- Weekly training planner with a 52-drill library and presets
- FPRDS Assessment Center with Full and Quick assessments
- Age-group and role-specific benchmarks, OVR scoring, history, and development plans
- Bulletins, product updates, feedback submission, and validated Full Workspace V2 backup/restore

## Navigation

The application is organized into five primary areas:

1. **Home**: Overview and Game Week
2. **Squad**: Roster and staff
3. **Tactics**: Formation, lineup, roles, notes, and match board
4. **Development**: Training and Assessments
5. **League & Updates**: League, Bulletins, and Updates

## Local-first limitations

The beta stores team information and uploaded photos in browser `localStorage`.

- Each browser and website origin has a separate workspace.
- Clearing browser storage removes local data.
- Preview and production URLs do not share data.
- Testers cannot collaborate in the same workspace yet.
- Export a Full Workspace V2 backup before changing browsers or clearing data.

## Run locally

Prerequisite: Node.js.

On Windows, double-click `runserver.bat`, or run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate and build

```bash
npm run lint
npm run build
```

The production-ready static site is generated in `dist/`.

## Deployment

Dumala is a static Vite application. The recommended beta deployment uses a private GitHub repository connected to Vercel:

- Framework: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

A traditional static host can also serve the application. Upload only the contents of `dist/`, not the source repository.

## Documentation

- [Product Requirements](docs/PRD.md)
- [MVP Definition](docs/MVP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Product Roadmap](docs/ROADMAP.md)
- [Codebase Audit](docs/AUDIT.md)
- [Delivery Tasks](docs/TASKS.md)
- [Assessment Drill Guide Prompts](docs/ASSESSMENT_DRILL_GUIDE_PROMPTS.md)
