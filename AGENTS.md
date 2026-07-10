# Repository Agent Instructions

## Repository Overview

Dumala is a local-first football team management web application for coaches, managers, and grassroots club operators. It is a React 19, TypeScript, and Vite single-page app with Tailwind CSS, Vitest tests, a production PWA build, and a Supabase cloud-sync foundation.

Important areas:

- `src/App.tsx`: application shell, onboarding, navigation, team state, persistence orchestration, backup and restore entry points
- `src/components/`: user-facing workflows and feature views
- `src/cloud/`: Supabase runtime config, identity, authorization, and data access helpers
- `src/persistence/`, `src/integrity/`, and feature modules under `src/`: local-first storage, validation, and domain logic
- `supabase/migrations/`: schema, RLS, grants, functions, and data policies
- `supabase/tests/`: database and authorization tests
- `scripts/`: release, PWA, cloud launch, mobile/tablet, and production approval verification
- `docs/`: architecture, roadmap, runbooks, launch gates, and product requirements

## Required Commands

Install dependencies:

```bash
npm ci
```

Development:

```bash
npm run dev
```

Core validation:

```bash
npm run lint
npm test
npm run build
```

Broader quality gate:

```bash
npm run verify:quality
```

Focused verification:

```bash
npm run verify:pwa
npm run verify:cloud-launch
npm run verify:mobile-tablet
```

Supabase local development:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:stop
```

`npm run supabase:start`, `npm run supabase:reset`, and `npm run supabase:test` require Docker Desktop or a compatible Docker runtime.

## Audit And Fix Workflow

For repository audits:

1. Use `bug_hunter` and `security_auditor` as separate read-only agents.
2. Wait for both agents to finish.
3. Deduplicate and rank findings by severity, exploitability or user impact, and confidence.
4. Do not edit code for speculative findings.
5. Present confirmed or strongly evidenced findings before implementation.
6. Use only `fixer` to modify files.
7. Make one logically isolated fix at a time.
8. Add or update regression tests where practical.
9. After each fix, use a fresh `fix_verifier` agent.
10. The verifier must inspect the actual diff against the base branch.
11. A rejected or inconclusive fix must return to the fixer.
12. Never push, merge, or commit directly to `main`.

Useful audit prompt:

```text
Audit this repository against the current main branch.

Follow the workflow in AGENTS.md.

1. Spawn bug_hunter to inspect correctness, runtime bugs, race conditions,
   database behavior, API contracts, persistence, backup/restore, and missing edge cases.
2. Spawn security_auditor separately to inspect authentication, authorization,
   secrets, injection, data exposure, Supabase RLS, file handling, PWA caching,
   tenant isolation, and browser-exposed environment variables.
3. Wait for both agents.
4. Deduplicate the findings and rank them by severity and confidence.
5. Do not edit anything yet.
6. Show only confirmed or strongly evidenced findings, including file paths,
   reproduction paths, impact, and recommended tests.
```

Useful fix prompt:

```text
Fix the confirmed critical and high-severity findings.

Use the fixer agent for implementation.
Make one logically isolated fix at a time.
Add regression tests.
Run the relevant tests, lint, type checking, and build.
Do not commit or push.
```

Useful verification prompt:

```text
Spawn a fresh fix_verifier agent.

Give it the original findings and the complete diff against main.
It must independently verify the fixes, look for bypasses and regressions,
inspect whether tests fail without the fix when practical, and return a strict verdict.

Do not allow the fixer agent to verify its own work.
Do not edit files during verification.
```

## Engineering Rules

- Work only on a dedicated branch.
- Never force-push.
- Never bypass hooks or checks with `--no-verify`.
- Never modify or delete unrelated working-tree changes.
- Never commit secrets, `.env` files, generated credentials, private keys, or production tokens.
- Keep browser-exposed environment variables restricted to approved `VITE_` values.
- Preserve local-first data compatibility and backup import/export behavior unless the task explicitly changes it.
- Preserve Supabase RLS, grants, tenant isolation, and security-definer safety when editing migrations or functions.
- Keep PWA behavior from caching private API, auth, uploaded private data, or future sensitive endpoints.
- Human approval is required before merge.
- `main` must remain protected through GitHub branch protection.

## Definition Of Done

A finding is resolved only when:

- the root cause is addressed
- a regression test exists where practical
- relevant tests pass
- `npm run lint` passes when TypeScript is affected
- `npm run build` passes when build or app behavior is affected
- relevant Supabase tests pass when database policies, functions, or migrations are affected
- relevant verification scripts pass when PWA, cloud launch, production approval, or responsive behavior is affected
- the independent verifier returns `VERIFIED` or `VERIFIED WITH MINOR CONCERNS`
- the final diff contains no unrelated changes
