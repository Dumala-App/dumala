-- Phase 6 - Knockout brackets (single elimination).
--
-- Extends the tournament engine (202607100007) from round-robin to single
-- elimination. A bracket is stored as ordinary event_fixtures: round 1 holds the
-- opening matchups (byes are pre-advanced at generation), and later-round
-- fixtures start with empty team slots that fill in as winners advance. Because
-- brackets reuse event_fixtures, they inherit stats, match-day, and scheduling.
--
-- Advancement is derivable from (round, sequence): fixture (r, s) feeds fixture
-- (r+1, ceil(s/2)) into its home slot when s is odd, away slot when s is even.
-- sync_bracket() recomputes every downstream slot from its two feeders, so it is
-- idempotent and safe to call after each result.

-- 1) Team slots become optional (a future-round fixture has no teams yet) -------

alter table public.event_fixtures alter column home_team_id drop not null;
alter table public.event_fixtures alter column away_team_id drop not null;

-- 2) Advancement RPC ----------------------------------------------------------

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

  -- Recompute each not-yet-played downstream slot from its feeders. A feeder that
  -- does not exist (a bye) leaves the pre-filled slot untouched.
  for p in
    select * from public.event_fixtures
    where event_id = target_event_id and round > 1 and status <> 'completed'
    order by round, sequence
  loop
    next_home := p.home_team_id;
    next_away := p.away_team_id;

    select * into home_feeder from public.event_fixtures
      where event_id = target_event_id and round = p.round - 1 and sequence = p.sequence * 2 - 1;
    home_found := found;
    select * into away_feeder from public.event_fixtures
      where event_id = target_event_id and round = p.round - 1 and sequence = p.sequence * 2;
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

-- 3) Grants -------------------------------------------------------------------

grant execute on function public.sync_bracket(uuid) to authenticated;
