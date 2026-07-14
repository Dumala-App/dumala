-- Linked players can view the coach's current team setup for their own club.
-- Tactics editing remains limited to club staff by the existing role policies.

create policy "tactics_workspaces linked player select"
on public.tactics_workspaces for select to authenticated
using (deleted_at is null and public.is_linked_player(club_id));
