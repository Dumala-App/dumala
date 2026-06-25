# ADR: Phase 3 Cloud Platform

Updated: 2026-06-25

Status: Accepted for Phase 3 planning

## 1. Decision

Dumala will use Supabase as the Phase 3 managed backend platform before team collaboration, public profiles, or app-store packaging work begins.

The accepted Phase 3 platform choices are:

| Concern | Decision |
| --- | --- |
| Frontend application | Keep the existing React 19, Vite, TypeScript, and PWA application |
| Frontend hosting | Keep the existing Vercel static deployment path |
| Backend platform | Supabase managed platform |
| Durable database | Supabase-managed PostgreSQL |
| Authentication | Supabase Auth |
| First sign-in method | Email OTP or magic link |
| Authorization boundary | PostgreSQL Row Level Security |
| Cloud API surface | Supabase generated APIs plus narrowly scoped database functions where transactions or privileged workflows are required |
| Local cloud-backed replica | IndexedDB |
| Offline mutation queue | IndexedDB outbox with idempotency keys |
| Synchronization model | Push and pull sync with server cursors, record versions, tombstones, optimistic concurrency, and explicit conflict handling |
| Realtime | Optional invalidation signal after baseline sync is proven |
| Current local mode | Preserve local-only use for users who do not opt into cloud accounts |

No production cloud data should be created until the schema, Row Level Security test matrix, environment separation, backup tier, and privacy review are approved.

## 2. Context

Dumala is currently a static local-first PWA. The browser owns workspace state, persistence, validation, backup, recovery, and offline behavior. This has been the right foundation for the beta because coaches can use the app without accounts and without internet access.

Phase 3 introduces a different requirement: a user must be able to sign in on another device and safely access the same club data. That requires secure identity, durable cloud storage, tenant isolation, non-destructive migration, and a sync model that does not silently overwrite offline work.

The platform decision must support:

- existing local-only users
- explicit opt-in cloud migration
- safe cross-device access
- offline edits and reconnect synchronization
- duplicate write prevention
- visible conflict handling
- account recovery, export, and deletion
- Phase 4 club memberships and role-based access without a schema rewrite

## 3. Rationale

Supabase and PostgreSQL fit Dumala because the product data is relational. Clubs own players, staff, games, standings, assessments, bulletins, schedules, tactics, and future payment records. Memberships connect authenticated users to clubs. Reporting and integrity checks depend on durable relationships, transactions, constraints, and tenant-scoped queries.

PostgreSQL gives Dumala:

- foreign keys and check constraints
- transactions for multi-record business operations
- unique constraints for idempotent mutation replay
- club-scoped indexes and query patterns
- Row Level Security for tenant isolation
- standard SQL migrations that can be committed and reviewed
- portability if infrastructure needs change later

Supabase adds managed Auth, database APIs, logs, backups, and optional Realtime without requiring Dumala to build and operate a custom backend before the cloud-sync product value is proven.

Vercel remains the frontend host because the existing static deployment, quality gate, and production release path already work. Cloud work should not destabilize that proven deployment pipeline.

IndexedDB is selected for the local cloud-backed replica and outbox because `localStorage` is synchronous, limited, and poorly suited to transactional record sync. The current validated `localStorage` workspace remains the source for pre-cloud local mode and rollback during migration.

## 4. Alternatives Considered

### Firebase Authentication and Cloud Firestore

Firestore has mature client SDKs and built-in offline behavior, but its document model is less natural for Dumala's connected club records and future reporting. Multi-record invariants, joins, and membership-scoped authorization are harder to reason about than PostgreSQL constraints and RLS. Built-in offline synchronization also risks last-write-wins behavior unless additional conflict controls are added.

Decision: do not choose Firebase/Firestore for the primary Phase 3 architecture.

### Custom API with PostgreSQL

A custom API would give maximum control, but it adds API hosting, authentication integration, authorization code, observability, scaling, patching, and incident-response responsibilities before the team needs that operational burden.

Decision: defer a custom API until product scale, compliance requirements, or complex server-only workflows justify it.

### Cloud Backup Without Sync

Cloud backup would be simpler and would help device-loss recovery, but it does not satisfy the Phase 3 criterion of safe second-device access. It would also create ambiguous overwrite behavior between device snapshots and would not prepare the app for collaboration.

Decision: do not treat cloud backup alone as sufficient for Phase 3.

## 5. Consequences

### Positive

- The data model can support club ownership, memberships, and future roles.
- Authorization can be enforced at the database boundary through RLS.
- Database constraints and transactions can protect high-value coaching records.
- SQL migrations can be reviewed and tested in source control.
- Existing Vercel deployment remains stable.
- Local-only use can continue while cloud sync rolls out behind a feature flag.
- Phase 4 collaboration can build on the same identity and tenancy foundation.

### Tradeoffs

- Dumala must build its own IndexedDB replica, outbox, and conflict handling instead of relying on automatic client sync.
- RLS policies become release-critical and need automated tests before cloud launch.
- Direct browser-to-database access must be hidden behind repository and sync service boundaries so query logic does not spread through React components.
- Supabase provider behavior, limits, pricing, regions, and backup guarantees must be reconfirmed before production provisioning.

## 6. Implementation Guardrails

The first implementation tranche must create boundaries before feature work:

1. Add a cloud feature flag that is disabled by default.
2. Create repository interfaces separating domain state from storage providers.
3. Create cloud and sync module boundaries without changing local-only behavior.
4. Keep Supabase service-role credentials out of browser code and CI artifacts.
5. Commit database migrations and generated types when Supabase projects are introduced.
6. Use separate local development, staging, and production Supabase projects.
7. Treat Realtime as a freshness hint only, not the source of sync correctness.
8. Keep Full Workspace V3 export and rollback available during migration.

## 7. Approval Gates Before Production Cloud Data

Production cloud data must wait until these gates are complete:

1. Durable user, club, membership, device, and domain schemas are reviewed.
2. RLS policies deny access by default and pass cross-user isolation tests.
3. Database constraints cover required IDs, tenant ownership, valid states, and non-negative counts.
4. Initial workspace import is idempotent and has a verification report.
5. Local-to-cloud migration creates a pre-migration backup and supports non-destructive rollback.
6. Offline mutation replay is idempotent and rejects stale versions instead of silently overwriting newer records.
7. Service-worker policy is verified to avoid caching authenticated API responses.
8. Account export, deletion, monitoring, audit logging, and backup/restore procedures are approved.
9. Privacy review covers player and staff records, including data about minors.
10. Provider configuration, regions, pricing, rate limits, and backup retention are reconfirmed against current Supabase documentation.

## 8. Immediate Next Task

Begin Tranche 9: Cloud foundation and architecture boundaries.

The first engineering task is to add project-level cloud module boundaries and environment configuration patterns while keeping the current local app behavior unchanged. Supabase provisioning and production credentials should wait until the approval gates are defined and reviewed.
