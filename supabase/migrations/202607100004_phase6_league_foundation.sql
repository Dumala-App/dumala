-- Phase 6 - League Owner app foundation (backbone slice).
--
-- The League Owner app's data spine: a league profile, seasons with a controlled
-- lifecycle (Draft -> Registration open -> Active -> Completed -> Archived), and
-- venues. Owner-scoped under RLS; only League-persona accounts holding the
-- league_pilot entitlement can own a league. Every season starts empty - nothing
-- is copied forward. Independent events, registration, tournaments, statistics,
-- and finance arrive in later slices.

-- 1) Enum ---------------------------------------------------------------------

create type public.league_season_status as enum (
  'draft',
  'registration_open',
  'active',
  'completed',
  'archived'
);

-- 2) Access helpers -----------------------------------------------------------

-- Only a League-persona account with an active league_pilot entitlement may own
-- a league. Gates creation so coach/player accounts cannot.
create or replace function public.is_league_owner(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.user_id = target_user_id
      and p.persona = 'league'
  ) and public.is_entitled('league_pilot', target_user_id);
$$;

-- 3) Tables -------------------------------------------------------------------

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_name text,
  logo_color text not null default '#f97316',
  contact_email text,
  location text,
  description text,
  timezone text not null default 'Asia/Manila',
  state text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_name_check check (char_length(name) between 2 and 160),
  constraint leagues_short_name_check check (short_name is null or char_length(short_name) <= 40),
  constraint leagues_contact_email_check check (contact_email is null or char_length(contact_email) <= 160),
  constraint leagues_location_check check (location is null or char_length(location) <= 160),
  constraint leagues_description_check check (description is null or char_length(description) <= 2000),
  constraint leagues_logo_color_check check (logo_color ~ '^#[0-9a-fA-F]{6}$'),
  constraint leagues_state_check check (state in ('active', 'archived'))
);

create trigger leagues_set_updated_at
before update on public.leagues
for each row execute function public.set_updated_at();

create index leagues_owner_idx on public.leagues(owner_user_id);

create table public.league_seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  name text not null,
  year integer check (year is null or year between 1900 and 2200),
  status public.league_season_status not null default 'draft',
  starts_on date,
  ends_on date,
  registration_opens_on date,
  registration_closes_on date,
  roster_deadline date,
  transfer_window_opens_on date,
  transfer_window_closes_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_seasons_name_check check (char_length(name) between 2 and 160),
  constraint league_seasons_notes_check check (notes is null or char_length(notes) <= 2000),
  constraint league_seasons_date_order_check check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create trigger league_seasons_set_updated_at
before update on public.league_seasons
for each row execute function public.set_updated_at();

create index league_seasons_league_status_idx on public.league_seasons(league_id, status);

create table public.league_venues (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  name text not null,
  address text,
  capacity integer check (capacity is null or capacity >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_venues_name_check check (char_length(name) between 2 and 160),
  constraint league_venues_address_check check (address is null or char_length(address) <= 300),
  constraint league_venues_notes_check check (notes is null or char_length(notes) <= 2000)
);

create trigger league_venues_set_updated_at
before update on public.league_venues
for each row execute function public.set_updated_at();

create index league_venues_league_idx on public.league_venues(league_id);

-- Ownership check for season/venue RLS (defined after `leagues` exists).
create or replace function public.owns_league(
  target_league_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leagues l
    where l.id = target_league_id
      and l.owner_user_id = target_user_id
  );
$$;

-- 4) Season lifecycle ----------------------------------------------------------
-- Forward-only state machine. Content gates (no closing while disputes/fixtures/
-- stats/payments are unresolved) arrive with those later features.

create or replace function public.advance_season_status(
  season_id uuid,
  next_status public.league_season_status
)
returns public.league_season_status
language plpgsql
security definer
set search_path = public
as $$
declare
  season_league uuid;
  current_status public.league_season_status;
  allowed boolean;
begin
  select league_id, status into season_league, current_status
  from public.league_seasons
  where id = season_id;

  if season_league is null then
    raise exception 'SEASON_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.owns_league(season_league) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  allowed := (current_status = 'draft' and next_status = 'registration_open')
    or (current_status = 'registration_open' and next_status = 'active')
    or (current_status = 'active' and next_status = 'completed')
    or (current_status = 'completed' and next_status = 'archived');

  if not allowed then
    raise exception 'INVALID_SEASON_TRANSITION' using errcode = '22023';
  end if;

  update public.league_seasons
  set status = next_status
  where id = season_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'season_status_advanced', 'seasonId', season_id, 'from', current_status, 'to', next_status)
  );

  return next_status;
end;
$$;

-- 5) Row level security -------------------------------------------------------

alter table public.leagues enable row level security;
alter table public.league_seasons enable row level security;
alter table public.league_venues enable row level security;

create policy "owners read own leagues"
on public.leagues for select to authenticated
using (owner_user_id = auth.uid());
create policy "league owners create leagues"
on public.leagues for insert to authenticated
with check (owner_user_id = auth.uid() and public.is_league_owner());
create policy "owners update own leagues"
on public.leagues for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
create policy "owners delete own leagues"
on public.leagues for delete to authenticated
using (owner_user_id = auth.uid());

create policy "owners read own seasons"
on public.league_seasons for select to authenticated
using (public.owns_league(league_id));
create policy "owners manage own seasons"
on public.league_seasons for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own seasons"
on public.league_seasons for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own seasons"
on public.league_seasons for delete to authenticated
using (public.owns_league(league_id));

create policy "owners read own venues"
on public.league_venues for select to authenticated
using (public.owns_league(league_id));
create policy "owners manage own venues"
on public.league_venues for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own venues"
on public.league_venues for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own venues"
on public.league_venues for delete to authenticated
using (public.owns_league(league_id));

-- 6) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.leagues to authenticated;
grant select, insert, update, delete on public.league_seasons to authenticated;
grant select, insert, update, delete on public.league_venues to authenticated;

grant execute on function public.is_league_owner(uuid) to authenticated;
grant execute on function public.owns_league(uuid, uuid) to authenticated;
grant execute on function public.advance_season_status(uuid, public.league_season_status) to authenticated;
