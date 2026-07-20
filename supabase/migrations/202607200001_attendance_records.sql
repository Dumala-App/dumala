-- Attendance tracking: coach-owned session register plus per-player entries.
-- Mirrors the local-first AttendanceSession / AttendanceEntry shape so the
-- workspace backup importer can round-trip attendance into the cloud.

create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create type public.attendance_session_type as enum ('training', 'match', 'meeting', 'other');

create table public.attendance_sessions (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  session_date text not null,
  session_type public.attendance_session_type not null,
  title text,
  game_id uuid references public.games(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null,
  constraint attendance_sessions_date_required_check check (nullif(trim(session_date), '') is not null)
);

create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function public.set_updated_at();

create table public.attendance_entries (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  player_name_snapshot text not null,
  status public.attendance_status not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null,
  constraint attendance_entries_name_required_check check (nullif(trim(player_name_snapshot), '') is not null)
);

-- One active entry per player within a session. Departed players carry a null
-- player_id and are treated as distinct by the partial unique index.
create unique index attendance_entries_active_session_player_idx
on public.attendance_entries(attendance_session_id, player_id)
where deleted_at is null;

create trigger attendance_entries_set_updated_at
before update on public.attendance_entries
for each row execute function public.set_updated_at();

create index attendance_sessions_club_date_idx on public.attendance_sessions(club_id, session_date);
create index attendance_sessions_club_deleted_idx on public.attendance_sessions(club_id, deleted_at);
create index attendance_entries_club_player_idx on public.attendance_entries(club_id, player_id);
create index attendance_entries_session_idx on public.attendance_entries(attendance_session_id);

-- RLS + grants + direct-update guard, matching the core domain tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['attendance_sessions', 'attendance_entries']
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_active_club_member(club_id))',
      table_name || ' member select',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.user_can_manage_club_table(club_id, %L))',
      table_name || ' role insert',
      table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.user_can_manage_club_table(club_id, %L)) with check (public.user_can_manage_club_table(club_id, %L))',
      table_name || ' role update',
      table_name,
      table_name,
      table_name
    );

    execute format('grant select, insert, update on public.%I to authenticated', table_name);

    execute format('drop trigger if exists %I on public.%I', table_name || '_block_direct_update', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.block_direct_versioned_update()',
      table_name || '_block_direct_update',
      table_name
    );
  end loop;
end;
$$;

-- Let owners, admins, and coaches manage attendance. Rebuilds the latest
-- definition (from 202607090001) with the two attendance tables added to the
-- coach-managed set; staff keep their existing narrower set.
create or replace function public.user_can_manage_club_table(
  target_club_id uuid,
  target_table text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_table = 'bulletins' and public.is_user_muted(target_user_id)
      then false
    when public.user_has_club_role(target_club_id, array['owner', 'admin']::public.membership_role[], target_user_id)
      then true
    when public.user_has_club_role(target_club_id, array['coach']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'players',
        'games',
        'match_results',
        'match_scorer_contributions',
        'mvp_awards',
        'player_offenses',
        'standings_rows',
        'standings_snapshots',
        'bulletins',
        'assessment_sessions',
        'assessment_development_plan_weeks',
        'attendance_sessions',
        'attendance_entries',
        'player_availability',
        'coach_notes',
        'weekly_training_schedules',
        'tactics_workspaces',
        'tactics_lineup_assignments',
        'tactics_draw_paths',
        'tactics_notes',
        'tactics_player_extras'
      ])
    when public.user_has_club_role(target_club_id, array['staff']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'bulletins',
        'player_availability',
        'coach_notes',
        'weekly_training_schedules'
      ])
    else false
  end;
$$;

-- Register the attendance tables for the generic controlled-update path so
-- post-migration edits go through the same optimistic-concurrency function.
create or replace function public.apply_controlled_record_update(
  target_table text,
  target_id uuid,
  expected_version bigint,
  patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_tables constant text[] := array[
    'players',
    'staff_members',
    'games',
    'match_results',
    'match_scorer_contributions',
    'mvp_awards',
    'player_offenses',
    'standings_rows',
    'standings_snapshots',
    'bulletins',
    'assessment_sessions',
    'assessment_development_plan_weeks',
    'payment_ledger_entries',
    'attendance_sessions',
    'attendance_entries',
    'player_availability',
    'coach_notes',
    'weekly_training_schedules',
    'tactics_workspaces',
    'tactics_lineup_assignments',
    'tactics_draw_paths',
    'tactics_notes',
    'tactics_player_extras'
  ];
  protected_columns constant text[] := array[
    'id',
    'club_id',
    'created_at',
    'created_by',
    'updated_at',
    'updated_by',
    'version',
    'deleted_at',
    'client_created_at',
    'origin_device_id'
  ];
  target_user_id uuid := auth.uid();
  existing_record jsonb;
  updated_record jsonb;
  target_club_id uuid;
  current_version bigint;
  patch_key text;
  patch_columns text[] := '{}';
  set_clause text;
begin
  if target_user_id is null then
    raise exception 'A signed-in user is required to update records.' using errcode = '42501';
  end if;

  if target_table <> all(allowed_tables) then
    raise exception 'Unsupported controlled update table.' using errcode = '22023';
  end if;

  if patch is null or jsonb_typeof(patch) <> 'object' or patch = '{}'::jsonb then
    raise exception 'Controlled update patch must be a non-empty object.' using errcode = '22023';
  end if;

  if patch ?| protected_columns then
    raise exception 'Controlled update patch includes protected fields.' using errcode = '22023';
  end if;

  execute format(
    'select to_jsonb(t), t.club_id, t.version from public.%I t where t.id = $1 and t.deleted_at is null for update',
    target_table
  )
  into existing_record, target_club_id, current_version
  using target_id;

  if existing_record is null then
    raise exception 'Record was not found.' using errcode = 'P0002';
  end if;

  if not public.user_can_manage_club_table(target_club_id, target_table, target_user_id) then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (target_club_id, target_user_id, 'authorization_denied', jsonb_build_object('action', 'controlled_update', 'entityTable', target_table));
    raise exception 'User cannot update this record.' using errcode = '42501';
  end if;

  if current_version <> expected_version then
    raise exception 'Record changed since it was opened.' using errcode = '40001';
  end if;

  for patch_key in select jsonb_object_keys(patch)
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = patch_key
    ) then
      raise exception 'Controlled update patch includes an unknown field.' using errcode = '22023';
    end if;

    patch_columns := array_append(patch_columns, patch_key);
  end loop;

  select string_agg(format('%I = input.%I', column_name, column_name), ', ')
  into set_clause
  from unnest(patch_columns) as column_name;

  perform set_config('request.dumala_controlled_update', 'on', true);

  execute format(
    'with input as (
       select * from jsonb_populate_record(null::public.%I, $1)
     )
     update public.%I as target
     set %s,
         updated_by = $3,
         version = target.version + 1
     from input
     where target.id = $2
     returning to_jsonb(target)',
    target_table,
    target_table,
    set_clause
  )
  into updated_record
  using patch, target_id, target_user_id;

  perform set_config('request.dumala_controlled_update', 'off', true);

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    target_club_id,
    target_user_id,
    'record_updated',
    jsonb_build_object('entityTable', target_table, 'version', (updated_record ->> 'version')::bigint)
  );

  return updated_record;
end;
$$;

grant execute on function public.user_can_manage_club_table(uuid, text, uuid) to authenticated;
grant execute on function public.apply_controlled_record_update(text, uuid, bigint, jsonb) to authenticated;
