-- Phase 6 - Statistics + awards (backbone).
--
-- Match stat events (goals/assists/cards attributed to a team and a named
-- player) recorded against fixtures, plus event awards the owner assigns to a
-- team or a player. Leaderboards (top scorers, discipline) and award
-- suggestions are derived in the app from a shared, unit-tested helper — there
-- are no aggregate tables to keep in sync. Certificates and a public
-- verification workflow come later. Built on the tournament engine
-- (202607100007) and reuses owns_league.

-- 1) Enums --------------------------------------------------------------------

create type public.fixture_stat_type as enum ('goal', 'assist', 'yellow_card', 'red_card', 'own_goal');
create type public.award_recipient_type as enum ('team', 'player');

-- 2) Tables -------------------------------------------------------------------

create table public.fixture_stat_events (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.event_fixtures(id) on delete cascade,
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid not null references public.event_teams(id) on delete cascade,
  player_name text not null,
  stat_type public.fixture_stat_type not null,
  minute integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixture_stat_events_player_check check (char_length(player_name) between 1 and 120),
  constraint fixture_stat_events_minute_check check (minute is null or minute between 0 and 200),
  constraint fixture_stat_events_note_check check (note is null or char_length(note) <= 200)
);

create trigger fixture_stat_events_set_updated_at
before update on public.fixture_stat_events
for each row execute function public.set_updated_at();

create index fixture_stat_events_event_idx on public.fixture_stat_events(event_id);
create index fixture_stat_events_fixture_idx on public.fixture_stat_events(fixture_id);

create table public.event_awards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  title text not null,
  recipient_type public.award_recipient_type not null,
  team_id uuid references public.event_teams(id) on delete set null,
  player_name text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_awards_title_check check (char_length(title) between 1 and 120),
  constraint event_awards_player_check check (player_name is null or char_length(player_name) <= 120),
  constraint event_awards_note_check check (note is null or char_length(note) <= 300),
  -- A team award names a team; a player award names a player.
  constraint event_awards_recipient_check check (
    (recipient_type = 'team' and team_id is not null) or
    (recipient_type = 'player' and player_name is not null)
  )
);

create trigger event_awards_set_updated_at
before update on public.event_awards
for each row execute function public.set_updated_at();

create index event_awards_event_idx on public.event_awards(event_id);

-- 3) Row level security -------------------------------------------------------

alter table public.fixture_stat_events enable row level security;
alter table public.event_awards enable row level security;

create policy "owners read own stat events"
on public.fixture_stat_events for select to authenticated
using (public.owns_league(league_id));
create policy "owners create stat events"
on public.fixture_stat_events for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own stat events"
on public.fixture_stat_events for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own stat events"
on public.fixture_stat_events for delete to authenticated
using (public.owns_league(league_id));

create policy "owners read own awards"
on public.event_awards for select to authenticated
using (public.owns_league(league_id));
create policy "owners create awards"
on public.event_awards for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own awards"
on public.event_awards for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own awards"
on public.event_awards for delete to authenticated
using (public.owns_league(league_id));

-- 4) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.fixture_stat_events to authenticated;
grant select, insert, update, delete on public.event_awards to authenticated;
