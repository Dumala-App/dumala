create type public.player_registration_status as enum ('active', 'pending', 'suspended');
create type public.staff_status as enum ('active', 'inactive');
create type public.game_status as enum ('upcoming', 'completed', 'cancelled');
create type public.game_type as enum ('league', 'cup', 'friendly', 'training', 'meeting');
create type public.bulletin_category as enum ('urgent', 'matchday', 'training', 'social');
create type public.age_group as enum ('u12', 'u15', 'u18', 'adult');
create type public.fprds_role as enum ('st', 'w', 'cm', 'cdm', 'fb', 'cb', 'gk');
create type public.assessment_type as enum ('full', 'quick');
create type public.payment_entry_type as enum ('charge', 'payment', 'waiver', 'refund', 'adjustment');
create type public.payment_category as enum ('registration', 'monthly_fee', 'coach_fee', 'kit', 'tournament', 'training', 'other');
create type public.payment_method as enum ('cash', 'gcash', 'bank_transfer', 'card', 'other');
create type public.availability_status as enum ('yes', 'no', 'maybe');
create type public.standings_snapshot_source as enum ('manual', 'sunday');
create type public.tactics_player_status as enum ('starting', 'substitute', 'injured');

create table public.players (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  roster_number numeric not null,
  position text not null,
  bio text not null default '',
  photo_url text not null default '',
  age_snapshot numeric check (age_snapshot is null or age_snapshot >= 0),
  height numeric check (height is null or height >= 0),
  weight numeric check (weight is null or weight >= 0),
  specialty_traits jsonb not null default '[]'::jsonb,
  coach_notes text,
  date_of_birth text,
  fprds_role public.fprds_role,
  fprds_age_group_preference public.age_group,
  fprds_last_assessment_id uuid,
  games_played numeric not null default 0 check (games_played >= 0),
  goals numeric not null default 0 check (goals >= 0),
  assists numeric not null default 0 check (assists >= 0),
  clean_sheets numeric not null default 0 check (clean_sheets >= 0),
  minutes_played numeric not null default 0 check (minutes_played >= 0),
  mvp_awards numeric not null default 0 check (mvp_awards >= 0),
  yellow_cards numeric not null default 0 check (yellow_cards >= 0),
  red_cards numeric not null default 0 check (red_cards >= 0),
  base_attributes jsonb not null default '{}'::jsonb,
  position_attributes jsonb not null default '{}'::jsonb,
  registration_status public.player_registration_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

create table public.staff_members (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  role text not null,
  bio text not null default '',
  photo_url text not null default '',
  email text,
  phone text,
  since text,
  status public.staff_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger staff_members_set_updated_at
before update on public.staff_members
for each row execute function public.set_updated_at();

create table public.games (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  opponent text not null,
  event_date text not null,
  event_time text not null default '',
  location text not null default '',
  status public.game_status not null,
  type public.game_type not null,
  our_score numeric check (our_score is null or our_score >= 0),
  opponent_score numeric check (opponent_score is null or opponent_score >= 0),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null,
  constraint games_training_meeting_score_check check (
    type not in ('training', 'meeting') or (our_score is null and opponent_score is null)
  ),
  constraint games_completed_match_score_check check (
    status <> 'completed'
    or type in ('training', 'meeting')
    or (our_score is not null and opponent_score is not null)
  )
);

create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

create table public.match_results (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  our_score numeric not null check (our_score >= 0),
  opponent_score numeric not null check (opponent_score >= 0),
  notes text,
  applied_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index match_results_one_active_per_game_idx
on public.match_results(game_id)
where deleted_at is null and reversed_at is null;

create trigger match_results_set_updated_at
before update on public.match_results
for each row execute function public.set_updated_at();

create table public.match_scorer_contributions (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  match_result_id uuid not null references public.match_results(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  player_name_snapshot text not null,
  goal_count numeric not null check (goal_count > 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger match_scorer_contributions_set_updated_at
before update on public.match_scorer_contributions
for each row execute function public.set_updated_at();

create table public.mvp_awards (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  player_name_snapshot text not null,
  award_date text not null,
  opponent text,
  note text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger mvp_awards_set_updated_at
before update on public.mvp_awards
for each row execute function public.set_updated_at();

create table public.player_offenses (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  game_opponent text,
  offense_date text not null,
  card_type text not null,
  reason text not null,
  match_minute numeric check (match_minute is null or match_minute >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger player_offenses_set_updated_at
before update on public.player_offenses
for each row execute function public.set_updated_at();

create table public.standings_rows (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  team_name text not null,
  rank numeric not null,
  played numeric not null check (played >= 0),
  won numeric not null check (won >= 0),
  drawn numeric not null check (drawn >= 0),
  lost numeric not null check (lost >= 0),
  goals_for numeric not null check (goals_for >= 0),
  goals_against numeric not null check (goals_against >= 0),
  points numeric not null,
  is_user_team boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index standings_rows_active_team_idx
on public.standings_rows(club_id, team_name)
where deleted_at is null;

create trigger standings_rows_set_updated_at
before update on public.standings_rows
for each row execute function public.set_updated_at();

create table public.standings_snapshots (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  label text not null,
  source public.standings_snapshot_source not null,
  snapshot_rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger standings_snapshots_set_updated_at
before update on public.standings_snapshots
for each row execute function public.set_updated_at();

create table public.bulletins (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  content text not null default '',
  bulletin_date text not null,
  category public.bulletin_category not null,
  author_snapshot text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null,
  constraint bulletins_title_required_check check (nullif(trim(title), '') is not null),
  constraint bulletins_date_required_check check (nullif(trim(bulletin_date), '') is not null),
  constraint bulletins_author_required_check check (nullif(trim(author_snapshot), '') is not null)
);

create trigger bulletins_set_updated_at
before update on public.bulletins
for each row execute function public.set_updated_at();

create table public.assessment_sessions (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  assessment_date text not null,
  assessment_type public.assessment_type not null,
  age_group public.age_group not null,
  role public.fprds_role not null,
  ovr numeric not null check (ovr >= 0),
  weakest_attribute_id text not null,
  ovr_tier_label text not null,
  previous_session_id uuid,
  benchmark_version text not null,
  weighting_version text not null,
  scoring_algorithm_version text not null,
  raw_results jsonb not null,
  attribute_scores jsonb not null,
  attribute_deltas jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger assessment_sessions_set_updated_at
before update on public.assessment_sessions
for each row execute function public.set_updated_at();

create table public.assessment_development_plan_weeks (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  focus_attribute_id text not null,
  priority_score numeric not null,
  week_number numeric not null check (week_number between 1 and 4),
  focus text not null,
  drill_ids jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index assessment_plan_weeks_active_week_idx
on public.assessment_development_plan_weeks(assessment_session_id, week_number)
where deleted_at is null;

create trigger assessment_development_plan_weeks_set_updated_at
before update on public.assessment_development_plan_weeks
for each row execute function public.set_updated_at();

create table public.payment_ledger_entries (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  player_name_snapshot text not null,
  entry_type public.payment_entry_type not null,
  category public.payment_category not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'PHP',
  entry_date text not null,
  due_date text,
  method public.payment_method,
  reference text,
  note text,
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null,
  constraint payment_method_required_check check (entry_type <> 'payment' or method is not null),
  constraint adjustment_note_required_check check (entry_type <> 'adjustment' or nullif(trim(coalesce(note, '')), '') is not null)
);

create trigger payment_ledger_entries_set_updated_at
before update on public.payment_ledger_entries
for each row execute function public.set_updated_at();

create table public.player_availability (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  event_id text not null,
  player_id uuid references public.players(id) on delete cascade,
  availability_date text,
  status public.availability_status not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index player_availability_active_event_player_idx
on public.player_availability(club_id, event_id, player_id)
where deleted_at is null;

create trigger player_availability_set_updated_at
before update on public.player_availability
for each row execute function public.set_updated_at();

create table public.coach_notes (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  subject_type text,
  subject_id text not null,
  note text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger coach_notes_set_updated_at
before update on public.coach_notes
for each row execute function public.set_updated_at();

create table public.weekly_training_schedules (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  week_start_date text,
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger weekly_training_schedules_set_updated_at
before update on public.weekly_training_schedules
for each row execute function public.set_updated_at();

create table public.tactics_workspaces (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  match_format text not null,
  formation text not null,
  playstyle text not null,
  is_custom_strategy boolean not null default false,
  custom_playstyle_value text,
  custom_defensive_value text,
  custom_mentality_value text,
  custom_strategy_notes text,
  coach_level text,
  captain_player_id uuid references public.players(id) on delete set null,
  penalty_taker_player_id uuid references public.players(id) on delete set null,
  free_kick_taker_player_id uuid references public.players(id) on delete set null,
  corner_taker_player_id uuid references public.players(id) on delete set null,
  defensive_style text,
  custom_playstyles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger tactics_workspaces_set_updated_at
before update on public.tactics_workspaces
for each row execute function public.set_updated_at();

create table public.tactics_lineup_assignments (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  tactics_workspace_id uuid not null references public.tactics_workspaces(id) on delete cascade,
  slot_id text not null,
  player_id uuid references public.players(id) on delete set null,
  player_name_snapshot text not null,
  position_snapshot text not null,
  rating_snapshot numeric not null,
  condition_snapshot text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index tactics_lineup_active_slot_idx
on public.tactics_lineup_assignments(tactics_workspace_id, slot_id)
where deleted_at is null;

create trigger tactics_lineup_assignments_set_updated_at
before update on public.tactics_lineup_assignments
for each row execute function public.set_updated_at();

create table public.tactics_draw_paths (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  tactics_workspace_id uuid not null references public.tactics_workspaces(id) on delete cascade,
  path_order numeric not null,
  color text not null,
  width numeric not null,
  points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger tactics_draw_paths_set_updated_at
before update on public.tactics_draw_paths
for each row execute function public.set_updated_at();

create table public.tactics_notes (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create trigger tactics_notes_set_updated_at
before update on public.tactics_notes
for each row execute function public.set_updated_at();

create table public.tactics_player_extras (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  status public.tactics_player_status not null,
  yellow_cards numeric not null default 0 check (yellow_cards >= 0),
  red_cards numeric not null default 0 check (red_cards >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version bigint not null default 1,
  deleted_at timestamptz,
  client_created_at timestamptz,
  origin_device_id uuid references public.devices(id) on delete set null
);

create unique index tactics_player_extras_active_player_idx
on public.tactics_player_extras(club_id, player_id)
where deleted_at is null;

create trigger tactics_player_extras_set_updated_at
before update on public.tactics_player_extras
for each row execute function public.set_updated_at();

create index players_club_deleted_idx on public.players(club_id, deleted_at);
create index players_club_status_idx on public.players(club_id, registration_status);
create index staff_members_club_deleted_idx on public.staff_members(club_id, deleted_at);
create index games_club_date_idx on public.games(club_id, event_date);
create index games_club_deleted_idx on public.games(club_id, deleted_at);
create index match_results_club_game_idx on public.match_results(club_id, game_id);
create index payment_ledger_entries_club_player_idx on public.payment_ledger_entries(club_id, player_id);
create index assessment_sessions_club_player_idx on public.assessment_sessions(club_id, player_id);
create index sync_changes_entity_idx on public.sync_changes(club_id, entity_table, entity_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    'player_availability',
    'coach_notes',
    'weekly_training_schedules',
    'tactics_workspaces',
    'tactics_lineup_assignments',
    'tactics_draw_paths',
    'tactics_notes',
    'tactics_player_extras'
  ]
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
  end loop;
end;
$$;

drop policy if exists "bulletins role update" on public.bulletins;
revoke update on public.bulletins from authenticated;

create or replace function public.block_direct_versioned_update()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('request.dumala_controlled_update', true), 'off') <> 'on' then
    raise exception 'Use a controlled update function with the current record version.' using errcode = '42501';
  end if;

  return new;
end;
$$;

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

create or replace function public.update_bulletin_controlled(
  target_bulletin_id uuid,
  expected_version bigint,
  new_title text,
  new_content text,
  new_bulletin_date text,
  new_category public.bulletin_category,
  new_author_snapshot text
)
returns public.bulletins
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid := auth.uid();
  existing public.bulletins%rowtype;
  updated_bulletin public.bulletins%rowtype;
begin
  if target_user_id is null then
    raise exception 'A signed-in user is required to update bulletins.' using errcode = '42501';
  end if;

  select *
  into existing
  from public.bulletins
  where id = target_bulletin_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Bulletin was not found.' using errcode = 'P0002';
  end if;

  if not public.user_can_manage_club_table(existing.club_id, 'bulletins', target_user_id) then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (existing.club_id, target_user_id, 'authorization_denied', '{"action":"update_bulletin"}'::jsonb);
    raise exception 'User cannot update bulletins for this club.' using errcode = '42501';
  end if;

  if nullif(trim(new_title), '') is null
    or nullif(trim(new_bulletin_date), '') is null
    or nullif(trim(new_author_snapshot), '') is null
  then
    raise exception 'Bulletin title, date, and author are required.' using errcode = '23514';
  end if;

  if existing.version <> expected_version then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (
      existing.club_id,
      target_user_id,
      'bulletin_edit_conflict',
      jsonb_build_object('expectedVersion', expected_version, 'currentVersion', existing.version)
    );
    raise exception 'Bulletin changed since it was opened.' using errcode = '40001';
  end if;

  perform set_config('request.dumala_controlled_update', 'on', true);

  update public.bulletins
  set title = trim(new_title),
      content = coalesce(new_content, ''),
      bulletin_date = new_bulletin_date,
      category = new_category,
      author_snapshot = trim(new_author_snapshot),
      updated_by = target_user_id,
      version = version + 1
  where id = target_bulletin_id
  returning * into updated_bulletin;

  perform set_config('request.dumala_controlled_update', 'off', true);

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    updated_bulletin.club_id,
    target_user_id,
    'bulletin_updated',
    jsonb_build_object('category', updated_bulletin.category, 'version', updated_bulletin.version)
  );

  return updated_bulletin;
end;
$$;

create or replace function public.remove_bulletin_controlled(
  target_bulletin_id uuid,
  expected_version bigint
)
returns public.bulletins
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid := auth.uid();
  existing public.bulletins%rowtype;
  removed_bulletin public.bulletins%rowtype;
begin
  if target_user_id is null then
    raise exception 'A signed-in user is required to remove bulletins.' using errcode = '42501';
  end if;

  select *
  into existing
  from public.bulletins
  where id = target_bulletin_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Bulletin was not found.' using errcode = 'P0002';
  end if;

  if not public.user_can_manage_club_table(existing.club_id, 'bulletins', target_user_id) then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (existing.club_id, target_user_id, 'authorization_denied', '{"action":"remove_bulletin"}'::jsonb);
    raise exception 'User cannot remove bulletins for this club.' using errcode = '42501';
  end if;

  if existing.version <> expected_version then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (
      existing.club_id,
      target_user_id,
      'bulletin_edit_conflict',
      jsonb_build_object('expectedVersion', expected_version, 'currentVersion', existing.version)
    );
    raise exception 'Bulletin changed since it was opened.' using errcode = '40001';
  end if;

  perform set_config('request.dumala_controlled_update', 'on', true);

  update public.bulletins
  set deleted_at = now(),
      updated_by = target_user_id,
      version = version + 1
  where id = target_bulletin_id
  returning * into removed_bulletin;

  perform set_config('request.dumala_controlled_update', 'off', true);

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    removed_bulletin.club_id,
    target_user_id,
    'bulletin_removed',
    jsonb_build_object('category', removed_bulletin.category, 'version', removed_bulletin.version)
  );

  return removed_bulletin;
end;
$$;

grant execute on function public.update_bulletin_controlled(uuid, bigint, text, text, text, public.bulletin_category, text) to authenticated;
grant execute on function public.remove_bulletin_controlled(uuid, bigint) to authenticated;
grant execute on function public.apply_controlled_record_update(text, uuid, bigint, jsonb) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    'player_availability',
    'coach_notes',
    'weekly_training_schedules',
    'tactics_workspaces',
    'tactics_lineup_assignments',
    'tactics_draw_paths',
    'tactics_notes',
    'tactics_player_extras'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_block_direct_update', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.block_direct_versioned_update()',
      table_name || '_block_direct_update',
      table_name
    );
  end loop;
end;
$$;
