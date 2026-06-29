do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clubs'
      and policyname = 'owners can read clubs they created'
  ) then
    create policy "owners can read clubs they created"
    on public.clubs for select to authenticated
    using (owner_user_id = auth.uid());
  end if;
end $$;
