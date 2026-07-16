-- Phase 6 - Group stage (group -> knockout).
--
-- Completes the third event format. Teams are split into groups that each play a
-- round robin; the top finishers then advance into a single-elimination bracket.
-- Both stages live in event_fixtures, distinguished by a `stage` column, and a
-- group fixture also carries its `group_label`. Group membership is derived from
-- the group fixtures, so no team-table change is needed. Standings reuse the
-- existing computeStandings helper (per group) and the knockout reuses the
-- single-elimination bracket + sync_bracket.

-- 1) Columns ------------------------------------------------------------------

alter table public.event_fixtures add column stage text;
alter table public.event_fixtures add column group_label text;

alter table public.event_fixtures
  add constraint event_fixtures_stage_check check (stage is null or stage in ('group', 'knockout')),
  add constraint event_fixtures_group_label_check check (group_label is null or char_length(group_label) <= 16);

create index event_fixtures_event_stage_idx on public.event_fixtures(event_id, stage);

-- 2) Scope advancement to the knockout stage -----------------------------------
-- A group-stage round robin reuses round/sequence numbers that would otherwise
-- collide with the bracket. Redefine sync_bracket so it only reads and writes
-- knockout fixtures (a single-elimination event leaves stage null -> knockout).

create or replace function public.sync_bracket(target_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  event_league uuid;
  p public.event_fixtures%rowtype;
  home_feeder public.event_fixtures%rowtype;
  away_feeder public.event_fixtures%rowtype;
  next_home uuid;
  next_away uuid;
  home_found boolean;
  away_found boolean;
  updated_count integer := 0;
begin
  select league_id into event_league from public.league_events where id = target_event_id;
  if event_league is null then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(event_league) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  for p in
    select * from public.event_fixtures
    where event_id = target_event_id and round > 1 and status <> 'completed'
      and coalesce(stage, 'knockout') = 'knockout'
    order by round, sequence
  loop
    next_home := p.home_team_id;
    next_away := p.away_team_id;

    select * into home_feeder from public.event_fixtures
      where event_id = target_event_id and round = p.round - 1 and sequence = p.sequence * 2 - 1
        and coalesce(stage, 'knockout') = 'knockout';
    home_found := found;
    select * into away_feeder from public.event_fixtures
      where event_id = target_event_id and round = p.round - 1 and sequence = p.sequence * 2
        and coalesce(stage, 'knockout') = 'knockout';
    away_found := found;

    if home_found then
      next_home := case
        when home_feeder.status = 'completed' and home_feeder.home_score <> home_feeder.away_score
          then (case when home_feeder.home_score > home_feeder.away_score then home_feeder.home_team_id else home_feeder.away_team_id end)
        else null end;
    end if;
    if away_found then
      next_away := case
        when away_feeder.status = 'completed' and away_feeder.home_score <> away_feeder.away_score
          then (case when away_feeder.home_score > away_feeder.away_score then away_feeder.home_team_id else away_feeder.away_team_id end)
        else null end;
    end if;

    if next_home is distinct from p.home_team_id or next_away is distinct from p.away_team_id then
      update public.event_fixtures set home_team_id = next_home, away_team_id = next_away where id = p.id;
      updated_count := updated_count + 1;
    end if;
  end loop;

  return updated_count;
end;
$$;
