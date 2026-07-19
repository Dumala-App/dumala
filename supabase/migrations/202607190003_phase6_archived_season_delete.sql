-- Phase 6 - Archived season deletion.
--
-- Allows a League Owner to delete only seasons that have reached the archived
-- lifecycle state. Child event data is removed through existing cascade rules.

create or replace function public.delete_archived_league_season(season_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  season public.league_seasons%rowtype;
begin
  select * into season from public.league_seasons where id = season_id;
  if not found then
    raise exception 'SEASON_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(season.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if season.status <> 'archived' then
    raise exception 'SEASON_NOT_ARCHIVED' using errcode = '22023';
  end if;

  delete from public.league_seasons where id = season_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'archived_league_season_deleted', 'seasonId', season_id, 'leagueId', season.league_id));
end;
$$;

grant execute on function public.delete_archived_league_season(uuid) to authenticated;
