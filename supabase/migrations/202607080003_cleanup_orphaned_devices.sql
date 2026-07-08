-- One-time cleanup of orphaned device rows.
--
-- Device IDs used to be namespaced per browser instead of per user, so signing in
-- with a second account on the same browser reused the first account's
-- devices.id. That reuse hit the devices UPDATE RLS policy (USING expression) and
-- broke onboarding. The client fix now mints a fresh per-user device ID and drops
-- the legacy per-browser key, which leaves the old shared rows abandoned in the
-- table. This migration reclaims those rows.
--
-- Deletion is intentionally conservative: a row is removed only when it is
-- genuinely detached and stale, so the cleanup has no cascade or provenance side
-- effects.
--   * No reference from sync_mutations (device_id is NOT NULL there and cascades
--     on delete, so a referenced device still owns real sync history).
--   * No reference from workspace_imports / sync_changes / audit_events. Those
--     FKs are ON DELETE SET NULL, so requiring zero references guarantees we
--     never silently null out historical provenance.
--   * Not seen in the last 30 days. last_seen_at can be NULL for a device that
--     never synced, so we fall back to created_at to avoid deleting a brand-new
--     device that simply has not checked in yet.

delete from public.devices d
where coalesce(d.last_seen_at, d.created_at) < now() - interval '30 days'
  and not exists (
    select 1 from public.sync_mutations sm where sm.device_id = d.id
  )
  and not exists (
    select 1 from public.workspace_imports wi where wi.device_id = d.id
  )
  and not exists (
    select 1 from public.sync_changes sc where sc.origin_device_id = d.id
  )
  and not exists (
    select 1 from public.audit_events ae where ae.device_id = d.id
  );
