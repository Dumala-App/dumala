-- Phase 6 - Event tenant integrity hardening.
--
-- Phase 6 event child tables store both event_id and league_id for ownership
-- checks. Bind those columns together at the database layer so a league owner
-- cannot attach rows to another league's public event by mixing a victim
-- event_id with their own league_id.

-- 1) Composite keys used by tenant-aware foreign keys -------------------------

create unique index if not exists league_events_id_league_id_uidx
on public.league_events(id, league_id);

create unique index if not exists event_registrations_id_event_league_uidx
on public.event_registrations(id, event_id, league_id);

create unique index if not exists event_teams_id_event_league_uidx
on public.event_teams(id, event_id, league_id);

create unique index if not exists event_fixtures_id_event_league_uidx
on public.event_fixtures(id, event_id, league_id);

-- 2) Event/league consistency -------------------------------------------------

alter table public.event_registrations
  add constraint event_registrations_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade;

alter table public.event_teams
  add constraint event_teams_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint event_teams_registration_event_league_fk
  foreign key (registration_id, event_id, league_id)
  references public.event_registrations(id, event_id, league_id);

alter table public.event_fixtures
  add constraint event_fixtures_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint event_fixtures_home_team_event_league_fk
  foreign key (home_team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id),
  add constraint event_fixtures_away_team_event_league_fk
  foreign key (away_team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id);

alter table public.fixture_stat_events
  add constraint fixture_stat_events_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint fixture_stat_events_fixture_event_league_fk
  foreign key (fixture_id, event_id, league_id)
  references public.event_fixtures(id, event_id, league_id),
  add constraint fixture_stat_events_team_event_league_fk
  foreign key (team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id);

alter table public.event_awards
  add constraint event_awards_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint event_awards_team_event_league_fk
  foreign key (team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id);

alter table public.event_incidents
  add constraint event_incidents_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint event_incidents_fixture_event_league_fk
  foreign key (fixture_id, event_id, league_id)
  references public.event_fixtures(id, event_id, league_id),
  add constraint event_incidents_team_event_league_fk
  foreign key (team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id);

alter table public.event_invoices
  add constraint event_invoices_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade,
  add constraint event_invoices_team_event_league_fk
  foreign key (team_id, event_id, league_id)
  references public.event_teams(id, event_id, league_id),
  add constraint event_invoices_registration_event_league_fk
  foreign key (registration_id, event_id, league_id)
  references public.event_registrations(id, event_id, league_id);

alter table public.league_ledger_entries
  add constraint league_ledger_entries_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id);

-- 3) Public event payload minimization ----------------------------------------

create or replace function public.get_public_event(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ev public.league_events%rowtype;
  league_name text;
begin
  select * into ev
  from public.league_events
  where registration_code = upper(btrim(coalesce(code, ''))) and is_public;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select name into league_name from public.leagues where id = ev.league_id;

  return jsonb_build_object(
    'found', true,
    'leagueName', league_name,
    'event', jsonb_build_object(
      'id', ev.id,
      'name', ev.name,
      'format', ev.format,
      'category', ev.category,
      'status', ev.status,
      'starts_on', ev.starts_on,
      'ends_on', ev.ends_on
    ),
    'teams', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'seed', t.seed
        )
        order by t.seed nulls last, t.name, t.id
      )
      from public.event_teams t
      where t.event_id = ev.id
        and t.league_id = ev.league_id
    ), '[]'::jsonb),
    'fixtures', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'event_id', f.event_id,
          'round', f.round,
          'sequence', f.sequence,
          'home_team_id', f.home_team_id,
          'away_team_id', f.away_team_id,
          'status', f.status,
          'home_score', f.home_score,
          'away_score', f.away_score,
          'kickoff_at', f.kickoff_at,
          'venue_id', f.venue_id,
          'stage', f.stage,
          'group_label', f.group_label
        )
        order by f.round, f.sequence nulls last, f.id
      )
      from public.event_fixtures f
      where f.event_id = ev.id
        and f.league_id = ev.league_id
    ), '[]'::jsonb),
    'stats', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'fixture_id', s.fixture_id,
          'event_id', s.event_id,
          'team_id', s.team_id,
          'player_name', s.player_name,
          'stat_type', s.stat_type,
          'minute', s.minute
        )
        order by s.minute nulls last, s.player_name, s.id
      )
      from public.fixture_stat_events s
      where s.event_id = ev.id
        and s.league_id = ev.league_id
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_public_event(text) to anon, authenticated;
