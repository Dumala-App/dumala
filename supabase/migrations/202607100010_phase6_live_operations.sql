-- Phase 6 - Live operations (match-day command center backbone).
--
-- On-the-day essentials: team check-in and an assigned official per fixture, and
-- an incident log for the event. Match-sheet detail beyond the result, delegated
-- staff login, and the offline queue come later. Built on the tournament engine
-- (202607100007) and reuses owns_league.

-- 1) Check-in + official on fixtures -------------------------------------------

alter table public.event_fixtures add column home_checked_in boolean not null default false;
alter table public.event_fixtures add column away_checked_in boolean not null default false;
alter table public.event_fixtures add column official_name text;
alter table public.event_fixtures add constraint event_fixtures_official_check
  check (official_name is null or char_length(official_name) <= 120);

-- 2) Incidents ----------------------------------------------------------------

create type public.incident_kind as enum ('injury', 'misconduct', 'dispute', 'delay', 'other');

create table public.event_incidents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  fixture_id uuid references public.event_fixtures(id) on delete set null,
  team_id uuid references public.event_teams(id) on delete set null,
  kind public.incident_kind not null default 'other',
  summary text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_incidents_summary_check check (char_length(summary) between 1 and 500)
);

create trigger event_incidents_set_updated_at
before update on public.event_incidents
for each row execute function public.set_updated_at();

create index event_incidents_event_idx on public.event_incidents(event_id, occurred_at);

-- 3) Row level security -------------------------------------------------------

alter table public.event_incidents enable row level security;

create policy "owners read own incidents"
on public.event_incidents for select to authenticated
using (public.owns_league(league_id));
create policy "owners create incidents"
on public.event_incidents for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own incidents"
on public.event_incidents for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own incidents"
on public.event_incidents for delete to authenticated
using (public.owns_league(league_id));

-- 4) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.event_incidents to authenticated;
