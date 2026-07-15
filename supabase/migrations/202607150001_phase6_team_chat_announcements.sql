-- Phase 6 - Team Chat announcements.
--
-- Dashboard announcements are official staff posts inside the existing team
-- chat channel. Attachments and email delivery remain intentionally out of
-- scope for this slice.

alter table public.team_chat_messages
add column message_kind text not null default 'message';

alter table public.team_chat_messages
add constraint team_chat_messages_kind_check
check (message_kind in ('message', 'announcement'));

create index team_chat_messages_announcements_idx
on public.team_chat_messages(club_id, created_at desc)
where message_kind = 'announcement' and deleted_at is null;

create or replace function public.post_team_chat_announcement(target_club_id uuid, body text)
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
  new_row public.team_chat_messages;
begin
  if not public.user_has_club_role(target_club_id, array['owner', 'admin', 'coach', 'staff']::public.membership_role[]) then
    raise exception 'TEAM_ANNOUNCEMENT_DENIED' using errcode = '42501';
  end if;

  if normalized_body is null then
    raise exception 'ANNOUNCEMENT_REQUIRED' using errcode = '22023';
  end if;

  channel_id := public.ensure_team_channel(target_club_id);

  select role into role_value
  from public.club_memberships
  where club_id = target_club_id and user_id = auth.uid() and membership_state = 'active'
  limit 1;

  snap_name := coalesce(
    (select display_name from public.user_profiles where user_id = auth.uid()),
    'Coach'
  );

  insert into public.team_chat_messages (
    channel_id,
    club_id,
    author_user_id,
    author_name,
    author_role,
    body,
    message_kind
  )
  values (
    channel_id,
    target_club_id,
    auth.uid(),
    snap_name,
    coalesce(role_value::text, 'coach'),
    normalized_body,
    'announcement'
  )
  returning * into new_row;

  return new_row;
end;
$$;

grant execute on function public.post_team_chat_announcement(uuid, text) to authenticated;
