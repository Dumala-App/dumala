-- Linked players can view their own FPRDS assessment history for the roster
-- player record approved by their coach. Coaches retain write access through
-- the existing assessment role policies.

create policy "assessment sessions linked player select"
on public.assessment_sessions for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.player_club_links link
    where link.user_id = auth.uid()
      and link.club_id = assessment_sessions.club_id
      and link.player_id = assessment_sessions.player_id
      and link.state = 'active'
  )
);

