-- Phase 6 - Identity and authorization foundation.
--
-- Turns Dumala into three separate apps on one shared backend (Coach, Player,
-- League Owner). Each account belongs to exactly one app, decided by the
-- registration door and stored as a `persona`. Existing accounts default to
-- `coach` and are untouched. League access is granted through entitlements
-- (never plan-name matching): owners request access via a waitlist and a Dumala
-- admin provisions the account and grants the `league_pilot` entitlement.
--
-- Sensitive identity changes (persona, entitlements, provisioning) run in
-- security-definer functions guarded by `require_owner_admin_mfa` and leave
-- audit records through `record_admin_audit`. Persona is never client-settable.

-- 1) Enums --------------------------------------------------------------------

create type public.account_persona as enum ('coach', 'player', 'league');

create type public.league_access_request_status as enum (
  'pending',
  'approved',
  'rejected',
  'provisioned',
  'withdrawn'
);

-- 2) user_profiles: persona + onboarding status (non-destructive) -------------
-- Existing rows backfill to `coach` / `complete` through the column defaults, so
-- current coaches keep their workspaces exactly as they are.

alter table public.user_profiles
  add column persona public.account_persona not null default 'coach',
  add column onboarding_status text not null default 'complete';

alter table public.user_profiles
  add constraint user_profiles_onboarding_status_check
  check (onboarding_status in ('new', 'in_progress', 'complete'));

-- Guard persona from client tampering. RLS cannot restrict a single column, so a
-- trigger is the established escape hatch (see the version-check triggers in
-- 202606250002_domain_tables.sql). A change is authorized only when an app admin
-- makes it or a trusted security-definer RPC sets the session flag below.
create or replace function public.guard_user_profile_persona()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  authorized boolean := public.is_app_admin()
    or coalesce(current_setting('dumala.persona_change_authorized', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    -- Clients may create their own profile but cannot self-assign a persona;
    -- coerce anything unauthorized back to the safe default.
    if new.persona is distinct from 'coach'::public.account_persona and not authorized then
      new.persona := 'coach';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.persona is distinct from old.persona and not authorized then
    raise exception 'PERSONA_CHANGE_NOT_ALLOWED' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger user_profiles_guard_persona
before insert or update on public.user_profiles
for each row execute function public.guard_user_profile_persona();

-- 3) Entitlements -------------------------------------------------------------
-- Dedicated table so League access is gated on a grant, not on a billing plan
-- code, and so future per-competition or expiring grants slot in here.

create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_entitlements_key_check check (entitlement ~ '^[a-z0-9][a-z0-9_-]{0,39}$'),
  constraint user_entitlements_notes_check check (notes is null or char_length(notes) <= 500)
);

create trigger user_entitlements_set_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();

-- At most one active grant per (user, entitlement); revoked rows stay as history.
create unique index user_entitlements_active_key_idx
on public.user_entitlements (user_id, entitlement)
where revoked_at is null;

create index user_entitlements_user_idx on public.user_entitlements (user_id);

create or replace function public.is_entitled(
  entitlement text,
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
    from public.user_entitlements grant_row
    where grant_row.user_id = target_user_id
      and grant_row.entitlement = is_entitled.entitlement
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  );
$$;

-- 4) League access requests (the waitlist) ------------------------------------

create table public.league_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  organization text,
  league_name text,
  location text,
  message text,
  status public.league_access_request_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  provisioned_user_id uuid references auth.users(id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_access_requests_name_check check (char_length(contact_name) between 2 and 120),
  constraint league_access_requests_email_check check (char_length(contact_email) between 3 and 160),
  constraint league_access_requests_org_check check (organization is null or char_length(organization) <= 160),
  constraint league_access_requests_league_check check (league_name is null or char_length(league_name) <= 160),
  constraint league_access_requests_location_check check (location is null or char_length(location) <= 160),
  constraint league_access_requests_message_check check (message is null or char_length(message) <= 2000),
  constraint league_access_requests_admin_notes_check check (admin_notes is null or char_length(admin_notes) <= 2000)
);

create trigger league_access_requests_set_updated_at
before update on public.league_access_requests
for each row execute function public.set_updated_at();

create index league_access_requests_status_idx on public.league_access_requests (status, created_at desc);
create index league_access_requests_email_idx on public.league_access_requests (lower(contact_email));

-- 5) Server-side destination resolution ---------------------------------------
-- After sign-in the app asks the server which door this account belongs to. The
-- route follows the persona only; entitlements gate what works inside League.

create or replace function public.resolve_app_destination()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_persona public.account_persona;
  profile_onboarding text;
  entitlement_keys text[];
  route text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select persona, onboarding_status
  into profile_persona, profile_onboarding
  from public.user_profiles
  where user_id = auth.uid();

  -- A signed-in user without a profile row is treated as a fresh coach, matching
  -- the existing default account path.
  if profile_persona is null then
    profile_persona := 'coach';
    profile_onboarding := 'new';
  end if;

  select coalesce(array_agg(entitlement order by entitlement), array[]::text[])
  into entitlement_keys
  from public.user_entitlements
  where user_id = auth.uid()
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  route := case profile_persona
    when 'player' then '/player'
    when 'league' then '/league'
    else '/app'
  end;

  return jsonb_build_object(
    'persona', profile_persona,
    'onboarding_status', profile_onboarding,
    'entitlements', to_jsonb(entitlement_keys),
    'league_entitled', ('league_pilot' = any(entitlement_keys)),
    'authorized_route', route
  );
end;
$$;

-- 6) Player self-service bootstrap --------------------------------------------
-- The Player door tags new accounts as `player`. Persona is server-set, so the
-- client calls this after signup. Only a brand-new, unaffiliated account may
-- claim it, preserving "one account = one app".

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

  select persona into current_persona
  from public.user_profiles
  where user_id = auth.uid();

  if current_persona is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

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

-- 7) League access request submission -----------------------------------------
-- Public waitlist entry. Available to anonymous visitors and signed-in coaches;
-- submitting does not by itself unlock the app - an admin grant does.

create or replace function public.request_league_access(
  contact_name text,
  contact_email text,
  organization text default null,
  league_name text default null,
  location text default null,
  message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := nullif(trim(coalesce(contact_name, '')), '');
  normalized_email text := lower(nullif(trim(coalesce(contact_email, '')), ''));
  open_count integer;
  request_id uuid;
begin
  if normalized_name is null or char_length(normalized_name) < 2 then
    raise exception 'CONTACT_NAME_REQUIRED' using errcode = '22023';
  end if;

  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'CONTACT_EMAIL_INVALID' using errcode = '22023';
  end if;

  -- One open request per email keeps the queue clean.
  select count(*)
  into open_count
  from public.league_access_requests existing
  where lower(existing.contact_email) = normalized_email
    and existing.status in ('pending', 'approved');

  if open_count > 0 then
    raise exception 'REQUEST_ALREADY_PENDING' using errcode = '23505';
  end if;

  insert into public.league_access_requests (
    user_id, contact_name, contact_email, organization, league_name, location, message
  ) values (
    auth.uid(),
    normalized_name,
    normalized_email,
    nullif(trim(coalesce(organization, '')), ''),
    nullif(trim(coalesce(league_name, '')), ''),
    nullif(trim(coalesce(location, '')), ''),
    nullif(trim(coalesce(message, '')), '')
  )
  returning id into request_id;

  return request_id;
end;
$$;

-- 8) Admin provisioning and identity primitives -------------------------------

create or replace function public.admin_provision_league_owner(request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.league_access_requests%rowtype;
  target_user uuid;
begin
  perform public.require_owner_admin_mfa('admin_provision_league_owner', 'league_access_requests');

  select * into req
  from public.league_access_requests
  where id = request_id
  for update;

  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- The owner account must already exist. An admin creates/links the Supabase
  -- user first (consistent with 202607090001_admin_user_management.sql).
  select id into target_user
  from auth.users
  where lower(email) = lower(req.contact_email)
  limit 1;

  if target_user is null then
    raise exception 'TARGET_USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.user_profiles (user_id, persona, onboarding_status)
  values (target_user, 'coach', 'new')
  on conflict (user_id) do nothing;

  perform set_config('dumala.persona_change_authorized', 'on', true);
  update public.user_profiles
  set persona = 'league', onboarding_status = 'new'
  where user_id = target_user;
  perform set_config('dumala.persona_change_authorized', 'off', true);

  insert into public.user_entitlements (user_id, entitlement, granted_by, notes)
  values (target_user, 'league_pilot', auth.uid(), 'League pilot access (Phase 6 beta)')
  on conflict (user_id, entitlement) where revoked_at is null do nothing;

  update public.league_access_requests
  set status = 'provisioned',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      provisioned_user_id = target_user
  where id = request_id;

  perform public.record_admin_audit(
    'league_owner_provisioned',
    'league_access_requests',
    request_id::text,
    jsonb_build_object('target_user_id', target_user, 'contact_email', req.contact_email)
  );

  return jsonb_build_object(
    'request_id', request_id,
    'target_user_id', target_user,
    'status', 'provisioned'
  );
end;
$$;

create or replace function public.admin_review_league_access(
  request_id uuid,
  new_status public.league_access_request_status,
  admin_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_notes text := nullif(trim(coalesce(admin_notes, '')), '');
begin
  perform public.require_owner_admin_mfa('admin_review_league_access', 'league_access_requests');

  if new_status not in ('pending', 'approved', 'rejected', 'withdrawn') then
    raise exception 'INVALID_REVIEW_STATUS' using errcode = '22023';
  end if;

  update public.league_access_requests
  set status = new_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      admin_notes = coalesce(normalized_notes, league_access_requests.admin_notes)
  where id = request_id;

  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform public.record_admin_audit(
    'league_access_reviewed',
    'league_access_requests',
    request_id::text,
    jsonb_build_object('status', new_status)
  );

  return jsonb_build_object('request_id', request_id, 'status', new_status);
end;
$$;

create or replace function public.admin_set_user_persona(
  target_user_id uuid,
  new_persona public.account_persona
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_persona public.account_persona;
begin
  perform public.require_owner_admin_mfa('admin_set_user_persona', 'user_profiles');

  select persona into previous_persona
  from public.user_profiles
  where user_id = target_user_id;

  if previous_persona is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.user_profiles
  set persona = new_persona
  where user_id = target_user_id;

  perform public.record_admin_audit(
    'persona_changed',
    'user_profiles',
    target_user_id::text,
    jsonb_build_object('from', previous_persona, 'to', new_persona)
  );

  return jsonb_build_object('user_id', target_user_id, 'persona', new_persona);
end;
$$;

create or replace function public.admin_grant_entitlement(
  target_user_id uuid,
  entitlement text,
  expires_at timestamptz default null,
  notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_key text := lower(nullif(trim(coalesce(entitlement, '')), ''));
begin
  perform public.require_owner_admin_mfa('admin_grant_entitlement', 'user_entitlements');

  if normalized_key is null or normalized_key !~ '^[a-z0-9][a-z0-9_-]{0,39}$' then
    raise exception 'INVALID_ENTITLEMENT_KEY' using errcode = '22023';
  end if;

  if not exists (select 1 from public.user_profiles where user_id = target_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.user_entitlements (user_id, entitlement, granted_by, expires_at, notes)
  values (target_user_id, normalized_key, auth.uid(), expires_at, nullif(trim(coalesce(notes, '')), ''))
  on conflict (user_id, entitlement) where revoked_at is null
  do update set expires_at = excluded.expires_at,
                notes = excluded.notes,
                granted_by = excluded.granted_by,
                granted_at = now();

  perform public.record_admin_audit(
    'entitlement_granted',
    'user_entitlements',
    target_user_id::text,
    jsonb_build_object('entitlement', normalized_key, 'expires_at', expires_at)
  );

  return jsonb_build_object('user_id', target_user_id, 'entitlement', normalized_key);
end;
$$;

create or replace function public.admin_revoke_entitlement(
  target_user_id uuid,
  entitlement text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_key text := lower(nullif(trim(coalesce(entitlement, '')), ''));
begin
  perform public.require_owner_admin_mfa('admin_revoke_entitlement', 'user_entitlements');

  if normalized_key is null then
    raise exception 'INVALID_ENTITLEMENT_KEY' using errcode = '22023';
  end if;

  update public.user_entitlements
  set revoked_at = now()
  where user_id = target_user_id
    and entitlement = normalized_key
    and revoked_at is null;

  perform public.record_admin_audit(
    'entitlement_revoked',
    'user_entitlements',
    target_user_id::text,
    jsonb_build_object('entitlement', normalized_key)
  );

  return jsonb_build_object('user_id', target_user_id, 'entitlement', normalized_key, 'revoked', true);
end;
$$;

-- 9) Admin read: list league access requests ----------------------------------

create or replace function public.list_league_access_requests_v1(
  status_filter public.league_access_request_status default null
)
returns setof public.league_access_requests
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_owner_admin_mfa('list_league_access_requests_v1', 'league_access_requests');

  return query
  select *
  from public.league_access_requests
  where status_filter is null or status = status_filter
  order by created_at desc;
end;
$$;

-- 10) Row level security ------------------------------------------------------

alter table public.user_entitlements enable row level security;
alter table public.league_access_requests enable row level security;

create policy "users read own entitlements"
on public.user_entitlements for select to authenticated
using (user_id = auth.uid());

create policy "app admins manage entitlements"
on public.user_entitlements for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

-- Requesters can see the status of their own request; there is no non-admin
-- insert policy, so submissions must go through request_league_access().
create policy "requesters read own league access requests"
on public.league_access_requests for select to authenticated
using (user_id = auth.uid());

create policy "app admins manage league access requests"
on public.league_access_requests for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

-- 11) Grants ------------------------------------------------------------------

grant select, insert, update, delete on public.user_entitlements to authenticated;
grant select, insert, update, delete on public.league_access_requests to authenticated;

grant execute on function public.is_entitled(text, uuid) to authenticated;
grant execute on function public.resolve_app_destination() to authenticated;
grant execute on function public.bootstrap_player_account() to authenticated;
grant execute on function public.request_league_access(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_provision_league_owner(uuid) to authenticated;
grant execute on function public.admin_review_league_access(uuid, public.league_access_request_status, text) to authenticated;
grant execute on function public.admin_set_user_persona(uuid, public.account_persona) to authenticated;
grant execute on function public.admin_grant_entitlement(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.admin_revoke_entitlement(uuid, text) to authenticated;
grant execute on function public.list_league_access_requests_v1(public.league_access_request_status) to authenticated;
