-- Resolve the current tactics captain to a linked player account for chat UI
-- decoration. This exposes only the captain's auth user id, and only to users
-- already allowed to participate in that club's team chat.

create or replace function public.get_team_chat_captain_user_id(target_club_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pcl.user_id
  from public.tactics_workspaces tw
  join public.player_club_links pcl
    on pcl.club_id = tw.club_id
   and pcl.player_id = tw.captain_player_id
   and pcl.state = 'active'
  where tw.club_id = target_club_id
    and tw.deleted_at is null
    and public.is_team_chat_member(target_club_id)
  order by tw.updated_at desc
  limit 1;
$$;

grant execute on function public.get_team_chat_captain_user_id(uuid) to authenticated;
