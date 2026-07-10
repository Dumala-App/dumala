-- Phase 6 - Player foundation (backbone slice).
--
-- Adds the Player-app data spine on top of the Phase 6 identity layer: a personal
-- player profile with guardian consent for minors, an invite-and-claim flow where
-- a player requests to join a club and a coach approves (linking the account to a
-- roster entry), and read-only access to the linked club's schedule.
--
-- The Player app is cloud-first: links reference the existing cloud roster
-- (public.players) and the linked club's fixtures (public.games). Everything is
-- gated in the app behind the phase6.playerAppEnabled flag; the Coach app is
-- unchanged. Youth safety is enforced from the start: a minor cannot submit a
-- join request until guardian consent is recorded.

-- 1) Enums --------------------------------------------------------------------

create type public.player_link_request_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.guardian_consent_state as enum ('not_required', 'pending', 'granted', 'revoked');

-- 2) Player profiles ----------------------------------------------------------

create table public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  date_of_birth date,
  position text,
  height numeric check (height is null or height >= 0),
  weight numeric check (weight is null or weight >= 0),
  bio text,
  avatar_url text,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  guardian_consent_state public.guardian_consent_state not null default 'not_required',
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_profiles_display_name_check check (display_name is null or char_length(display_name) <= 120),
  constraint player_profiles_position_check check (position is null or char_length(position) <= 60),
  constraint player_profiles_bio_check check (bio is null or char_length(bio) <= 1000),
  constraint player_profiles_guardian_name_check check (guardian_name is null or char_length(guardian_name) <= 120),
  constraint player_profiles_guardian_email_check check (guardian_email is null or char_length(guardian_email) <= 160)
);

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

-- Minor detection + guardian-consent gating. A minor with no consent is forced to
-- 'pending'; a non-minor is 'not_required'; granting requires guardian details.
create or replace function public.guard_player_profile_minor()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_minor boolean := new.date_of_birth is not null
    and new.date_of_birth > (current_date - interval '18 years')::date;
begin
  if not is_minor then
    new.guardian_consent_state := 'not_required';
    new.guardian_consent_at := null;
    return new;
  end if;

  if new.guardian_consent_state = 'not_required' then
    new.guardian_consent_state := 'pending';
  end if;

  if new.guardian_consent_state = 'granted'
    and (new.guardian_name is null or btrim(new.guardian_name) = '') then
    raise exception 'GUARDIAN_DETAILS_REQUIRED' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger player_profiles_guard_minor
before insert or update on public.player_profiles
for each row execute function public.guard_player_profile_minor();

create or replace function public.player_is_minor(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_profiles p
    where p.user_id = target_user_id
      and p.date_of_birth is not null
      and p.date_of_birth > (current_date - interval '18 years')::date
  );
$$;

-- 3) Club join codes ----------------------------------------------------------

create table public.club_join_codes (
  club_id uuid primary key references public.clubs(id) on delete cascade,
  code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_join_codes_code_check check (code ~ '^[A-Z0-9]{6,16}$')
);

create trigger club_join_codes_set_updated_at
before update on public.club_join_codes
for each row execute function public.set_updated_at();

-- 4) Player link requests (player -> coach approval) --------------------------

create table public.player_link_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  target_player_id uuid references public.players(id) on delete set null,
  claimed_name text not null,
  claimed_roster_number numeric,
  message text,
  status public.player_link_request_status not null default 'pending',
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  resulting_link_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_link_requests_name_check check (char_length(claimed_name) between 1 and 120),
  constraint player_link_requests_message_check check (message is null or char_length(message) <= 1000),
  constraint player_link_requests_note_check check (review_note is null or char_length(review_note) <= 1000)
);

create trigger player_link_requests_set_updated_at
before update on public.player_link_requests
for each row execute function public.set_updated_at();

create index player_link_requests_club_status_idx on public.player_link_requests(club_id, status, created_at desc);
create index player_link_requests_requester_idx on public.player_link_requests(requester_user_id);
-- One open request per (requester, club).
create unique index player_link_requests_open_idx
on public.player_link_requests(requester_user_id, club_id)
where status = 'pending';

-- 5) Player club links (verified link) ----------------------------------------

create table public.player_club_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  state text not null default 'active',
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_club_links_state_check check (state in ('active', 'removed'))
);

create trigger player_club_links_set_updated_at
before update on public.player_club_links
for each row execute function public.set_updated_at();

-- One active account per roster slot, and one active link per (user, club).
create unique index player_club_links_active_player_idx
on public.player_club_links(player_id)
where state = 'active';
create unique index player_club_links_active_user_club_idx
on public.player_club_links(user_id, club_id)
where state = 'active';

create or replace function public.is_linked_player(
  target_club_id uuid,
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
    from public.player_club_links link
    where link.club_id = target_club_id
      and link.user_id = target_user_id
      and link.state = 'active'
  );
$$;

-- 6) RPCs ---------------------------------------------------------------------

-- The player records guardian consent for their own minor profile.
create or replace function public.set_guardian_consent(
  p_guardian_name text,
  p_guardian_email text,
  p_guardian_relationship text
)
returns public.guardian_consent_state
language plpgsql
security definer
set search_path = public
as $$
declare
  next_state public.guardian_consent_state;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_guardian_name, '')), '') is null then
    raise exception 'GUARDIAN_DETAILS_REQUIRED' using errcode = '22023';
  end if;

  update public.player_profiles p
  set guardian_name = btrim(p_guardian_name),
      guardian_email = nullif(btrim(coalesce(p_guardian_email, '')), ''),
      guardian_relationship = nullif(btrim(coalesce(p_guardian_relationship, '')), ''),
      guardian_consent_state = 'granted',
      guardian_consent_at = now()
  where p.user_id = auth.uid()
  returning p.guardian_consent_state into next_state;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  return next_state;
end;
$$;

-- Owner/admin retrieves (or lazily creates) the club's shareable join code.
create or replace function public.get_or_create_club_join_code(target_club_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_code text;
  new_code text;
begin
  if not public.user_has_club_role(target_club_id, array['owner', 'admin']::public.membership_role[]) then
    raise exception 'CLUB_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select code into existing_code from public.club_join_codes where club_id = target_club_id;
  if existing_code is not null then
    return existing_code;
  end if;

  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.club_join_codes (club_id, code, created_by)
  values (target_club_id, new_code, auth.uid())
  on conflict (club_id) do update set code = public.club_join_codes.code
  returning code into new_code;

  return new_code;
end;
$$;

-- A player requests to join a club by its join code.
create or replace function public.request_player_link(
  join_code text,
  claimed_name text,
  claimed_roster_number numeric default null,
  message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(nullif(btrim(coalesce(join_code, '')), ''));
  normalized_name text := nullif(btrim(coalesce(claimed_name, '')), '');
  target_club uuid;
  caller_persona public.account_persona;
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select persona into caller_persona from public.user_profiles where user_id = auth.uid();
  if caller_persona is distinct from 'player'::public.account_persona then
    raise exception 'NOT_A_PLAYER' using errcode = '42501';
  end if;

  if normalized_name is null then
    raise exception 'CLAIMED_NAME_REQUIRED' using errcode = '22023';
  end if;

  select club_id into target_club from public.club_join_codes where code = normalized_code;
  if target_club is null then
    raise exception 'INVALID_JOIN_CODE' using errcode = 'P0002';
  end if;

  -- Youth safety: a minor cannot submit a request without guardian consent.
  if public.player_is_minor(auth.uid())
    and coalesce((select guardian_consent_state from public.player_profiles where user_id = auth.uid()), 'pending') <> 'granted' then
    raise exception 'GUARDIAN_CONSENT_REQUIRED' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.player_club_links
    where user_id = auth.uid() and club_id = target_club and state = 'active'
  ) then
    raise exception 'ALREADY_LINKED' using errcode = '23505';
  end if;

  if exists (
    select 1 from public.player_link_requests
    where requester_user_id = auth.uid() and club_id = target_club and status = 'pending'
  ) then
    raise exception 'REQUEST_ALREADY_PENDING' using errcode = '23505';
  end if;

  insert into public.player_link_requests (
    requester_user_id, club_id, claimed_name, claimed_roster_number, message
  ) values (
    auth.uid(), target_club, normalized_name, claimed_roster_number,
    nullif(btrim(coalesce(message, '')), '')
  )
  returning id into request_id;

  return request_id;
end;
$$;

-- The requester withdraws their own pending request.
create or replace function public.withdraw_player_link_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.player_link_requests
  set status = 'withdrawn'
  where id = request_id
    and requester_user_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$$;

-- A club owner/admin/coach approves a request and links the account to a roster
-- player. Atomic: validates the roster slot, creates the link, records the audit.
create or replace function public.approve_player_link(
  request_id uuid,
  p_target_player_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.player_link_requests%rowtype;
  player_club uuid;
  new_link_id uuid;
begin
  select * into req from public.player_link_requests where id = request_id for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.user_has_club_role(req.club_id, array['owner', 'admin', 'coach']::public.membership_role[]) then
    insert into public.audit_events (club_id, user_id, event_type, metadata)
    values (req.club_id, auth.uid(), 'authorization_denied', jsonb_build_object('action', 'approve_player_link'));
    raise exception 'CLUB_STAFF_REQUIRED' using errcode = '42501';
  end if;

  if req.status <> 'pending' then
    raise exception 'REQUEST_NOT_PENDING' using errcode = '22023';
  end if;

  select club_id into player_club from public.players where id = p_target_player_id and deleted_at is null;
  if player_club is null or player_club <> req.club_id then
    raise exception 'INVALID_ROSTER_PLAYER' using errcode = '22023';
  end if;

  if exists (select 1 from public.player_club_links where player_id = p_target_player_id and state = 'active') then
    raise exception 'ROSTER_SLOT_ALREADY_LINKED' using errcode = '23505';
  end if;

  insert into public.player_club_links (user_id, club_id, player_id, linked_by)
  values (req.requester_user_id, req.club_id, p_target_player_id, auth.uid())
  returning id into new_link_id;

  update public.player_link_requests
  set status = 'approved',
      target_player_id = p_target_player_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      resulting_link_id = new_link_id
  where id = request_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    req.club_id, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'player_link_approved', 'requestId', request_id, 'playerId', p_target_player_id, 'linkedUser', req.requester_user_id)
  );

  return new_link_id;
end;
$$;

create or replace function public.reject_player_link(request_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_club uuid;
begin
  select club_id into request_club from public.player_link_requests where id = request_id;
  if request_club is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.user_has_club_role(request_club, array['owner', 'admin', 'coach']::public.membership_role[]) then
    raise exception 'CLUB_STAFF_REQUIRED' using errcode = '42501';
  end if;

  update public.player_link_requests
  set status = 'rejected',
      review_note = nullif(btrim(coalesce(reason, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = request_id and status = 'pending';

  if not found then
    raise exception 'REQUEST_NOT_PENDING' using errcode = '22023';
  end if;
end;
$$;

-- 6b) Player self-service bootstrap (revised) ---------------------------------
-- The Player door opens without the coach account-bootstrap, so a brand-new
-- player has no user_profiles row yet. Create it here so claiming the player
-- persona works on first sign-in (the step-1 version required an existing row).
create or replace function public.bootstrap_player_account()
returns public.account_persona
language plpgsql
security definer
set search_path = public
as $$
declare
  current_persona public.account_persona;
  club_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  insert into public.user_profiles (user_id, persona, onboarding_status)
  values (auth.uid(), 'coach', 'new')
  on conflict (user_id) do nothing;

  select persona into current_persona
  from public.user_profiles
  where user_id = auth.uid();

  if current_persona = 'player' then
    return 'player';  -- idempotent
  end if;

  if current_persona <> 'coach' then
    raise exception 'PERSONA_ALREADY_ASSIGNED' using errcode = '42501';
  end if;

  select count(*) into club_count
  from public.club_memberships
  where user_id = auth.uid()
    and membership_state <> 'removed';

  if club_count > 0 then
    raise exception 'ACCOUNT_ALREADY_COACH' using errcode = '42501';
  end if;

  perform set_config('dumala.persona_change_authorized', 'on', true);
  update public.user_profiles
  set persona = 'player', onboarding_status = 'new'
  where user_id = auth.uid();
  perform set_config('dumala.persona_change_authorized', 'off', true);

  return 'player';
end;
$$;

-- 7) Row level security -------------------------------------------------------

alter table public.player_profiles enable row level security;
alter table public.club_join_codes enable row level security;
alter table public.player_link_requests enable row level security;
alter table public.player_club_links enable row level security;

-- Player profiles: owner-only.
create policy "players read own profile"
on public.player_profiles for select to authenticated
using (user_id = auth.uid());
create policy "players create own profile"
on public.player_profiles for insert to authenticated
with check (user_id = auth.uid());
create policy "players update own profile"
on public.player_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Club join codes: club staff may read to share; writes go through the RPC.
create policy "club staff read join code"
on public.club_join_codes for select to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]));

-- Link requests: requester reads own; club staff read + manage.
create policy "requester reads own link request"
on public.player_link_requests for select to authenticated
using (requester_user_id = auth.uid());
create policy "club staff read link requests"
on public.player_link_requests for select to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]));
create policy "club staff manage link requests"
on public.player_link_requests for update to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]))
with check (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]));

-- Club links: the linked player reads own; club staff read for their club.
create policy "player reads own links"
on public.player_club_links for select to authenticated
using (user_id = auth.uid());
create policy "club staff read links"
on public.player_club_links for select to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]));

-- Linked players get read-only access to their club's schedule and its name.
create policy "games linked player select"
on public.games for select to authenticated
using (deleted_at is null and public.is_linked_player(club_id));

create policy "clubs linked player read"
on public.clubs for select to authenticated
using (public.is_linked_player(clubs.id));

-- 8) Grants -------------------------------------------------------------------

grant select, insert, update on public.player_profiles to authenticated;
grant select on public.club_join_codes to authenticated;
grant select, update on public.player_link_requests to authenticated;
grant select on public.player_club_links to authenticated;

grant execute on function public.player_is_minor(uuid) to authenticated;
grant execute on function public.is_linked_player(uuid, uuid) to authenticated;
grant execute on function public.set_guardian_consent(text, text, text) to authenticated;
grant execute on function public.get_or_create_club_join_code(uuid) to authenticated;
grant execute on function public.request_player_link(text, text, numeric, text) to authenticated;
grant execute on function public.withdraw_player_link_request(uuid) to authenticated;
grant execute on function public.approve_player_link(uuid, uuid) to authenticated;
grant execute on function public.reject_player_link(uuid, text) to authenticated;
