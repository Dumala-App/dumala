# Phase 3 Launch Approval Runbook

Updated: 2026-06-25

Status: Required before production cloud data

## Purpose

This runbook converts the Phase 3 production gates into evidence that can be reviewed before Dumala stores real cloud data.

Phase 3 implementation is complete locally, but production cloud launch is blocked until each approval area below has evidence attached.

The machine-readable approval record is `docs/PHASE_3_PRODUCTION_APPROVAL_RECORD.json`.

Run `npm run verify:production-approval` before enabling production cloud data. The command must fail while any production approval field is still missing.

## Current Official Supabase Assumptions

These assumptions were checked against Supabase documentation on 2026-06-25:

- Supabase branches create separate environments with separate instances and API credentials; persistent branches are appropriate for staging or QA.
- Supabase API secret keys and legacy `service_role` keys are elevated backend-only credentials that bypass Row Level Security.
- Supabase daily backup retention depends on plan: Pro has 7 days, Team has 14 days, Enterprise can have up to 30 days.
- Point-in-Time Recovery is available as an add-on for Pro, Team, and Enterprise projects and provides finer restore granularity than daily backups.
- Free tier projects should maintain off-site logical exports with the Supabase CLI.

Source references:

- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/deployment/managing-environments
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/platform/access-control
- https://supabase.com/docs/guides/platform/backups

## Approval Checklist

| Gate | Required Evidence | Owner | Status |
| --- | --- | --- | --- |
| Staging and production separation | Project refs, regions, URLs, redirect URLs, and branch strategy recorded | Product/Engineering | Pending |
| Production environment access controls | Supabase org/project roles and Vercel project/env access reviewed | Engineering | Pending |
| RLS isolation tests | `npm run supabase:reset` and `npm run supabase:test` pass locally; staging run attached | Engineering | Pending |
| Provider backup settings | Plan, daily retention, PITR decision, object storage backup scope, and off-site logical export location recorded | Product/Engineering | Pending |
| Restore drill evidence | Completed restore drill report attached using the template below | Engineering | Pending |
| Privacy review | Player/staff/minor data handling, export/deletion wording, and support access approved | Product/Privacy | Pending |
| Diagnostic boundary approval | Redacted diagnostic fields approved; forbidden fields reviewed | Product/Support | Pending |
| Incident and key rotation runbooks | Contact path, severity levels, service-key rotation, JWT rotation, and rollback steps approved | Engineering/Product | Pending |

## Environment Separation Evidence

Record one row per environment.

| Environment | Supabase Project Ref | Region | Vercel Environment | Allowed Redirect URLs | Data Policy |
| --- | --- | --- | --- | --- | --- |
| Local | `dumala` local stack | developer machine | local `.env.local` | `http://localhost:3000`, `http://127.0.0.1:3000` | Synthetic/local only |
| Staging | TBD | TBD | Preview/Staging | TBD | Synthetic or explicitly approved test data only |
| Production | TBD | TBD | Production | TBD | Real user data only after all gates pass |

Rules:

- Production data must never be copied into local development.
- Staging must use synthetic or explicitly approved test data.
- If staging is waived for an initial private beta, the waiver must be recorded in `docs/PHASE_3_PRODUCTION_APPROVAL_RECORD.json` with an approver, date, and reason.
- Production service-role, secret, database, and management API credentials must not be present in browser bundles or local example files.
- Use separate Supabase credentials per environment.

## Access Control Evidence

Record the people or teams with access before launch.

| System | Access Level | People/Teams | Justification | Review Date |
| --- | --- | --- | --- | --- |
| Supabase organization owner | Owner | TBD | Account ownership and billing | TBD |
| Supabase production project | Administrator/Developer/Read-only | TBD | Least privilege | TBD |
| Vercel production project | Admin/Developer | TBD | Deployment and env management | TBD |
| GitHub repository secrets | Admin/Actions access | TBD | CI/CD only | TBD |

Minimum rules:

- Browser-exposed values may include only publishable Supabase keys and public project URLs.
- Secret keys, legacy service-role keys, JWT secrets, database URLs, and Supabase access tokens must live only in approved backend or CI secret stores.
- Any read of production secrets requires an operational reason and should be reviewed.

## RLS Isolation Evidence

Local command:

```bash
npm run supabase:reset
npm run supabase:test
```

Required result:

- user can read their own profile
- user cannot read another user's profile
- member can read their own active club
- member cannot read another club
- member can insert domain rows only for their club
- member cannot insert audit events for another club

Attach the command output in release evidence.

## Backup Setting Evidence

| Item | Decision |
| --- | --- |
| Supabase plan | TBD |
| Daily backup retention | TBD |
| PITR enabled | TBD |
| PITR retention window | TBD |
| Logical export cadence | TBD |
| Logical export storage location | TBD |
| Object storage backup needed | TBD |
| RPO | Early beta target: 24 hours or better |
| RTO | Early beta target: one business day or better |

Do not launch production cloud data on a free-tier project unless off-site logical exports are approved and tested.

## Restore Drill Evidence Template

| Field | Value |
| --- | --- |
| Source backup timestamp | TBD |
| Restore environment | TBD |
| Operator | TBD |
| Started at | TBD |
| Completed at | TBD |
| Duration | TBD |
| Schema migration validation | Pass/Fail |
| RLS isolation tests | Pass/Fail |
| Sample club counts | Pass/Fail |
| Domain integrity | Pass/Fail |
| Sync cursor integrity | Pass/Fail |
| Export generation | Pass/Fail |
| Issues found | TBD |
| Follow-up actions | TBD |

The restore drill is not accepted until every check passes or has an approved risk exception.

## Privacy Review Template

| Review Item | Decision |
| --- | --- |
| Minor/player data fields approved | TBD |
| Staff contact fields approved | TBD |
| Payment ledger export wording approved | TBD |
| Assessment export wording approved | TBD |
| Support access boundaries approved | TBD |
| Account deletion copy approved | TBD |
| Club deletion recovery window approved | TBD |
| Account deletion recovery window approved | TBD |
| Audit retention approved | TBD |

## Diagnostic Boundary Approval

Approved by default:

- app version
- browser family and platform class
- cloud feature flag state
- sync state
- pending mutation counts by entity type
- conflict counts by type
- stable error codes
- storage quota estimate
- migration state and stable failure code

Forbidden by default:

- auth tokens
- OTP or magic-link payloads
- Supabase secret, service-role, JWT, database, or management API credentials
- player names
- staff names or contact details
- private note contents
- assessment raw values
- payment amounts, methods, and references
- full workspace backup payloads

## Incident Response Runbook

Severity levels:

| Severity | Examples | Initial Response |
| --- | --- | --- |
| SEV-1 | Suspected credential exposure, cross-club data access, data loss | Disable affected sync path, rotate keys, preserve evidence, notify owner |
| SEV-2 | Repeated migration failures, export failures, restore failure | Pause rollout, investigate logs, publish support guidance |
| SEV-3 | Local-only diagnostics issue, non-sensitive telemetry gap | Fix in normal release cycle |

Immediate actions for suspected credential exposure:

1. Stop affected deployments or disable cloud feature flag.
2. Rotate exposed Supabase secret/service-role credentials.
3. Rotate Vercel/GitHub secrets that could have exposed the key.
4. Review audit logs and deployment history.
5. Run RLS isolation tests.
6. Document timeline, user impact, and follow-up actions.

## Key Rotation Runbook

| Key Type | Storage Location | Rotation Trigger | Rotation Steps |
| --- | --- | --- | --- |
| Supabase publishable key | Vercel env, local `.env.local` | Project migration or suspected exposure | Create/confirm replacement, update env, redeploy |
| Supabase secret/service-role key | Backend/CI secret store only | Any exposure, staff change, scheduled review | Generate replacement, update backend/CI, revoke old key, verify no browser bundle exposure |
| Supabase JWT secret | Supabase project settings | Suspected signing-secret exposure | Schedule maintenance, rotate, force session refresh/sign-out as needed |
| Database password | Supabase project settings/secret store | Exposure, staff change, scheduled review | Rotate password, update migrations/CI/admin tools |
| Supabase access token | Developer or CI secret store | Staff change or exposure | Revoke token, create scoped replacement |

## Final Approval

Launch approval requires:

1. All approval checklist rows marked approved.
2. `npm run supabase:test` passing locally and in staging.
3. Restore drill evidence attached.
4. Production secrets reviewed for browser exposure.
5. Product owner signs off that cloud rollout can begin with private beta users.
6. `npm run verify:production-approval` passes.
