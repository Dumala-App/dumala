-- Phase 6 - Player engagement (drills, timer, progress, notifications).
--
-- Player-owned, cloud-synced activity so the Player app's Progress dashboard is
-- real: self-reported drill completions, favorites, saved workout summaries, and
-- an in-app notification feed. All rows are owner-only under RLS. Notifications
-- are written only by security-definer server functions (link approval/rejection
-- and a first-sign-in welcome), never directly by clients.

-- 1) Tables -------------------------------------------------------------------

create table public.player_drill_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_id text not null,
  completed_at timestamptz not null default now(),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  perceived_exertion smallint check (perceived_exertion is null or perceived_exertion between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  constraint player_drill_completions_drill_check check (char_length(drill_id) between 1 and 80),
  constraint player_drill_completions_notes_check check (notes is null or char_length(notes) <= 1000)
);

create index player_drill_completions_user_idx
on public.player_drill_completions(user_id, completed_at desc);

create table public.player_drill_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, drill_id),
  constraint player_drill_favorites_drill_check check (char_length(drill_id) between 1 and 80)
);

create table public.player_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  label text,
  total_seconds integer not null default 0 check (total_seconds between 0 and 86400),
  rounds jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  constraint player_workout_sessions_kind_check check (kind in ('stopwatch', 'countdown', 'interval')),
  constraint player_workout_sessions_label_check check (label is null or char_length(label) <= 120),
  constraint player_workout_sessions_notes_check check (notes is null or char_length(notes) <= 1000)
);

create index player_workout_sessions_user_idx
on public.player_workout_sessions(user_id, completed_at desc);

create table public.player_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  related jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint player_notifications_type_check check (type in ('welcome', 'link_approved', 'link_rejected', 'system')),
  constraint player_notifications_title_check check (char_length(title) between 1 and 160),
  constraint player_notifications_body_check check (char_length(body) between 1 and 1000)
);

create index player_notifications_user_idx
on public.player_notifications(user_id, read_at, created_at desc);

-- 2) Internal notification writer (called only from definer RPCs) -------------

create or replace function public.insert_player_notification(
  target_user uuid,
  ntype text,
  ntitle text,
  nbody text,
  nrelated jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.player_notifications (user_id, type, title, body, related)
  values (target_user, ntype, ntitle, nbody, coalesce(nrelated, '{}'::jsonb));
$$;

-- 3) Row level security -------------------------------------------------------

alter table public.player_drill_completions enable row level security;
alter table public.player_drill_favorites enable row level security;
alter table public.player_workout_sessions enable row level security;
alter table public.player_notifications enable row level security;

create policy "players manage own completions"
on public.player_drill_completions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "players manage own favorites"
on public.player_drill_favorites for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "players manage own workouts"
on public.player_workout_sessions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Notifications are read + marked-read by their owner; inserts come from the
-- definer RPCs only (no insert policy), so clients cannot fabricate them.
create policy "players read own notifications"
on public.player_notifications for select to authenticated
using (user_id = auth.uid());

create policy "players update own notifications"
on public.player_notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 4) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.player_drill_completions to authenticated;
grant select, insert, delete on public.player_drill_favorites to authenticated;
grant select, insert, update, delete on public.player_workout_sessions to authenticated;
grant select, update on public.player_notifications to authenticated;

-- 5) Notification generation (forward-replace of the step-2 RPCs) -------------

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
  club_label text;
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

  select name into club_label from public.clubs where id = req.club_id;
  perform public.insert_player_notification(
    req.requester_user_id,
    'link_approved',
    'You''re on the team!',
    coalesce(club_label, 'Your team') || ' approved your request. Your schedule is now available.',
    jsonb_build_object('clubId', req.club_id, 'requestId', request_id)
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
  req public.player_link_requests%rowtype;
  normalized_reason text := nullif(btrim(coalesce(reason, '')), '');
begin
  select * into req from public.player_link_requests where id = request_id;
  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.user_has_club_role(req.club_id, array['owner', 'admin', 'coach']::public.membership_role[]) then
    raise exception 'CLUB_STAFF_REQUIRED' using errcode = '42501';
  end if;

  update public.player_link_requests
  set status = 'rejected',
      review_note = normalized_reason,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = request_id and status = 'pending';

  if not found then
    raise exception 'REQUEST_NOT_PENDING' using errcode = '22023';
  end if;

  perform public.insert_player_notification(
    req.requester_user_id,
    'link_rejected',
    'Join request update',
    coalesce('Your request was not approved: ' || normalized_reason, 'Your request to join was not approved. Check the join code with your coach and try again.'),
    jsonb_build_object('clubId', req.club_id, 'requestId', request_id)
  );
end;
$$;

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

  -- One-time welcome on first sign-in through the Player door.
  perform public.insert_player_notification(
    auth.uid(),
    'welcome',
    'Welcome to Dumala Player',
    'Build your streak with solo drills, time your workouts, and track your progress. Ask your coach for a join code to link your team.',
    '{}'::jsonb
  );

  return 'player';
end;
$$;
