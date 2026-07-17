-- Phase 6 - enforce active League Owner entitlement on existing league access.
--
-- League creation already required the League persona plus an active
-- league_pilot entitlement. Existing league access must use the same current
-- entitlement check so revoked or expired pilots lose operational access.

create or replace function public.owns_league(
  target_league_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_league_owner(target_user_id) and exists (
    select 1
    from public.leagues l
    where l.id = target_league_id
      and l.owner_user_id = target_user_id
  );
$$;

create or replace function public.owns_event(
  target_event_id uuid,
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
    from public.league_events e
    where e.id = target_event_id
      and public.owns_league(e.league_id, target_user_id)
  );
$$;

drop policy if exists "owners read own leagues" on public.leagues;
drop policy if exists "owners update own leagues" on public.leagues;
drop policy if exists "owners delete own leagues" on public.leagues;

create policy "owners read own leagues"
on public.leagues for select to authenticated
using (owner_user_id = auth.uid() and public.is_league_owner());

create policy "owners update own leagues"
on public.leagues for update to authenticated
using (owner_user_id = auth.uid() and public.is_league_owner())
with check (owner_user_id = auth.uid() and public.is_league_owner());

create policy "owners delete own leagues"
on public.leagues for delete to authenticated
using (owner_user_id = auth.uid() and public.is_league_owner());
