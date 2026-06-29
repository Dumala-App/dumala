create policy "owners can read clubs they created"
on public.clubs for select to authenticated
using (owner_user_id = auth.uid());
