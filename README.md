# Stack Team Manager

A local-first sports club management web application for running a single team from one browser workspace. Built with React 19, TypeScript, Tailwind CSS v4, and Lucide icons.

## What it does

- Set up a club, manager profile, and initial standings
- Manage players and staff with photos, positions, attributes, and statistics
- Track fixtures, training, meetings, availability, tactical notes, and results
- Maintain league standings, discipline history, and match awards
- Build weekly plans from a 52-drill training library
- Create tactics, lineups, announcements, and JSON backups

## Data and testing limitations

This MVP has no accounts, database, or shared team workspace. All team information and uploaded photos are stored in the current browser's `localStorage`.

- Each browser and device has its own independent team data.
- Clearing browser storage removes the local workspace.
- Preview and production URLs have separate browser storage.
- Export a JSON backup before clearing data or changing browsers, then restore it from the Roster screen.
- Anyone with the deployed URL can open the app, even when its source repository is private.

## Run locally

**Prerequisite:** Node.js

On Windows, double-click `runserver.bat`, or run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run lint
npm run build
```

The static production site is written to `dist/`.

## Deploy with Vercel

The recommended testing workflow is a private GitHub repository connected to Vercel:

1. Push the project to a private GitHub repository.
2. Import that repository in Vercel.
3. Select the Vite framework preset.
4. Use `npm install`, `npm run build`, and output directory `dist`.
5. Share only the stable production `vercel.app` URL with testers.

The included `vercel.json` records these build settings. No environment variables are required.

## Traditional hosting

A normal static web host also works. Run `npm run build`, then upload the **contents of `dist/`** to the host's public web directory. Do not upload the source folder, `src/`, or `node_modules/` as the website.

## Documentation

- [PRD](docs/PRD.md)
- [MVP](docs/MVP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Audit](docs/AUDIT.md)
- [Tasks](docs/TASKS.md)
