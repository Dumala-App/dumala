# Phase 3 Account Recovery, Export, and Deletion

Updated: 2026-06-25

Status: Accepted design baseline before implementation

Related docs:

- `docs/ADR_PHASE_3_CLOUD_PLATFORM.md`
- `docs/PHASE_3_DURABLE_SCHEMA_DESIGN.md`
- `docs/PHASE_3_LOCAL_TO_CLOUD_MIGRATION.md`
- `docs/PHASE_3_OFFLINE_MUTATION_QUEUE.md`

## 1. Purpose

This document defines the Phase 3 account lifecycle model for passwordless recovery, session and device management, data export, club deletion, and account deletion.

Dumala stores private club operations data and may store data about minors. Account lifecycle workflows must be deliberate, auditable, and reversible where appropriate during beta.

## 2. Scope

Included in Phase 3:

- passwordless account recovery assumptions
- session management
- device listing and revocation
- cloud workspace export
- account metadata export
- club deletion workflow
- account deletion workflow
- re-authentication requirements
- deletion recovery window
- audit events
- retention decisions that must be finalized before production cloud launch

Deferred:

- ownership transfer to another user
- multi-owner recovery
- invitation recovery
- organization-level legal hold
- public profile deletion workflows
- automated billing or payment-provider deletion

## 3. Account Recovery

Phase 3 uses email OTP or magic-link authentication. For the first release, account recovery means access to the verified email address.

Supported recovery actions:

- request a new OTP or magic link
- sign out other devices by revoking device records
- change email only after verifying the new address
- export workspace data after re-authentication
- delete account or club after re-authentication

Unsupported in Phase 3:

- password reset, because there is no app password
- social account fallback
- support-assisted account takeover without separate policy review

Required user guidance:

- If a user loses access to their email, Dumala cannot automatically prove account ownership.
- Support escalation must avoid exposing player, assessment, note, or payment data by default.
- Recovery processes must be documented before public cloud launch.

## 4. Sessions

Session controls should include:

- current signed-in email
- current device label
- sign out from this device
- list of known devices
- revoke another device
- last seen and last sync time for each device

Rules:

1. Signing out must not delete local-only data.
2. Signing out from cloud-backed mode must warn when pending mutations or conflicts exist.
3. Revoked devices cannot push mutations.
4. Session state must not be stored in service-worker caches.
5. Tokens, OTP values, and magic-link payloads must never be logged.

## 5. Device Revocation

Device revocation updates `devices.revoked_at`.

Revocation effects:

- future sync pushes from that device are rejected
- the revoked device can continue showing any already-local data until sign-out or local removal
- the revoked device must show `Sync paused` or `Sign-in required`
- re-registering the same browser creates a new device ID after successful authentication

Audit event:

- `device_revoked`

Open implementation decision:

- whether revocation should also invalidate Supabase sessions for that browser in Phase 3 or only block Dumala sync commands.

## 6. Data Export

Phase 3 should support two export types.

### Dumala Workspace Backup

Purpose: app recovery and rollback.

Format:

- current `dumala-workspace` backup format
- latest supported version, currently Full Workspace V4
- includes private club workspace data
- excludes auth secrets and internal security records

Requirements:

- available in local-only mode
- available in cloud-backed mode
- generated from verified local replica or cloud source of truth
- validates before download
- includes schema/app version metadata when backup format is next extended

### Portable Account Archive

Purpose: user data portability and support review.

Contents:

- account profile metadata
- club metadata
- membership metadata
- device list
- readable JSON for workspace data
- CSV summaries where useful, such as roster, assessments, games, and payment ledger

Exclusions:

- access tokens
- refresh tokens
- OTP values
- internal security secrets
- service-role data
- unrelated users' private data

Sensitive export requests should require recent authentication.

## 7. Club Deletion

Club deletion removes or anonymizes the club workspace while preserving only legally or operationally required audit evidence.

### Deletion States

| State | Meaning |
| --- | --- |
| `active` | Normal club state |
| `pending_deletion` | Deletion requested, recovery window active |
| `deleted` | Deletion finalized |

### Workflow

1. Explain consequences.
2. Warn about synced devices and pending offline changes.
3. Offer workspace export.
4. Require recent authentication.
5. Require typed confirmation of the club name.
6. Mark club as `pending_deletion`.
7. Pause new writes except cancellation and export.
8. Keep a beta recovery window.
9. Finalize deletion or anonymization after the recovery window.
10. Retain minimal audit evidence according to retention policy.

### Cancellation

During the recovery window, the owner can cancel deletion after re-authentication.

Cancellation should:

- restore `club_state = active`
- clear `pending_deletion_at`
- write `deletion_cancelled` audit event
- resume sync after clients pull the state change

## 8. Account Deletion

Phase 3 account deletion is owner-only and one-club-focused.

Rules:

1. If the account owns an active club, the user must delete the club first.
2. If the club is pending deletion, the account can be marked pending deletion after confirmation.
3. Account deletion requires recent authentication.
4. Pending offline changes must be surfaced before deletion.
5. The app must offer export before deletion.
6. Phase 3 may block deletion when finalization would orphan active club data.

Account deletion states:

| State | Meaning |
| --- | --- |
| `active` | Normal account state |
| `pending_deletion` | User requested deletion |
| `deleted` | Account data finalized according to policy |

Deletion should revoke devices and sessions where supported.

## 9. Re-Authentication Requirements

Require recent authentication before:

- changing email
- exporting a portable account archive
- requesting club deletion
- cancelling club deletion
- requesting account deletion
- revoking all other devices

The exact freshness window should be finalized before implementation. A short window, such as 10 to 15 minutes, is appropriate for sensitive actions.

## 10. Pending Sync During Lifecycle Actions

Before export or deletion, check:

- pending mutations
- unresolved conflicts
- failed action-required mutations
- last successful pull cursor
- revoked or suspended membership state

For export:

- warn if unsynced local changes are not yet in cloud
- include local pending data only in a clearly labeled local backup export

For deletion:

- block deletion when unresolved local mutations could change what is being deleted
- offer retry sync, local backup export, or discard local pending changes with explicit confirmation

## 11. Audit Events

Required lifecycle audit events:

- `account_created`
- `sign_in`
- `club_created`
- `migration_started`
- `migration_completed`
- `migration_failed`
- `export_requested`
- `export_completed`
- `deletion_requested`
- `deletion_cancelled`
- `deletion_completed`
- `device_revoked`
- `authorization_denied`

Audit metadata must be redacted.

Do not store:

- tokens
- OTP values
- magic-link payloads
- player names
- assessment values
- payment details
- note contents
- full record payloads

## 12. Retention Policy Decisions

These policy values must be approved before production cloud launch:

| Item | Required decision |
| --- | --- |
| Club deletion recovery window | Number of days pending deletion can be cancelled |
| Account deletion recovery window | Number of days pending deletion can be cancelled |
| Audit event retention | Duration and access policy |
| Export file retention | Expiry period for temporary download URLs |
| Backup retention | Provider backup tier and independent export retention |
| Deleted personal data | Delete versus anonymize rules |
| Support diagnostics | Retention and access limits |

Until those values are approved, production cloud data should not be created.

## 13. User-Facing States

Account and workspace UI should clearly distinguish:

- local-only workspace
- signed in, not migrated
- cloud migration in progress
- cloud-backed and synced
- cloud-backed with pending local changes
- sync paused due to account or device state
- club pending deletion
- account pending deletion

Deletion and export screens should use plain language and avoid implying that local browser backups are the same as durable cloud deletion.

## 14. Acceptance Criteria

The account lifecycle task is complete when:

1. Passwordless recovery assumptions are documented.
2. Session and device management behavior is defined.
3. Device revocation behavior is defined.
4. Workspace backup and portable account archive scopes are defined.
5. Club deletion workflow and states are defined.
6. Account deletion workflow and states are defined.
7. Sensitive re-authentication gates are defined.
8. Pending sync behavior is defined for export and deletion.
9. Required audit events are listed.
10. Retention policy decisions are identified before production cloud launch.

## 15. Next Task

The next Phase 3 task is to add monitoring, audit logging, and backups.

That design should define:

- operational metrics
- redacted diagnostics
- alert thresholds
- audit event implementation rules
- backup strategy
- restore drills
- production launch checklist gates
