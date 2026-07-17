-- Clean up rows duplicated by repeated cloud backups.
--
-- Until this migration's companion fix, createCloudImportPayload derived every
-- cloud id from the backup's importId, which is freshly random on each run
-- (App.tsx -> createClientId('cloud-backup')). Local records carry non-UUID ids
-- ("p_1752700000000" from RosterView, "g_..." from ScheduleView, and so on), so
-- toCloudUuid hashed them against that random namespace and produced a new id
-- every run. The importer upserts on `id`, so each backup inserted a complete
-- extra copy of the roster, staff, and games instead of updating them. A coach
-- who backed up nine times sees nine times their squad on the public team page.
--
-- The fix namespaces derived ids by the (stable) club id, so re-uploads update
-- in place. This migration retires the copies already written. It is careful:
--   * Soft-delete only (deleted_at), never a hard delete - every reader in the
--     app and the public page RPC already filters on deleted_at is null, and a
--     mistake here stays recoverable.
--   * Keeps the OLDEST row of each duplicate group, because child rows written
--     by the earliest backup point at it.
--   * Only ever touches rows inside a single club, keyed on the natural
--     identity a coach would recognise as "the same player".

-- The migration runner does not wrap files in a transaction, so open one
-- explicitly: `set local` below is scoped to it, and all three tables are
-- retired together or not at all.
begin;

-- These tables carry the block_direct_versioned_update guard. Unlock it the same
-- way apply_controlled_record_update does, and bump `version` as it would, so
-- clients holding a stale copy still fail their optimistic-concurrency check.
set local request.dumala_controlled_update = 'on';

-- Players: same club, same shirt number, same name.
with ranked as (
  select
    id,
    row_number() over (
      partition by club_id, roster_number, lower(btrim(name))
      order by created_at, id
    ) as copy_number
  from public.players
  where deleted_at is null
)
update public.players p
set deleted_at = now(), version = p.version + 1
from ranked
where p.id = ranked.id and ranked.copy_number > 1;

-- Staff: same club, same name, same role.
with ranked as (
  select
    id,
    row_number() over (
      partition by club_id, lower(btrim(name)), lower(btrim(role))
      order by created_at, id
    ) as copy_number
  from public.staff_members
  where deleted_at is null
)
update public.staff_members s
set deleted_at = now(), version = s.version + 1
from ranked
where s.id = ranked.id and ranked.copy_number > 1;

-- Games: same club, same opponent, same date, same type.
with ranked as (
  select
    id,
    row_number() over (
      partition by club_id, lower(btrim(opponent)), event_date, type
      order by created_at, id
    ) as copy_number
  from public.games
  where deleted_at is null
)
update public.games g
set deleted_at = now(), version = g.version + 1
from ranked
where g.id = ranked.id and ranked.copy_number > 1;

commit;
