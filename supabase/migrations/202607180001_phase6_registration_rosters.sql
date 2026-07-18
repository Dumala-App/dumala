-- Phase 6 - Registration and rosters.
--
-- Adds event roster controls tied to approved registrations. Approval now
-- creates the event team automatically, owners can manage player rows until the
-- roster is locked or the season deadline passes, and transfer/release changes
-- are constrained to the season transfer window.

create type public.event_roster_player_status as enum ('active', 'transferred', 'released');

alter table public.event_teams
  add column if not exists roster_locked boolean not null default false,
  add column if not exists roster_locked_at timestamptz,
  add column if not exists roster_locked_by uuid references auth.users(id) on delete set null;

create table public.event_roster_players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  league_id uuid not null,
  team_id uuid not null,
  registration_id uuid,
  full_name text not null,
  birthdate date,
  shirt_number integer,
  status public.event_roster_player_status not null default 'active',
  transfer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_roster_players_team_fk
    foreign key (team_id, event_id, league_id)
    references public.event_teams(id, event_id, league_id)
    on delete cascade,
  constraint event_roster_players_registration_fk
    foreign key (registration_id, event_id, league_id)
    references public.event_registrations(id, event_id, league_id),
  constraint event_roster_players_event_fk
    foreign key (event_id, league_id)
    references public.league_events(id, league_id)
    on delete cascade,
  constraint event_roster_players_name_check check (char_length(full_name) between 2 and 140),
  constraint event_roster_players_shirt_check check (shirt_number is null or shirt_number between 0 and 999),
  constraint event_roster_players_note_check check (transfer_note is null or char_length(transfer_note) <= 1000)
);

create trigger event_roster_players_set_updated_at
before update on public.event_roster_players
for each row execute function public.set_updated_at();

create index event_roster_players_event_idx on public.event_roster_players(event_id);
create index event_roster_players_team_status_idx on public.event_roster_players(team_id, status);
create unique index event_roster_players_active_name_idx
on public.event_roster_players(team_id, lower(full_name))
where status = 'active';

create or replace function public.roster_window_open(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(s.roster_deadline is null or current_date <= s.roster_deadline, false)
  from public.league_events e
  join public.league_seasons s on s.id = e.season_id
  where e.id = target_event_id;
$$;

create or replace function public.transfer_window_open(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (s.transfer_window_opens_on is null or current_date >= s.transfer_window_opens_on)
    and (s.transfer_window_closes_on is null or current_date <= s.transfer_window_closes_on),
    false
  )
  from public.league_events e
  join public.league_seasons s on s.id = e.season_id
  where e.id = target_event_id;
$$;

create or replace function public.add_event_roster_player(
  team_id uuid,
  full_name text,
  birthdate date default null,
  shirt_number integer default null
)
returns public.event_roster_players
language plpgsql
security definer
set search_path = public
as $$
declare
  team public.event_teams%rowtype;
  inserted public.event_roster_players%rowtype;
  normalized_name text := nullif(btrim(coalesce(full_name, '')), '');
begin
  select * into team from public.event_teams where id = team_id;
  if not found then
    raise exception 'TEAM_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(team.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if team.roster_locked then
    raise exception 'ROSTER_LOCKED' using errcode = '22023';
  end if;
  if not public.roster_window_open(team.event_id) then
    raise exception 'ROSTER_DEADLINE_PASSED' using errcode = '22023';
  end if;
  if normalized_name is null then
    raise exception 'PLAYER_NAME_REQUIRED' using errcode = '22023';
  end if;

  insert into public.event_roster_players (
    event_id, league_id, team_id, registration_id, full_name, birthdate, shirt_number
  ) values (
    team.event_id, team.league_id, team.id, team.registration_id, normalized_name, birthdate, shirt_number
  )
  returning * into inserted;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_roster_player_added', 'teamId', team.id, 'playerId', inserted.id));

  return inserted;
end;
$$;

create or replace function public.remove_event_roster_player(player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.event_roster_players%rowtype;
  locked boolean;
begin
  select * into player from public.event_roster_players where id = player_id;
  if not found then
    raise exception 'ROSTER_PLAYER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(player.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  select roster_locked into locked from public.event_teams where id = player.team_id;
  if locked then
    raise exception 'ROSTER_LOCKED' using errcode = '22023';
  end if;
  if not public.roster_window_open(player.event_id) then
    raise exception 'ROSTER_DEADLINE_PASSED' using errcode = '22023';
  end if;

  delete from public.event_roster_players where id = player_id;
end;
$$;

create or replace function public.lock_event_team_roster(team_id uuid)
returns public.event_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  team public.event_teams%rowtype;
begin
  select * into team from public.event_teams where id = team_id;
  if not found then
    raise exception 'TEAM_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(team.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  update public.event_teams
  set roster_locked = true,
      roster_locked_at = now(),
      roster_locked_by = auth.uid()
  where id = team_id
  returning * into team;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_team_roster_locked', 'teamId', team_id));

  return team;
end;
$$;

create or replace function public.mark_event_roster_player_status(
  player_id uuid,
  next_status public.event_roster_player_status,
  note text default null
)
returns public.event_roster_players
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.event_roster_players%rowtype;
begin
  select * into player from public.event_roster_players where id = player_id;
  if not found then
    raise exception 'ROSTER_PLAYER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(player.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if next_status = 'active' then
    raise exception 'INVALID_ROSTER_STATUS' using errcode = '22023';
  end if;
  if not public.transfer_window_open(player.event_id) then
    raise exception 'TRANSFER_WINDOW_CLOSED' using errcode = '22023';
  end if;

  update public.event_roster_players
  set status = next_status,
      transfer_note = nullif(btrim(coalesce(note, '')), '')
  where id = player_id
  returning * into player;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_roster_player_status_changed', 'playerId', player_id, 'status', next_status));

  return player;
end;
$$;

create or replace function public.review_event_registration(
  registration_id uuid,
  next_status public.event_registration_status,
  note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reg public.event_registrations%rowtype;
  cap integer;
  approved_count integer;
  team_id uuid;
  team_name text;
begin
  select * into reg from public.event_registrations where id = $1;
  if not found then
    raise exception 'REGISTRATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(reg.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if next_status not in ('approved', 'rejected', 'waitlisted') then
    raise exception 'INVALID_REVIEW_STATUS' using errcode = '22023';
  end if;

  if next_status = 'approved' then
    select team_cap into cap from public.league_events where id = reg.event_id;
    if cap is not null then
      select count(*) into approved_count
      from public.event_registrations
      where event_id = reg.event_id and status = 'approved' and id <> $1;
      if approved_count >= cap then
        raise exception 'EVENT_CAP_FULL' using errcode = '22023';
      end if;
    end if;
  end if;

  update public.event_registrations
  set status = next_status,
      review_note = nullif(btrim(coalesce(note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = $1;

  if next_status = 'approved' then
    team_name := coalesce(nullif(btrim(reg.team_name), ''), btrim(reg.club_name));
    select t.id into team_id
    from public.event_teams t
    where t.event_id = reg.event_id and t.registration_id = reg.id;

    if team_id is null then
      insert into public.event_teams (event_id, league_id, registration_id, name)
      values (reg.event_id, reg.league_id, reg.id, team_name)
      returning id into team_id;
    else
      update public.event_teams
      set name = team_name
      where event_teams.id = team_id;
    end if;
  end if;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_registration_reviewed', 'registrationId', $1, 'status', next_status, 'teamId', team_id));

  return jsonb_build_object('registrationId', $1, 'status', next_status, 'teamId', team_id);
end;
$$;

alter table public.event_roster_players enable row level security;

create policy "owners read own roster players"
on public.event_roster_players for select to authenticated
using (public.owns_league(league_id));
create policy "owners create roster players"
on public.event_roster_players for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own roster players"
on public.event_roster_players for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own roster players"
on public.event_roster_players for delete to authenticated
using (public.owns_league(league_id));

grant select, insert, update, delete on public.event_roster_players to authenticated;
grant execute on function public.roster_window_open(uuid) to authenticated;
grant execute on function public.transfer_window_open(uuid) to authenticated;
grant execute on function public.add_event_roster_player(uuid, text, date, integer) to authenticated;
grant execute on function public.remove_event_roster_player(uuid) to authenticated;
grant execute on function public.lock_event_team_roster(uuid) to authenticated;
grant execute on function public.mark_event_roster_player_status(uuid, public.event_roster_player_status, text) to authenticated;
