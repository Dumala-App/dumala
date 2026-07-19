-- Phase 6 - Transfer window workflow.
--
-- Adds a first-class transfer move inside an event roster. A transfer keeps the
-- player active on the destination team while recording the source team, note,
-- and timestamp for review in the League Owner app.

alter table public.event_roster_players
  add column if not exists transfer_from_team_id uuid references public.event_teams(id) on delete set null,
  add column if not exists transferred_at timestamptz;

create index if not exists event_roster_players_transfer_from_idx
on public.event_roster_players(transfer_from_team_id)
where transfer_from_team_id is not null;

create or replace function public.transfer_event_roster_player(
  player_id uuid,
  destination_team_id uuid,
  note text default null
)
returns public.event_roster_players
language plpgsql
security definer
set search_path = public
as $$
declare
  player public.event_roster_players%rowtype;
  destination public.event_teams%rowtype;
  source_team public.event_teams%rowtype;
begin
  select * into player from public.event_roster_players where id = player_id;
  if not found then
    raise exception 'ROSTER_PLAYER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(player.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if player.status <> 'active' then
    raise exception 'PLAYER_NOT_ACTIVE' using errcode = '22023';
  end if;
  if not public.transfer_window_open(player.event_id) then
    raise exception 'TRANSFER_WINDOW_CLOSED' using errcode = '22023';
  end if;

  select * into destination from public.event_teams where id = destination_team_id;
  if not found then
    raise exception 'DESTINATION_TEAM_NOT_FOUND' using errcode = 'P0002';
  end if;
  if destination.league_id <> player.league_id or destination.event_id <> player.event_id then
    raise exception 'DESTINATION_TEAM_MISMATCH' using errcode = '22023';
  end if;
  if destination.id = player.team_id then
    raise exception 'DESTINATION_TEAM_UNCHANGED' using errcode = '22023';
  end if;
  if destination.roster_locked then
    raise exception 'DESTINATION_ROSTER_LOCKED' using errcode = '22023';
  end if;

  select * into source_team from public.event_teams where id = player.team_id;
  if source_team.roster_locked then
    raise exception 'SOURCE_ROSTER_LOCKED' using errcode = '22023';
  end if;

  update public.event_roster_players
  set team_id = destination.id,
      registration_id = destination.registration_id,
      transfer_from_team_id = player.team_id,
      status = 'active',
      transfer_note = nullif(btrim(coalesce(note, '')), ''),
      transferred_at = now()
  where id = player_id
  returning * into player;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object(
      'action', 'event_roster_player_transferred',
      'playerId', player_id,
      'fromTeamId', player.transfer_from_team_id,
      'toTeamId', destination_team_id
    ));

  return player;
end;
$$;

grant execute on function public.transfer_event_roster_player(uuid, uuid, text) to authenticated;
