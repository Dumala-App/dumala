-- Phase 6 - Team Chat (shared communication, step 3).
--
-- One official team channel per club. Members are a club's active staff (coach
-- memberships) or its linked players. Youth safeguard: a minor player without
-- granted guardian consent can neither read nor post. Staff moderate (delete any
-- message); members can delete their own and report messages. Live updates are
-- polled by the client; the model is realtime-ready.

-- 1) Tables -------------------------------------------------------------------

create table public.team_chat_channels (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  kind text not null default 'team',
  name text not null default 'Team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_chat_channels_kind_check check (kind in ('team')),
  constraint team_chat_channels_name_check check (char_length(name) between 1 and 120)
);

create trigger team_chat_channels_set_updated_at
before update on public.team_chat_channels
for each row execute function public.set_updated_at();

-- One team channel per club.
create unique index team_chat_channels_team_idx
on public.team_chat_channels(club_id)
where kind = 'team';

create table public.team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.team_chat_channels(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_role text not null,
  body text not null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint team_chat_messages_body_check check (char_length(body) between 1 and 2000),
  constraint team_chat_messages_author_name_check check (char_length(author_name) between 1 and 160),
  constraint team_chat_messages_author_role_check check (author_role in ('owner', 'admin', 'coach', 'staff', 'player'))
);

create index team_chat_messages_channel_idx on public.team_chat_messages(channel_id, created_at);

create table public.team_chat_reads (
  channel_id uuid not null references public.team_chat_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table public.team_chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.team_chat_messages(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint team_chat_reports_reason_check check (reason is null or char_length(reason) <= 1000)
);

create index team_chat_reports_club_idx on public.team_chat_reports(club_id, created_at desc);

-- 2) Access helpers -----------------------------------------------------------

create or replace function public.is_team_chat_member(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_club_member(target_club_id) or public.is_linked_player(target_club_id);
$$;

-- Reading and posting are gated here: staff always; a linked player only when not
-- a minor lacking granted guardian consent.
create or replace function public.can_access_team_chat(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_club_member(target_club_id)
    or (
      public.is_linked_player(target_club_id)
      and not (
        public.player_is_minor(auth.uid())
        and coalesce(
          (select guardian_consent_state from public.player_profiles where user_id = auth.uid()),
          'pending'
        ) <> 'granted'
      )
    );
$$;

-- 3) RPCs ---------------------------------------------------------------------

create or replace function public.ensure_team_channel(target_club_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  channel_id uuid;
begin
  if not public.is_team_chat_member(target_club_id) then
    raise exception 'TEAM_CHAT_ACCESS_DENIED' using errcode = '42501';
  end if;

  select id into channel_id from public.team_chat_channels where club_id = target_club_id and kind = 'team';
  if channel_id is not null then
    return channel_id;
  end if;

  insert into public.team_chat_channels (club_id, kind, name)
  values (target_club_id, 'team', 'Team')
  on conflict (club_id) where kind = 'team' do nothing;

  select id into channel_id from public.team_chat_channels where club_id = target_club_id and kind = 'team';
  return channel_id;
end;
$$;

create or replace function public.post_team_chat_message(target_club_id uuid, body text)
returns public.team_chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_body text := nullif(btrim(coalesce(body, '')), '');
  channel_id uuid;
  role_value public.membership_role;
  snap_name text;
  snap_role text;
  new_row public.team_chat_messages;
begin
  if not public.can_access_team_chat(target_club_id) then
    raise exception 'TEAM_CHAT_ACCESS_DENIED' using errcode = '42501';
  end if;

  if normalized_body is null then
    raise exception 'MESSAGE_REQUIRED' using errcode = '22023';
  end if;

  channel_id := public.ensure_team_channel(target_club_id);

  -- Snapshot the author's role + display name at post time.
  select role into role_value
  from public.club_memberships
  where club_id = target_club_id and user_id = auth.uid() and membership_state = 'active'
  limit 1;

  if role_value is not null then
    snap_role := role_value::text;
    snap_name := coalesce(
      (select display_name from public.user_profiles where user_id = auth.uid()),
      'Coach'
    );
  else
    snap_role := 'player';
    snap_name := coalesce(
      (select display_name from public.player_profiles where user_id = auth.uid()),
      'Player'
    );
  end if;

  insert into public.team_chat_messages (channel_id, club_id, author_user_id, author_name, author_role, body)
  values (channel_id, target_club_id, auth.uid(), snap_name, snap_role, normalized_body)
  returning * into new_row;

  return new_row;
end;
$$;

create or replace function public.delete_team_chat_message(message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  msg public.team_chat_messages%rowtype;
begin
  select * into msg from public.team_chat_messages where id = message_id;
  if not found then
    raise exception 'MESSAGE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if msg.author_user_id <> auth.uid()
     and not public.user_has_club_role(msg.club_id, array['owner', 'admin', 'coach']::public.membership_role[]) then
    raise exception 'MESSAGE_DELETE_DENIED' using errcode = '42501';
  end if;

  update public.team_chat_messages
  set deleted_at = now(), deleted_by = auth.uid()
  where id = message_id and deleted_at is null;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (msg.club_id, auth.uid(), 'record_removed', jsonb_build_object('action', 'team_chat_message_deleted', 'messageId', message_id));
end;
$$;

create or replace function public.report_team_chat_message(message_id uuid, reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  msg public.team_chat_messages%rowtype;
  report_id uuid;
begin
  select * into msg from public.team_chat_messages where id = message_id;
  if not found then
    raise exception 'MESSAGE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.is_team_chat_member(msg.club_id) then
    raise exception 'TEAM_CHAT_ACCESS_DENIED' using errcode = '42501';
  end if;

  insert into public.team_chat_reports (message_id, club_id, reporter_user_id, reason)
  values (message_id, msg.club_id, auth.uid(), nullif(btrim(coalesce(reason, '')), ''))
  returning id into report_id;

  return report_id;
end;
$$;

create or replace function public.mark_team_chat_read(p_channel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_chat_reads (channel_id, user_id, last_read_at)
  values (p_channel_id, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = now();
end;
$$;

-- 4) Row level security -------------------------------------------------------

alter table public.team_chat_channels enable row level security;
alter table public.team_chat_messages enable row level security;
alter table public.team_chat_reads enable row level security;
alter table public.team_chat_reports enable row level security;

create policy "members read team channels"
on public.team_chat_channels for select to authenticated
using (public.can_access_team_chat(club_id));

create policy "members read team messages"
on public.team_chat_messages for select to authenticated
using (public.can_access_team_chat(club_id));

create policy "members manage own read marker"
on public.team_chat_reads for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "reporter reads own reports"
on public.team_chat_reports for select to authenticated
using (reporter_user_id = auth.uid());
create policy "club staff read reports"
on public.team_chat_reports for select to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[]));

-- 5) Grants -------------------------------------------------------------------

grant select on public.team_chat_channels to authenticated;
grant select on public.team_chat_messages to authenticated;
grant select, insert, update on public.team_chat_reads to authenticated;
grant select on public.team_chat_reports to authenticated;

grant execute on function public.is_team_chat_member(uuid) to authenticated;
grant execute on function public.can_access_team_chat(uuid) to authenticated;
grant execute on function public.ensure_team_channel(uuid) to authenticated;
grant execute on function public.post_team_chat_message(uuid, text) to authenticated;
grant execute on function public.delete_team_chat_message(uuid) to authenticated;
grant execute on function public.report_team_chat_message(uuid, text) to authenticated;
grant execute on function public.mark_team_chat_read(uuid) to authenticated;
