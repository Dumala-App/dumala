-- Admin user management: ban/unban, mute/unmute, plan overrides, device revocation,
-- and private moderation notes, managed from the owner console.
--
-- Moderation state lives in its own table (not user_profiles) because users can
-- update their own profile row; moderation must only change through owner RPCs.

create table public.user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  banned_at timestamptz,
  ban_reason text,
  banned_by uuid references auth.users(id) on delete set null,
  muted_until timestamptz,
  mute_reason text,
  muted_by uuid references auth.users(id) on delete set null,
  plan_code text not null default 'free',
  plan_expires_at timestamptz,
  plan_note text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_moderation_plan_code_check check (plan_code ~ '^[a-z0-9][a-z0-9_-]{0,39}$')
);

create trigger user_moderation_set_updated_at
before update on public.user_moderation
for each row execute function public.set_updated_at();

alter table public.user_moderation enable row level security;

create policy "users can read their moderation status"
on public.user_moderation for select to authenticated
using (user_id = auth.uid() or public.is_app_admin());

grant select on public.user_moderation to authenticated;

create or replace function public.is_user_banned(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_moderation m
    where m.user_id = target_user_id
      and m.banned_at is not null
  );
$$;

create or replace function public.is_user_muted(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_moderation m
    where m.user_id = target_user_id
      and m.muted_until is not null
      and m.muted_until > now()
  );
$$;

grant execute on function public.is_user_banned(uuid) to anon, authenticated;
grant execute on function public.is_user_muted(uuid) to anon, authenticated;

-- Ban enforcement: these helpers gate nearly every club-scoped RLS policy, so a
-- banned user loses club data access everywhere without rewriting each policy.
create or replace function public.is_active_club_member(target_club_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.is_user_banned(target_user_id)
    and exists (
      select 1
      from public.club_memberships m
      where m.club_id = target_club_id
        and m.user_id = target_user_id
        and m.membership_state = 'active'
    );
$$;

create or replace function public.user_owns_club(target_club_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.is_user_banned(target_user_id)
    and exists (
      select 1
      from public.clubs c
      where c.id = target_club_id
        and c.owner_user_id = target_user_id
        and c.club_state = 'active'
    );
$$;

create or replace function public.user_has_club_role(
  target_club_id uuid,
  allowed_roles public.membership_role[],
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.is_user_banned(target_user_id)
    and exists (
      select 1
      from public.club_memberships m
      join public.clubs c on c.id = m.club_id
      where m.club_id = target_club_id
        and m.user_id = target_user_id
        and m.membership_state = 'active'
        and c.club_state = 'active'
        and m.role = any(allowed_roles)
    );
$$;

-- Mute enforcement: muted users cannot post bulletins (announcements) or feedback.
create or replace function public.user_can_manage_club_table(
  target_club_id uuid,
  target_table text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_table = 'bulletins' and public.is_user_muted(target_user_id)
      then false
    when public.user_has_club_role(target_club_id, array['owner', 'admin']::public.membership_role[], target_user_id)
      then true
    when public.user_has_club_role(target_club_id, array['coach']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'players',
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
        'player_availability',
        'coach_notes',
        'weekly_training_schedules',
        'tactics_workspaces',
        'tactics_lineup_assignments',
        'tactics_draw_paths',
        'tactics_notes',
        'tactics_player_extras'
      ])
    when public.user_has_club_role(target_club_id, array['staff']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'bulletins',
        'player_availability',
        'coach_notes',
        'weekly_training_schedules'
      ])
    else false
  end;
$$;

drop policy "clients can create feedback" on public.feedback_submissions;
create policy "clients can create feedback"
on public.feedback_submissions for insert to anon, authenticated
with check (
  (user_id is null or user_id = auth.uid())
  and not public.is_user_banned(auth.uid())
  and not public.is_user_muted(auth.uid())
);

-- Banned owners must not keep managing clubs through the direct owner policies.
drop policy "users can create owned clubs" on public.clubs;
create policy "users can create owned clubs"
on public.clubs for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and not public.is_user_banned(auth.uid())
);

drop policy "owners can update their clubs" on public.clubs;
create policy "owners can update their clubs"
on public.clubs for update to authenticated
using (
  owner_user_id = auth.uid()
  and not public.is_user_banned(auth.uid())
)
with check (
  owner_user_id = auth.uid()
  and not public.is_user_banned(auth.uid())
);

-- Shared payload for the managed-user RPCs. Not granted to clients; only the
-- owner RPCs below (security definer) may call it.
create or replace function public.admin_managed_user_payload_v1(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId', profile.user_id,
    'email', auth_user.email,
    'displayName', profile.display_name,
    'accountState', profile.account_state,
    'createdAt', profile.created_at,
    'lastActiveAt', (select max(e.created_at) from public.app_usage_events e where e.user_id = profile.user_id),
    'workspaceCount', (
      select count(*)::int
      from public.club_memberships m
      where m.user_id = profile.user_id and m.membership_state = 'active'
    ),
    'deviceCount', (
      select count(*)::int
      from public.devices d
      where d.user_id = profile.user_id and d.revoked_at is null
    ),
    'feedbackCount', (
      select count(*)::int
      from public.feedback_submissions f
      where f.user_id = profile.user_id
    ),
    'bannedAt', moderation.banned_at,
    'banReason', moderation.ban_reason,
    'mutedUntil', moderation.muted_until,
    'muteReason', moderation.mute_reason,
    'planCode', coalesce(moderation.plan_code, 'free'),
    'planExpiresAt', moderation.plan_expires_at,
    'planNote', moderation.plan_note,
    'adminNotes', moderation.admin_notes
  )
  from public.user_profiles profile
  left join auth.users auth_user on auth_user.id = profile.user_id
  left join public.user_moderation moderation on moderation.user_id = profile.user_id
  where profile.user_id = target_user_id;
$$;

revoke all on function public.admin_managed_user_payload_v1(uuid) from public, anon, authenticated;

create or replace function public.list_admin_managed_users_v1(
  search text default null,
  limit_count integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_search text := nullif(trim(coalesce(search, '')), '');
  capped_limit integer := greatest(1, least(coalesce(limit_count, 50), 200));
  payload jsonb;
begin
  perform public.require_owner_admin_mfa('list_admin_managed_users_v1', 'user_profiles');
  perform public.record_admin_audit(
    'managed_users_read',
    'user_profiles',
    null,
    jsonb_build_object('hasSearch', normalized_search is not null, 'limit', capped_limit)
  );

  select coalesce(
    jsonb_agg(public.admin_managed_user_payload_v1(candidate.user_id) order by candidate.sort_key desc),
    '[]'::jsonb
  )
  into payload
  from (
    select
      profile.user_id,
      coalesce(
        (select max(e.created_at) from public.app_usage_events e where e.user_id = profile.user_id),
        profile.created_at
      ) as sort_key
    from public.user_profiles profile
    left join auth.users auth_user on auth_user.id = profile.user_id
    where normalized_search is null
      or auth_user.email ilike '%' || normalized_search || '%'
      or profile.display_name ilike '%' || normalized_search || '%'
      or profile.user_id::text = normalized_search
    order by sort_key desc
    limit capped_limit
  ) candidate;

  return payload;
end;
$$;

create or replace function public.set_admin_user_ban_v1(
  target_user_id uuid,
  banned boolean,
  reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_user_id uuid := auth.uid();
  normalized_reason text := nullif(trim(coalesce(reason, '')), '');
  profile_state public.account_state;
begin
  perform public.require_owner_admin_mfa('set_admin_user_ban_v1', 'user_moderation');

  if target_user_id = admin_user_id then
    raise exception 'ADMIN_CANNOT_MODERATE_SELF' using errcode = '42501';
  end if;

  select account_state into profile_state
  from public.user_profiles
  where user_id = target_user_id;

  if profile_state is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if banned then
    insert into public.user_moderation (user_id, banned_at, ban_reason, banned_by)
    values (target_user_id, now(), normalized_reason, admin_user_id)
    on conflict (user_id) do update
    set banned_at = excluded.banned_at,
        ban_reason = excluded.ban_reason,
        banned_by = excluded.banned_by;

    if profile_state = 'active' then
      update public.user_profiles
      set account_state = 'disabled'
      where user_id = target_user_id;
    end if;

    -- Force sign-out of synced devices so the ban takes effect immediately.
    update public.devices
    set revoked_at = now()
    where user_id = target_user_id and revoked_at is null;
  else
    update public.user_moderation
    set banned_at = null,
        ban_reason = null,
        banned_by = null
    where user_id = target_user_id;

    if profile_state = 'disabled' then
      update public.user_profiles
      set account_state = 'active'
      where user_id = target_user_id;
    end if;
  end if;

  perform public.record_admin_audit(
    case when banned then 'user_banned' else 'user_unbanned' end,
    'user_moderation',
    target_user_id::text,
    jsonb_build_object('reason', normalized_reason)
  );

  return public.admin_managed_user_payload_v1(target_user_id);
end;
$$;

create or replace function public.set_admin_user_mute_v1(
  target_user_id uuid,
  muted_until timestamptz default null,
  reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_user_id uuid := auth.uid();
  normalized_reason text := nullif(trim(coalesce(reason, '')), '');
begin
  perform public.require_owner_admin_mfa('set_admin_user_mute_v1', 'user_moderation');

  if not exists (select 1 from public.user_profiles where user_id = target_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if muted_until is not null and muted_until <= now() then
    raise exception 'MUTE_UNTIL_MUST_BE_FUTURE' using errcode = '22023';
  end if;

  insert into public.user_moderation (user_id, muted_until, mute_reason, muted_by)
  values (
    target_user_id,
    muted_until,
    case when muted_until is null then null else normalized_reason end,
    case when muted_until is null then null else admin_user_id end
  )
  on conflict (user_id) do update
  set muted_until = excluded.muted_until,
      mute_reason = excluded.mute_reason,
      muted_by = excluded.muted_by;

  perform public.record_admin_audit(
    case when muted_until is null then 'user_unmuted' else 'user_muted' end,
    'user_moderation',
    target_user_id::text,
    jsonb_build_object('mutedUntil', muted_until, 'reason', normalized_reason)
  );

  return public.admin_managed_user_payload_v1(target_user_id);
end;
$$;

create or replace function public.set_admin_user_plan_v1(
  target_user_id uuid,
  plan_code text,
  expires_at timestamptz default null,
  note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_plan text := lower(trim(coalesce(plan_code, '')));
  normalized_note text := nullif(trim(coalesce(note, '')), '');
begin
  perform public.require_owner_admin_mfa('set_admin_user_plan_v1', 'user_moderation');

  if not exists (select 1 from public.user_profiles where user_id = target_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if normalized_plan !~ '^[a-z0-9][a-z0-9_-]{0,39}$' then
    raise exception 'INVALID_PLAN_CODE' using errcode = '22023';
  end if;

  insert into public.user_moderation (user_id, plan_code, plan_expires_at, plan_note)
  values (target_user_id, normalized_plan, expires_at, normalized_note)
  on conflict (user_id) do update
  set plan_code = excluded.plan_code,
      plan_expires_at = excluded.plan_expires_at,
      plan_note = excluded.plan_note;

  perform public.record_admin_audit(
    'user_plan_changed',
    'user_moderation',
    target_user_id::text,
    jsonb_build_object('planCode', normalized_plan, 'expiresAt', expires_at)
  );

  return public.admin_managed_user_payload_v1(target_user_id);
end;
$$;

create or replace function public.revoke_admin_user_devices_v1(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  revoked_count integer;
begin
  perform public.require_owner_admin_mfa('revoke_admin_user_devices_v1', 'devices');

  if not exists (select 1 from public.user_profiles where user_id = target_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.devices
  set revoked_at = now()
  where user_id = target_user_id and revoked_at is null;
  get diagnostics revoked_count = row_count;

  perform public.record_admin_audit(
    'user_devices_revoked',
    'devices',
    target_user_id::text,
    jsonb_build_object('revokedCount', revoked_count)
  );

  return public.admin_managed_user_payload_v1(target_user_id)
    || jsonb_build_object('revokedDeviceCount', revoked_count);
end;
$$;

create or replace function public.set_admin_user_notes_v1(
  target_user_id uuid,
  notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_notes text := nullif(trim(coalesce(notes, '')), '');
begin
  perform public.require_owner_admin_mfa('set_admin_user_notes_v1', 'user_moderation');

  if not exists (select 1 from public.user_profiles where user_id = target_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.user_moderation (user_id, admin_notes)
  values (target_user_id, normalized_notes)
  on conflict (user_id) do update
  set admin_notes = excluded.admin_notes;

  perform public.record_admin_audit(
    'user_notes_updated',
    'user_moderation',
    target_user_id::text,
    jsonb_build_object('hasNotes', normalized_notes is not null)
  );

  return public.admin_managed_user_payload_v1(target_user_id);
end;
$$;

grant execute on function public.list_admin_managed_users_v1(text, integer) to authenticated;
grant execute on function public.set_admin_user_ban_v1(uuid, boolean, text) to authenticated;
grant execute on function public.set_admin_user_mute_v1(uuid, timestamptz, text) to authenticated;
grant execute on function public.set_admin_user_plan_v1(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.revoke_admin_user_devices_v1(uuid) to authenticated;
grant execute on function public.set_admin_user_notes_v1(uuid, text) to authenticated;
