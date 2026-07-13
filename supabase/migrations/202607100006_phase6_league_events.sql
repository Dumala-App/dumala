-- Phase 6 - League events + registration (backbone).
--
-- Independent events (tournaments/competitions) inside a season, a shareable
-- public registration link, coach applications submitted without an account
-- (like the League-access waitlist), and owner review (approve/reject/waitlist)
-- with team-cap enforcement. Built on the League foundation (202607100004).
-- Draws/brackets, documents, fees, and rosters come later.

-- 1) Enums --------------------------------------------------------------------

create type public.league_event_format as enum ('round_robin', 'single_elimination', 'group_knockout');
create type public.league_event_status as enum ('draft', 'registration_open', 'active', 'completed');
create type public.event_registration_status as enum ('submitted', 'approved', 'rejected', 'waitlisted', 'withdrawn');

-- 2) Tables -------------------------------------------------------------------

create table public.league_events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  name text not null,
  format public.league_event_format not null default 'round_robin',
  category text,
  status public.league_event_status not null default 'draft',
  team_cap integer check (team_cap is null or team_cap between 1 and 512),
  starts_on date,
  ends_on date,
  registration_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_events_name_check check (char_length(name) between 2 and 160),
  constraint league_events_category_check check (category is null or char_length(category) <= 80),
  constraint league_events_notes_check check (notes is null or char_length(notes) <= 2000),
  constraint league_events_date_order_check check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint league_events_code_check check (registration_code ~ '^[A-Z0-9]{6,16}$')
);

create trigger league_events_set_updated_at
before update on public.league_events
for each row execute function public.set_updated_at();

create index league_events_league_status_idx on public.league_events(league_id, status);
create index league_events_season_idx on public.league_events(season_id);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.league_events(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  club_name text not null,
  team_name text,
  category text,
  contact_name text not null,
  contact_email text not null,
  roster_size integer check (roster_size is null or roster_size between 0 and 200),
  message text,
  status public.event_registration_status not null default 'submitted',
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_club_check check (char_length(club_name) between 2 and 160),
  constraint event_registrations_team_check check (team_name is null or char_length(team_name) <= 160),
  constraint event_registrations_category_check check (category is null or char_length(category) <= 80),
  constraint event_registrations_contact_check check (char_length(contact_name) between 2 and 120),
  constraint event_registrations_email_check check (char_length(contact_email) between 3 and 160),
  constraint event_registrations_message_check check (message is null or char_length(message) <= 1000),
  constraint event_registrations_note_check check (review_note is null or char_length(review_note) <= 1000)
);

create trigger event_registrations_set_updated_at
before update on public.event_registrations
for each row execute function public.set_updated_at();

create index event_registrations_event_status_idx on public.event_registrations(event_id, status);
-- One open application per email per event.
create unique index event_registrations_open_email_idx
on public.event_registrations(event_id, lower(contact_email))
where status in ('submitted', 'waitlisted', 'approved');

-- 3) Ownership helper ---------------------------------------------------------

create or replace function public.owns_event(target_event_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_events e
    join public.leagues l on l.id = e.league_id
    where e.id = target_event_id
      and l.owner_user_id = target_user_id
  );
$$;

-- 4) RPCs ---------------------------------------------------------------------

create or replace function public.advance_event_status(
  event_id uuid,
  next_status public.league_event_status
)
returns public.league_event_status
language plpgsql
security definer
set search_path = public
as $$
declare
  event_league uuid;
  current_status public.league_event_status;
  allowed boolean;
begin
  select league_id, status into event_league, current_status
  from public.league_events where id = event_id;

  if event_league is null then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(event_league) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  allowed := (current_status = 'draft' and next_status = 'registration_open')
    or (current_status = 'registration_open' and next_status = 'active')
    or (current_status = 'active' and next_status = 'completed');

  if not allowed then
    raise exception 'INVALID_EVENT_TRANSITION' using errcode = '22023';
  end if;

  update public.league_events set status = next_status where id = event_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_status_advanced', 'eventId', event_id, 'from', current_status, 'to', next_status));

  return next_status;
end;
$$;

-- Public: resolve an event by its registration code for the application form.
create or replace function public.lookup_event_registration(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ev public.league_events%rowtype;
  approved_count integer;
begin
  select * into ev from public.league_events where registration_code = upper(btrim(coalesce(code, '')));
  if not found then
    return jsonb_build_object('found', false);
  end if;

  if ev.status <> 'registration_open' then
    return jsonb_build_object('found', true, 'open', false, 'name', ev.name, 'status', ev.status);
  end if;

  select count(*) into approved_count from public.event_registrations where event_id = ev.id and status = 'approved';

  return jsonb_build_object(
    'found', true,
    'open', true,
    'eventId', ev.id,
    'name', ev.name,
    'category', ev.category,
    'format', ev.format,
    'teamCap', ev.team_cap,
    'spotsRemaining', case when ev.team_cap is null then null else greatest(0, ev.team_cap - approved_count) end
  );
end;
$$;

-- Public: submit an application via the registration code.
create or replace function public.submit_event_registration(
  code text,
  club_name text,
  team_name text default null,
  category text default null,
  contact_name text default null,
  contact_email text default null,
  roster_size integer default null,
  message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.league_events%rowtype;
  normalized_club text := nullif(btrim(coalesce(club_name, '')), '');
  normalized_name text := nullif(btrim(coalesce(contact_name, '')), '');
  normalized_email text := lower(nullif(btrim(coalesce(contact_email, '')), ''));
  open_count integer;
  registration_id uuid;
begin
  select * into ev from public.league_events where registration_code = upper(btrim(coalesce(code, '')));
  if not found then
    raise exception 'INVALID_REGISTRATION_CODE' using errcode = 'P0002';
  end if;
  if ev.status <> 'registration_open' then
    raise exception 'REGISTRATION_CLOSED' using errcode = '22023';
  end if;

  if normalized_club is null then
    raise exception 'CLUB_NAME_REQUIRED' using errcode = '22023';
  end if;
  if normalized_name is null then
    raise exception 'CONTACT_NAME_REQUIRED' using errcode = '22023';
  end if;
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'CONTACT_EMAIL_INVALID' using errcode = '22023';
  end if;

  select count(*) into open_count
  from public.event_registrations reg
  where reg.event_id = ev.id
    and lower(reg.contact_email) = normalized_email
    and reg.status in ('submitted', 'waitlisted', 'approved');
  if open_count > 0 then
    raise exception 'ALREADY_REGISTERED' using errcode = '23505';
  end if;

  insert into public.event_registrations (
    event_id, league_id, club_name, team_name, category, contact_name, contact_email, roster_size, message
  ) values (
    ev.id, ev.league_id, normalized_club,
    nullif(btrim(coalesce(team_name, '')), ''),
    nullif(btrim(coalesce(category, '')), ''),
    normalized_name, normalized_email, roster_size,
    nullif(btrim(coalesce(message, '')), '')
  )
  returning id into registration_id;

  return registration_id;
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
begin
  select * into reg from public.event_registrations where id = registration_id;
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
      where event_id = reg.event_id and status = 'approved' and id <> registration_id;
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
  where id = registration_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_registration_reviewed', 'registrationId', registration_id, 'status', next_status));

  return jsonb_build_object('registrationId', registration_id, 'status', next_status);
end;
$$;

-- 5) Row level security -------------------------------------------------------

alter table public.league_events enable row level security;
alter table public.event_registrations enable row level security;

create policy "owners read own events"
on public.league_events for select to authenticated
using (public.owns_league(league_id));
create policy "owners create events"
on public.league_events for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own events"
on public.league_events for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own events"
on public.league_events for delete to authenticated
using (public.owns_league(league_id));

-- Registrations: owner reads + manages; inserts come from the public RPC only.
create policy "owners read own registrations"
on public.event_registrations for select to authenticated
using (public.owns_league(league_id));
create policy "owners update own registrations"
on public.event_registrations for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));

-- 6) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.league_events to authenticated;
grant select, update on public.event_registrations to authenticated;

grant execute on function public.owns_event(uuid, uuid) to authenticated;
grant execute on function public.advance_event_status(uuid, public.league_event_status) to authenticated;
grant execute on function public.lookup_event_registration(text) to anon, authenticated;
grant execute on function public.submit_event_registration(text, text, text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.review_event_registration(uuid, public.event_registration_status, text) to authenticated;
