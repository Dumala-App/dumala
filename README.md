# Dumala

Dumala is a local-first football team management web application for coaches, managers, and grassroots club operators. It combines weekly club operations with structured player assessment across multiple local team workspaces in one browser.

The current commercial direction is to validate Dumala as a coach-first SaaS: affordable for individual coaches, stronger for clubs and academies that need shared operations, reporting, and a professional development record.

The coach-facing pitch page is available in the app at `#landing`.

## Current capabilities

- Team onboarding and club identity
- Navbar team switcher for adding, switching, renaming, importing, exporting, and removing local team workspaces
- Player and staff roster management
- Position-specific player cards, traits, measurements, and placeholders
- Match scheduling, availability, opponent context, notes, and result logging
- Automatic standings and player-stat updates
- Discipline records and Man of the Match history
- Position-aware tactics board, lineup auto-fill, fullscreen Match Layout, curated strategy cards, opponent formation simulation, and Shape Impact cues
- Weekly training planner with an 85-drill library, presets, week-by-week scheduling, development evidence, and reassessment planning
- FPRDS Assessment Center with Full and Quick assessments for verified rating updates
- Age-group and role-specific benchmarks, OVR scoring, history, and development plans
- Bulletins, product updates, feedback submission, and validated Full Workspace V4 backup/restore

## Navigation

The application is organized into five primary areas:

1. **Home**: Overview, Bulletins, and Game Week
2. **Squad**: Roster and staff
3. **Tactics**: Formation, lineup, matchup strategy, roles, notes, and match board
4. **Development**: Training and Assessments
5. **League & Updates**: League and Updates

## Local-first limitations

The beta stores team information and uploaded photos in browser `localStorage`.

- Each browser and website origin has its own set of local team workspaces.
- The top navbar can manage multiple teams in the same browser, but those teams are still local to that browser/origin.
- Clearing browser storage removes local data.
- Preview and production URLs do not share data.
- Testers cannot collaborate in the same team workspace yet.
- Export a Full Workspace V4 backup before changing browsers or clearing data.

## Run locally

Prerequisite: Node.js.

On Windows, double-click `runserver.bat`, or run:

```bash
npm install
npm run dev
```

## Install as an app

Dumala includes a web app manifest and install icons. Use **Install Dumala** in the workspace:

- Chrome or Edge uses the browser's native installation prompt when available.
- On iPhone or iPad, open Dumala in Safari and use **Share → Add to Home Screen**.

Dumala now installs a production service worker that caches the application shell, generated chunks, icons, logos, and local placeholder artwork. Once the production app has loaded successfully, it can reopen and refresh without a connection.

- Team records remain in browser `localStorage`; they are not copied into the service-worker cache.
- DM Sans and Manrope are bundled locally, so Dumala keeps its intended typography offline.
- Feedback delivery and external Unsplash resources still require internet access.
- New releases download in the background and wait for the user to choose **Update now**.
- Normal `npm run dev` sessions do not install a persistent service worker.

Open [http://localhost:3000](http://localhost:3000).

## Validate and build

```bash
npm run lint
npm test
npm run build
npm run verify:pwa
npm run verify:cloud-launch
```

The production-ready static site is generated in `dist/`. The PWA verifier inspects the generated service worker, starts a Vite production preview, and uses Playwright Chromium to confirm Dumala can reopen, traverse every core coaching area, preserve a seeded workspace, and refresh offline after an initial online load. The cloud-launch verifier checks Phase 3 approval artifacts, browser environment boundaries, and operations gates.

Physical-device completion is tracked in [Phase 1 Offline Device Validation](docs/PHASE_1_OFFLINE_DEVICE_VALIDATION.md).

Phase 2 mobile and tablet work follows the [Mobile and Tablet Support Contract](docs/PHASE_2_MOBILE_TABLET_SUPPORT.md).

GitHub Actions runs the same quality gate on every pull request and every push to `main`. A successful run also retains the generated `dist/` artifact for seven days. After a validated push to `main`, a separate production job deploys the exact merged revision to Vercel.

## Deployment

Dumala is a static Vite application. The private GitHub organization repository deploys to Vercel through GitHub Actions, so Vercel does not require direct access to the source repository:

- Framework: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none
- Production branch: protected `main`
- GitHub environment: `Production`
- Required environment secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`

Pull requests run validation without deployment credentials. Production deployment begins only after the required Quality Gate passes and the pull request is merged into `main`.

A traditional static host can also serve the application. Upload only the contents of `dist/`, not the source repository.

## Documentation

- [Product Requirements](docs/PRD.md)
- [MVP Definition](docs/MVP.md)
- [Feasibility Study](docs/DUMALA_FEASIBILITY_STUDY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [FPRDS Evidence-Based Development System](docs/FPRDS_EVIDENCE_BASED_DEVELOPMENT_SYSTEM.md)
- [Product Roadmap](docs/ROADMAP.md)
- [Codebase Audit](docs/AUDIT.md)
- [Delivery Tasks](docs/TASKS.md)
- [Assessment Drill Guide Prompts](docs/ASSESSMENT_DRILL_GUIDE_PROMPTS.md)
