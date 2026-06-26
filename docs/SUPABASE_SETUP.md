# Supabase Setup

Updated: 2026-06-25

Status: Local project scaffolded and verified with Docker Desktop.

## Current Repo Setup

The repository now includes:

- `supabase/config.toml`
- `supabase/seed.sql`
- `supabase/migrations/202606250001_cloud_foundation.sql`
- `@supabase/supabase-js`
- `supabase` CLI dev dependency
- cloud environment parsing in `src/cloud/`
- cloud import, lifecycle, and operations guardrails in `src/cloud/`
- `.env.example`

Cloud sync remains disabled unless `VITE_DUMALA_CLOUD_ENABLED=true`.

## Local Environment

Copy `.env.example` to `.env.local` and fill in values after `supabase start` prints local credentials:

```text
VITE_DUMALA_CLOUD_ENABLED=false
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
```

Do not commit `.env.local`.

Only these `VITE_` variables are approved for browser exposure. `npm run verify:cloud-launch` fails if the env template, Vite typings, cloud config, or setup docs add secret-shaped or unapproved browser variables.

## Local Commands

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:stop
```

`supabase start` requires Docker Desktop or another compatible Docker runtime.

## First Local Validation

After Docker is running:

1. Run `npm run supabase:start`.
2. Copy the local Project URL and publishable key into `.env.local`.
3. Run `npm run supabase:reset` to apply migrations from a clean local database.
4. Run `npm run lint`.
5. Run `npm run test`.
6. Run `npm run build`.
7. Run `npm run verify:pwa`.
8. Run `npm run supabase:test`.
9. Run `npm run verify:cloud-launch`.

Production-only approval check:

```bash
npm run verify:production-approval
```

This command is expected to fail until `docs/PHASE_3_PRODUCTION_APPROVAL_RECORD.json` contains real staging/production project refs, access-control owners, backup settings, restore drill evidence, privacy approval, diagnostic approval, incident/key-rotation owners, and final signoff.

Current local endpoints after `supabase start`:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Remote Project Notes

Remote Supabase projects should be separate for staging and production.

Before production cloud data:

- confirm Supabase project region and backup tier
- configure production SMTP for Auth
- configure allowed redirect URLs
- store publishable values in Vercel environment variables
- never expose service-role or secret keys to the browser
- run RLS isolation tests
- run audit metadata redaction tests
- complete export and deletion tests
- complete a restore drill
- complete `docs/PHASE_3_PRODUCTION_APPROVAL_RECORD.json`
- pass `npm run verify:production-approval`

## Current Local Note

Docker Desktop is running and the local stack has been verified with `npm run supabase:reset`.

On Windows, the local `supabase_vector` logging sidecar may restart while core Supabase services remain healthy. Treat database, Auth, API, Studio, and storage health as the blocking local-development signals unless log shipping itself is under test.
