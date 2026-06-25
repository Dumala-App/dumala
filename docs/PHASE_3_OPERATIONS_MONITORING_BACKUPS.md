# Phase 3 Operations, Monitoring, Audit Logging, and Backups

Updated: 2026-06-25

Status: Accepted design baseline before production cloud data

Related docs:

- `docs/ADR_PHASE_3_CLOUD_PLATFORM.md`
- `docs/PHASE_3_DURABLE_SCHEMA_DESIGN.md`
- `docs/PHASE_3_LOCAL_TO_CLOUD_MIGRATION.md`
- `docs/PHASE_3_OFFLINE_MUTATION_QUEUE.md`
- `docs/PHASE_3_ACCOUNT_LIFECYCLE.md`

## 1. Purpose

This document defines the operational controls required before Dumala stores production cloud data. Phase 3 introduces accounts, private club records, synchronization, and data lifecycle workflows, so the service needs monitoring, redacted diagnostics, audit logging, backup procedures, and tested restore drills before launch.

## 2. Principles

1. Measure service health without collecting private workspace contents.
2. Treat audit logs as security and lifecycle evidence, not activity feeds.
3. Backups are not proven until a restore has been tested.
4. Production cloud data requires environment separation and least privilege.
5. Diagnostics must be useful for support without exposing player, assessment, note, or payment details by default.

## 3. Environments

Use separate Supabase projects and Vercel environment configuration for:

- local development
- staging
- production

Rules:

- No production personal data in local development or automated tests.
- Staging should use synthetic or explicitly approved test data.
- Production service-role credentials never appear in browser bundles.
- Pull-request builds cannot access production secrets.
- Environment variables should be documented before provisioning.

## 4. Operational Metrics

Track these metrics with privacy-minimized labels.

| Area | Metric |
| --- | --- |
| Auth | OTP or magic-link request count, sign-in success rate, sign-in failure rate |
| Migration | migration started, completed, failed, average duration, failure code counts |
| Sync | push success rate, pull success rate, queued mutation count, oldest queued mutation age |
| Conflicts | conflict count by entity type and conflict type |
| API | request latency, error rate, retryable failure rate, permanent failure rate |
| Database | storage usage, connection pressure, slow query count, failed constraint count |
| Authorization | RLS deny count, function access denial count |
| Exports | export requested, export completed, export failed |
| Deletion | deletion requested, cancelled, completed |
| Client | unhandled errors, storage quota warnings, IndexedDB failures |
| Backups | backup completed, backup failed, last successful restore drill |

Do not attach player names, staff names, assessment values, notes, payment details, or full record payloads to metrics.

## 5. Alerts

Initial alert candidates:

| Alert | Trigger |
| --- | --- |
| Migration failures rising | More than a small threshold of `IMPORT_INTEGRITY_FAILED` or `IMPORT_CONSTRAINT_FAILED` in a release window |
| Sync backlog aging | Oldest pending mutation exceeds approved threshold |
| Repeated authorization denials | Unusual spike in RLS or function access denials |
| Export failures | Repeated export failures for authenticated users |
| Backup failure | Scheduled production backup or logical export fails |
| Restore drill overdue | Last restore drill exceeds approved interval |
| Client crash spike | New release causes elevated unhandled error rate |
| Database pressure | Storage, connection, or slow-query threshold exceeded |

Exact numeric thresholds should be set after staging load tests and private beta telemetry.

## 6. Audit Logging

Audit events are stored in `audit_events` as defined in the schema design.

Required event families:

- account creation and sign-in security events
- club creation
- local-to-cloud migration start, completion, and failure
- export request and completion
- deletion request, cancellation, and completion
- device revocation
- authorization-sensitive denial
- server-side privileged function execution where relevant

Rules:

1. Audit events are append-only.
2. Use correlation IDs for multi-step workflows.
3. Store stable error codes, not raw exception traces with private data.
4. Store user, club, and device IDs where appropriate.
5. Redact tokens, OTP values, email magic-link payloads, private notes, assessment values, and payment details.
6. Restrict audit access to trusted operational roles.
7. Define audit retention before production cloud launch.

Detailed team activity history belongs to Phase 4. Phase 3 audit logging is for security, lifecycle, and operational traceability.

## 7. Diagnostic Exports

Support diagnostics should be opt-in and redacted by default.

May include:

- app version
- browser family and platform class
- feature flag state
- sync status
- pending mutation counts by entity type
- conflict counts by type
- recent stable error codes
- last successful pull cursor
- storage quota estimate
- migration state

Must not include by default:

- player names
- staff contact details
- assessment raw values
- payment amounts or references
- note contents
- full backup payloads
- auth tokens
- Supabase service credentials

Any support workflow that needs a full workspace backup must ask the user to export it deliberately.

## 8. Backup Strategy

Use layered backups:

1. Existing user-controlled Full Workspace backup.
2. Supabase managed database backups for provider recovery.
3. Scheduled logical exports stored separately from the primary database provider.
4. Optional object storage backup if private media or generated exports are introduced later.

Initial objectives:

- Recovery point objective: no more than 24 hours for provider disaster recovery during early beta.
- Recovery time objective: one business day during early beta.
- Tighten both objectives before paid or multi-user club reliance.

Production launch requires confirming the selected Supabase plan's backup retention, point-in-time recovery options, storage region, and restore process against current provider documentation.

## 9. Logical Exports

Scheduled logical exports should include:

- schema version
- selected table data
- migration metadata
- audit events within approved retention
- export timestamp
- environment identifier

Logical exports should be:

- encrypted at rest where supported
- access restricted
- stored separately from the primary database provider where practical
- periodically tested in restore drills
- excluded from local development environments unless sanitized

## 10. Restore Drills

A backup is not accepted until restore has been demonstrated.

Minimum restore drill:

1. Select a non-production restore target.
2. Restore a recent backup or logical export.
3. Run schema migration validation.
4. Run RLS isolation tests.
5. Verify sample club counts and domain integrity.
6. Verify sync cursor and mutation tables are coherent.
7. Verify export generation from restored data.
8. Record restore duration, issues, and operator notes.

Drill evidence should include:

- source backup timestamp
- restore environment
- operator
- duration
- checks performed
- pass/fail result
- follow-up actions

## 11. Security Operations

Before production cloud data:

- enable secret scanning where available
- verify service-role key absence from browser bundles
- restrict production secret access
- document key rotation steps
- document incident response contacts and escalation
- verify RLS deny-by-default tests
- verify database functions check membership internally
- define dependency review expectations
- define production access review cadence

## 12. Production Launch Gates

Production cloud data must wait until:

1. Supabase project separation is complete.
2. Production environment variables are documented and access-controlled.
3. RLS policy tests pass.
4. Migration verification tests pass.
5. Offline sync failure-injection tests pass.
6. Export and deletion tests pass.
7. Audit event redaction is tested.
8. Provider backup settings are confirmed.
9. A restore drill has passed in non-production.
10. Privacy review is approved for player and staff records, including records about minors.
11. Support diagnostic boundaries are approved.
12. Incident response and key rotation runbooks exist.

## 13. Private Beta Operating Rhythm

During private beta:

- review sync failures daily after each release
- review unresolved conflicts by entity type
- review migration failures before inviting more clubs
- perform regular export and restore checks
- keep cloud migration opt-in
- keep local rollback guidance visible
- document every production data incident, even if user impact is low

## 14. Acceptance Criteria

The monitoring, audit logging, and backups task is complete when:

1. Required operational metrics are defined.
2. Initial alert families are defined.
3. Audit event rules and redaction boundaries are defined.
4. Diagnostic export scope is defined.
5. Backup layers are defined.
6. Logical export requirements are defined.
7. Restore drill procedure is defined.
8. Security operations gates are defined.
9. Production launch gates are defined.
10. Private beta operating rhythm is defined.

## 15. Next Task

After these planning gates, Phase 3 implementation can begin with Tranche 9: cloud foundation and architecture boundaries.

The first implementation work should remain local and reversible:

- add cloud feature flags
- define environment configuration conventions
- create repository interfaces
- create cloud and sync module boundaries
- add tests that confirm local-only behavior remains unchanged
- avoid production Supabase provisioning until launch gates are approved
