-- Linked players can view the public squad list for their own club.
-- Management remains limited to club staff by the existing role policies.

create policy "players linked player select"
on public.players for select to authenticated
using (deleted_at is null and public.is_linked_player(club_id));
