-- Phase 6 - Tournament engine (round-robin backbone).
--
-- Turns an event's confirmed teams into a competition: a stable team roster per
-- event (seeded from approved registrations or added by hand), fixtures, and
-- match results. Standings are derived from results (computed in the app from a
-- shared, unit-tested helper), so there is no standings table to keep in sync.
-- Draws/brackets, groups, conflict detection, and calendar publication come
-- later. Built on the events layer (202607100006) and reuses owns_league.

-- 1) Enum ---------------------------------------------------------------------

create type public.event_fixture_status as enum ('scheduled', 'completed', 'cancelled');

-- 2) Tables -------------------------------------------------------------------

create table public.event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete set null,
  name text not null,
  seed integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_teams_name_check check (char_length(name) between 1 and 160),
  constraint event_teams_seed_check check (seed is null or seed between 1 and 512)
);

create trigger event_teams_set_updated_at
before update on public.event_teams
for each row execute function public.set_updated_at();

create index event_teams_event_idx on public.event_teams(event_id);
-- A given approved registration maps to at most one team per event.
create unique index event_teams_registration_idx
on public.event_teams(event_id, registration_id)
where registration_id is not null;

create table public.event_fixtures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  round integer not null default 1,
  sequence integer,
  home_team_id uuid not null references public.event_teams(id) on delete cascade,
  away_team_id uuid not null references public.event_teams(id) on delete cascade,
  status public.event_fixture_status not null default 'scheduled',
  home_score integer,
  away_score integer,
  kickoff_at timestamptz,
  venue_id uuid references public.league_venues(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_fixtures_round_check check (round >= 1),
  constraint event_fixtures_distinct_teams_check check (home_team_id <> away_team_id),
  constraint event_fixtures_home_score_check check (home_score is null or home_score between 0 and 999),
  constraint event_fixtures_away_score_check check (away_score is null or away_score between 0 and 999)
);

create trigger event_fixtures_set_updated_at
before update on public.event_fixtures
for each row execute function public.set_updated_at();

create index event_fixtures_event_round_idx on public.event_fixtures(event_id, round, sequence);

-- 3) RPC: record a result -----------------------------------------------------

create or replace function public.record_fixture_result(
  fixture_id uuid,
  home_score integer,
  away_score integer
)
returns public.event_fixtures
language plpgsql
security definer
set search_path = public
as $$
declare
  fixture_league uuid;
  updated public.event_fixtures%rowtype;
begin
  select league_id into fixture_league from public.event_fixtures where id = fixture_id;
  if fixture_league is null then
    raise exception 'FIXTURE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(fixture_league) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if home_score is null or away_score is null or home_score < 0 or away_score < 0 then
    raise exception 'INVALID_SCORE' using errcode = '22023';
  end if;

  update public.event_fixtures
  set home_score = record_fixture_result.home_score,
      away_score = record_fixture_result.away_score,
      status = 'completed'
  where id = fixture_id
  returning * into updated;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'fixture_result_recorded', 'fixtureId', fixture_id,
      'homeScore', home_score, 'awayScore', away_score));

  return updated;
end;
$$;

-- 4) Row level security -------------------------------------------------------

alter table public.event_teams enable row level security;
alter table public.event_fixtures enable row level security;

create policy "owners read own teams"
on public.event_teams for select to authenticated
using (public.owns_league(league_id));
create policy "owners create teams"
on public.event_teams for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own teams"
on public.event_teams for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own teams"
on public.event_teams for delete to authenticated
using (public.owns_league(league_id));

create policy "owners read own fixtures"
on public.event_fixtures for select to authenticated
using (public.owns_league(league_id));
create policy "owners create fixtures"
on public.event_fixtures for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own fixtures"
on public.event_fixtures for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own fixtures"
on public.event_fixtures for delete to authenticated
using (public.owns_league(league_id));

-- 5) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.event_teams to authenticated;
grant select, insert, update, delete on public.event_fixtures to authenticated;
grant execute on function public.record_fixture_result(uuid, integer, integer) to authenticated;
