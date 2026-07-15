-- Phase 6 - League coach organization (backbone).
--
-- Lets a League owner affiliate coach accounts under their organization. The
-- league carries a seat quota (default 10, owner-adjustable) and a single
-- shareable invite code. A coach - new or existing - applies through the code;
-- the owner reviews each application and a seat is consumed only on approval.
--
-- Affiliation is directory + easy-entry only: it tags a coach as belonging to
-- the organization and lets the owner see a directory of their coaches. It does
-- NOT grant the owner any access to a coach's private club/team data. An
-- affiliated coach stays a coach account - affiliation is a separate link, not
-- a persona change, so "one account = one app" still holds.

-- 1) Enum ---------------------------------------------------------------------

create type public.league_coach_status as enum ('pending', 'active', 'declined', 'removed');

-- 2) League seat quota + invite code ------------------------------------------

alter table public.leagues
  add column coach_seat_limit integer not null default 10,
  add column coach_invite_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table public.leagues
  add constraint leagues_coach_seat_limit_check check (coach_seat_limit between 0 and 1000),
  add constraint leagues_coach_invite_code_check check (coach_invite_code ~ '^[A-Z0-9]{6,16}$');

-- Distinct code per league so an invite resolves to exactly one organization.
create unique index leagues_coach_invite_code_idx on public.leagues(coach_invite_code);

-- 3) Membership table ---------------------------------------------------------

create table public.league_coach_memberships (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  coach_user_id uuid not null references auth.users(id) on delete cascade,
  coach_name text not null,
  coach_email text not null,
  message text,
  status public.league_coach_status not null default 'pending',
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_coach_name_check check (char_length(coach_name) between 2 and 120),
  constraint league_coach_email_check check (char_length(coach_email) between 3 and 160),
  constraint league_coach_message_check check (message is null or char_length(message) <= 1000),
  constraint league_coach_note_check check (review_note is null or char_length(review_note) <= 1000)
);

create trigger league_coach_memberships_set_updated_at
before update on public.league_coach_memberships
for each row execute function public.set_updated_at();

create index league_coach_memberships_league_status_idx
on public.league_coach_memberships(league_id, status);

-- One open (pending or active) membership per coach per league.
create unique index league_coach_memberships_open_idx
on public.league_coach_memberships(league_id, coach_user_id)
where status in ('pending', 'active');

-- 4) RPCs ---------------------------------------------------------------------

-- Resolve an invite code so an applying coach sees which organization it is and
-- whether seats remain. Available before sign-in (like lookup_event_registration).
create or replace function public.resolve_league_org_invite(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lg public.leagues%rowtype;
  active_count integer;
begin
  select * into lg from public.leagues where coach_invite_code = upper(btrim(coalesce(code, '')));
  if not found then
    return jsonb_build_object('found', false);
  end if;

  select count(*) into active_count
  from public.league_coach_memberships
  where league_id = lg.id and status = 'active';

  return jsonb_build_object(
    'found', true,
    'leagueId', lg.id,
    'leagueName', lg.name,
    'location', lg.location,
    'seatLimit', lg.coach_seat_limit,
    'seatsRemaining', greatest(0, lg.coach_seat_limit - active_count),
    'open', active_count < lg.coach_seat_limit
  );
end;
$$;

-- A signed-in coach applies to a league organization via its invite code. The
-- caller must be a coach account (persona coach, or a fresh account that has no
-- persona yet); league/player accounts and the league's own owner are blocked.
-- Seats are not checked here - only when the owner approves.
create or replace function public.apply_to_league_org(
  code text,
  coach_name text,
  coach_email text,
  message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lg public.leagues%rowtype;
  caller_persona public.account_persona;
  normalized_name text := nullif(btrim(coalesce(coach_name, '')), '');
  normalized_email text := lower(nullif(btrim(coalesce(coach_email, '')), ''));
  open_count integer;
  membership_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into lg from public.leagues where coach_invite_code = upper(btrim(coalesce(code, '')));
  if not found then
    raise exception 'INVALID_INVITE_CODE' using errcode = 'P0002';
  end if;

  if lg.owner_user_id = auth.uid() then
    raise exception 'OWNER_CANNOT_JOIN' using errcode = '42501';
  end if;

  select persona into caller_persona from public.user_profiles where user_id = auth.uid();
  -- A missing profile is treated as a fresh coach (matches resolve_app_destination).
  if caller_persona is not null and caller_persona <> 'coach' then
    raise exception 'COACH_ACCOUNT_REQUIRED' using errcode = '42501';
  end if;

  if normalized_name is null then
    raise exception 'COACH_NAME_REQUIRED' using errcode = '22023';
  end if;
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'COACH_EMAIL_INVALID' using errcode = '22023';
  end if;

  select count(*) into open_count
  from public.league_coach_memberships
  where league_id = lg.id and coach_user_id = auth.uid() and status in ('pending', 'active');
  if open_count > 0 then
    raise exception 'ALREADY_APPLIED' using errcode = '23505';
  end if;

  insert into public.league_coach_memberships (league_id, coach_user_id, coach_name, coach_email, message)
  values (lg.id, auth.uid(), normalized_name, normalized_email, nullif(btrim(coalesce(message, '')), ''))
  returning id into membership_id;

  return membership_id;
end;
$$;

-- Owner reviews an application. Approving enforces the seat cap against the
-- current active count; removing/declining frees a seat.
create or replace function public.review_league_coach_membership(
  membership_id uuid,
  next_status public.league_coach_status,
  note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  member public.league_coach_memberships%rowtype;
  seat_limit integer;
  active_count integer;
begin
  select * into member from public.league_coach_memberships where id = membership_id;
  if not found then
    raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(member.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if next_status not in ('active', 'declined', 'removed') then
    raise exception 'INVALID_REVIEW_STATUS' using errcode = '22023';
  end if;

  if next_status = 'active' and member.status <> 'active' then
    select coach_seat_limit into seat_limit from public.leagues where id = member.league_id;
    select count(*) into active_count
    from public.league_coach_memberships
    where league_id = member.league_id and status = 'active' and id <> membership_id;
    if active_count >= seat_limit then
      raise exception 'SEAT_LIMIT_REACHED' using errcode = '22023';
    end if;
  end if;

  update public.league_coach_memberships
  set status = next_status,
      review_note = nullif(btrim(coalesce(note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = membership_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'league_coach_reviewed', 'membershipId', membership_id, 'status', next_status));

  return jsonb_build_object('membershipId', membership_id, 'status', next_status);
end;
$$;

-- Owner rotates the invite code (invalidates the old link). Returns the new code.
create or replace function public.rotate_league_coach_invite(target_league_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.owns_league(target_league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.leagues set coach_invite_code = new_code where id = target_league_id;

  return new_code;
end;
$$;

-- 5) Row level security -------------------------------------------------------

alter table public.league_coach_memberships enable row level security;

-- Owner reads and manages memberships for leagues they own.
create policy "owners read league coaches"
on public.league_coach_memberships for select to authenticated
using (public.owns_league(league_id));
create policy "owners update league coaches"
on public.league_coach_memberships for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));

-- A coach reads their own membership rows (to see affiliation status). Inserts
-- come only through apply_to_league_org(); there is no direct insert policy.
create policy "coaches read own memberships"
on public.league_coach_memberships for select to authenticated
using (coach_user_id = auth.uid());

-- 6) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.league_coach_memberships to authenticated;

grant execute on function public.resolve_league_org_invite(text) to anon, authenticated;
grant execute on function public.apply_to_league_org(text, text, text, text) to authenticated;
grant execute on function public.review_league_coach_membership(uuid, public.league_coach_status, text) to authenticated;
grant execute on function public.rotate_league_coach_invite(uuid) to authenticated;
