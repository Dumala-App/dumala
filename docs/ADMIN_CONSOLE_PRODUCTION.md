# Dumala Admin Console Production

Updated: 2026-06-28

## Production Access

The private console uses the same production origin as Dumala:

```text
https://dumala.asia/#admin
```

It is not linked from coach or team navigation. Access requires both a valid Supabase session and an active row in `public.app_admins`.

## Required Production Configuration

### GitHub Production environment secrets

Add these in GitHub repository settings under **Environments > Production > Environment secrets**:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

`SUPABASE_ACCESS_TOKEN` is a Supabase personal access token used only by GitHub Actions. `SUPABASE_DB_PASSWORD` is the database password for project `radvesnnkqyqzhakfokd`. Neither value may use a `VITE_` prefix or enter the browser bundle.

### Vercel production variables

Configure these public browser values in the Vercel Production environment:

```text
VITE_DUMALA_CLOUD_ENABLED=true
VITE_SUPABASE_URL=https://radvesnnkqyqzhakfokd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<production publishable key>
```

### Supabase Auth URLs

Keep the production site URL and redirect allowlist aligned with:

```text
https://dumala.asia/
https://dumala.vercel.app/
```

## Grant The First Owner

1. Sign in to Dumala once with the owner's email so the Supabase Auth user exists.
2. Copy that user's UUID from **Supabase Dashboard > Authentication > Users**.
3. Run this in the production SQL editor:

```sql
insert into public.app_admins (user_id, role, notes)
values ('OWNER_AUTH_USER_UUID', 'owner', 'Initial Dumala app owner')
on conflict (user_id) do update
set role = 'owner', revoked_at = null, notes = excluded.notes;
```

Do not grant app-owner access through club membership roles. `app_admins` is intentionally separate.

## Release Order

Pushes to `main` use `.github/workflows/quality-gate.yml` and run in this order:

1. TypeScript, unit tests, production build, PWA verification, and cloud boundary verification.
2. Link the recorded production Supabase project and preview pending migrations.
3. Apply pending migrations with `supabase db push --linked`.
4. Build and deploy the validated revision to Vercel production.

Vercel does not deploy when the database migration job fails.

## Smoke Test

After deployment:

1. Open `https://dumala.asia/#admin` in a private browser window.
2. Confirm signed-out users see only the cloud account gate.
3. Sign in with a normal coach account and confirm access is denied.
4. Sign in with the owner account and confirm all six tabs load.
5. Submit one anonymized FPRDS assessment from a coach account.
6. Confirm it appears in **FPRDS Beta**, open it, record a decision, and refresh.
7. Submit feedback and confirm its status and private admin notes persist.
8. Confirm **Online** updates after an app heartbeat and no browser console errors appear.

## Current Scope

Usage analytics, feedback triage, FPRDS review, online presence, and provider-neutral billing records are production-ready for the owner-operated private beta. Stripe or PayPal checkout and webhooks remain a separate future integration and must run server-side.
